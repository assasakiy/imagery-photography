<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClientAccessToken;
use App\Services\AuditLogger;
use App\Models\Client;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\NotificationType;
use App\Support\ContentSanitizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $query = Client::with(['projects', 'user:id,name,email']);

        if ($request->filled('search')) {
            $query->where(fn ($q) => $q
                ->where('name', 'like', '%' . $request->input('search') . '%')
                ->orWhere('email', 'like', '%' . $request->input('search') . '%')
                ->orWhere('phone', 'like', '%' . $request->input('search') . '%'));
        }

        return response()->json($query->latest()->paginate(15));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'company' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $data['notes'] = ContentSanitizer::plainText($data['notes'] ?? '');

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'] ?? ('client_' . Str::random(8) . '@imagery.local'),
            'password' => Hash::make(Str::random(16)),
            'role' => 'client',
        ]);
        $user->assignRole(['client', 'subscriber']);

        $client = Client::create(array_merge($data, ['user_id' => $user->id]));
        app(\App\Services\AuditLogger::class)->log('client.created', 'Klien dibuat', $client);

        return response()->json($client->load('projects'), 201);
    }

    public function update(Request $request, Client $client)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'company' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $data['notes'] = ContentSanitizer::plainText($data['notes'] ?? '');

        $client->update($data);
        app(\App\Services\AuditLogger::class)->log('client.updated', 'Klien diperbarui', $client);

        if ($client->user) {
            $userData = ['name' => $data['name']];
            if (!empty($data['email'])) {
                $userData['email'] = $data['email'];
            }
            $client->user->update($userData);
        }

        return response()->json($client->load(['projects', 'user:id,name,email']));
    }

    public function destroy(Client $client)
    {
        $client->delete();
        app(\App\Services\AuditLogger::class)->log('client.deleted', 'Klien dihapus', $client);

        return response()->json(['ok' => true]);
    }

    /**
     * Terbitkan token akses utk client. Input $purpose: invite|recovery|project.
     */
    public function issueToken(Request $request, Client $client, string $purpose)
    {
        $data = $request->validate([
            'send' => 'nullable|boolean',
            'message' => 'nullable|string|max:500',
        ]);

        if (!in_array($purpose, ClientAccessToken::PURPOSES, true)) {
            abort(422, 'Purpose token tidak dikenal.');
        }

        if (!$client->user) {
            $user = User::create([
                'name' => $client->name,
                'email' => $client->email ?? ('client_' . Str::random(8) . '@imagery.local'),
                'phone' => $client->phone,
                'password' => Hash::make(Str::random(16)),
                'role' => 'client',
            ]);
            $user->assignRole(['client', 'subscriber']);
            $client->update(['user_id' => $user->id]);
        } elseif (!$client->user->phone && $client->phone) {
            $client->user->update(['phone' => $client->phone]);
        }

        $creator = $request->user();

        $token = ClientAccessToken::createToken(
            $client,
            $client->user,
            $purpose,
            is_object($creator) ? get_class($creator) : null,
            $creator->id ?? null
        );

        if ($request->boolean('send')) {
            $type = match ($purpose) {
                'invite' => NotificationType::ACCOUNT_INVITE,
                'recovery' => NotificationType::PASSWORD_RESET,
                default => NotificationType::MAGIC_LINK,
            };
            app(NotificationService::class)->send($type, $client->user, [
                'name' => $client->name,
                'url' => $token->url,
                'message' => $data['message'] ?? null,
            ]);
        }

        app(AuditLogger::class)->log('client.token_issued', 'Token ' . $purpose . ' dibuat utk ' . $client->name, $token);

        return response()->json([
            'url' => $token->url,
            'purpose' => $token->purpose,
            'expires_at' => $token->expires_at,
            'sent' => $request->boolean('send'),
        ]);
    }

    /**
     * Informasi kredensial & akses utk modal halaman Klien (read-only + sedikit).
     */
    public function credentials(Client $client)
    {
        $user = $client->user;

        return response()->json([
            'client_id' => $client->id,
            'name' => $client->name,
            'email' => $client->email,
            'phone' => $client->phone,
            'user' => $user ? [
                'id' => $user->id,
                'email' => $user->email,
                'has_password' => !empty($user->password),
            ] : null,
            'tokens' => ClientAccessToken::where('client_id', $client->id)
                ->orderByDesc('created_at')
                ->take(10)
                ->get(['token', 'purpose', 'expires_at', 'used_at', 'created_at']),
        ]);
    }
}
