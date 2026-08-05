<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Models\Client;
use App\Models\User;
use App\Support\ContentSanitizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $query = Client::with(['projects', 'user:id,name,email,login_method,allowed_methods']);

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
            'allowed_methods' => 'nullable|array',
            'allowed_methods.*' => 'nullable|in:password,otp,google,token',
        ]);

        $data['notes'] = ContentSanitizer::plainText($data['notes'] ?? '');

        $client->update($data);
        app(\App\Services\AuditLogger::class)->log('client.updated', 'Klien diperbarui', $client);

        if ($client->user) {
            $userData = ['name' => $data['name']];
            if (!empty($data['email'])) {
                $userData['email'] = $data['email'];
            }
            if (array_key_exists('allowed_methods', $data)) {
                $userData['allowed_methods'] = $data['allowed_methods'] ?: null;
                $userData['login_method'] = $data['allowed_methods'] ? 'custom' : null;
            }
            $client->user->update($userData);
        }

        return response()->json($client->load(['projects', 'user:id,name,email,login_method,allowed_methods']));
    }

    public function destroy(Client $client)
    {
        $client->delete();
        app(\App\Services\AuditLogger::class)->log('client.deleted', 'Klien dihapus', $client);

        return response()->json(['ok' => true]);
    }
}
