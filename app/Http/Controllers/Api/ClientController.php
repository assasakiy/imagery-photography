<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClientAccessToken;
use App\Services\AuditLogger;
use App\Models\Client;
use App\Services\NotificationService;
use App\Services\NotificationType;
use App\Support\ContentSanitizer;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $query = Client::with(['projects', 'user:id,name,email,status']);

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

        $reg = app(\App\Services\ClientRegistrationService::class);
        $result = $reg->registerWithInvite(
            ['name' => $data['name'], 'email' => $data['email'], 'phone' => $data['phone'], 'notes' => $data['notes']],
            null,
            $request->user()
        );

        $client = $result['client'];
        if (!empty($data['company'])) {
            $client->update(['company' => $data['company']]);
        }

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
            'expires_hours' => 'nullable|integer|in:6,12,24,48,72',
        ]);

        if (!in_array($purpose, ClientAccessToken::PURPOSES, true)) {
            abort(422, 'Purpose token tidak dikenal.');
        }

        $reg = app(\App\Services\ClientRegistrationService::class);

        // Buat user pending bila client belum punya akun (tanpa password → invite aktivasi).
        if (!$client->user) {
            $result = $reg->registerWithInvite(
                ['name' => $client->name, 'email' => $client->email, 'phone' => $client->phone],
                $data['expires_hours'] ?? null,
                $request->user()
            );
            $client = $result['client'];
        } elseif (!$client->user->phone && $client->phone) {
            $client->user->update(['phone' => $client->phone]);
        }

        $creator = $request->user();

        $token = ClientAccessToken::createToken(
            $client,
            $client->user,
            $purpose,
            is_object($creator) ? get_class($creator) : null,
            $creator->id ?? null,
            $purpose === 'invite' ? ($data['expires_hours'] ?? null) : null
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
     * Nonaktifkan akun client (status disabled).
     */
    public function disable(Request $request, Client $client)
    {
        $client->user?->update(['status' => 'disabled']);
        app(AuditLogger::class)->log('client.disabled', 'Akun klien dinonaktifkan: ' . $client->name, $client);

        return response()->json($client->load(['projects', 'user:id,name,email,status']));
    }

    /**
     * Aktifkan kembali akun client (status active).
     */
    public function activate(Request $request, Client $client)
    {
        $client->user?->update(['status' => 'active', 'activated_at' => now()]);
        app(AuditLogger::class)->log('client.activated_admin', 'Akun klien diaktifkan: ' . $client->name, $client);

        return response()->json($client->load(['projects', 'user:id,name,email,status']));
    }

    /**
     * Soft delete user + client (masuk Recycle Bin), dengan alasan opsional.
     */
    public function softDelete(Request $request, Client $client)
    {
        $data = $request->validate(['reason' => 'nullable|string|max:500']);
        $reason = $data['reason'] ?? null;

        $client->user?->softDeleteBy($reason);
        $client->softDeleteBy($reason);

        app(AuditLogger::class)->log('client.soft_deleted', 'Klien dipindah ke recycle bin: ' . $client->name . ($reason ? " (alasan: $reason)" : ''), $client, null, null, $reason);

        return response()->json(['ok' => true]);
    }

    /**
     * Daftar klien ter-soft-delete (Recycle Bin).
     */
    public function trashed(Request $request)
    {
        $query = Client::with(['user:id,name,email,status'])->onlyTrashed();

        if ($request->filled('search')) {
            $query->where(fn ($q) => $q
                ->where('name', 'like', '%' . $request->input('search') . '%')
                ->orWhere('email', 'like', '%' . $request->input('search') . '%'));
        }

        return response()->json($query->latest()->paginate(15));
    }

    /**
     * Pulihkan dari Recycle Bin.
     */
    public function restore(Request $request, Client $client)
    {
        $client->restore();
        $client->user?->restore();

        app(AuditLogger::class)->log('client.restored', 'Klien dipulihkan dari recycle bin: ' . $client->name, $client);

        return response()->json(['ok' => true]);
    }

    /**
     * Hapus permanen (user + client). Hanya owner/admin.
     */
    public function forceDelete(Request $request, Client $client)
    {
        $client->user?->forceDelete();
        $client->forceDelete();

        app(AuditLogger::class)->log('client.force_deleted', 'Klien dihapus permanen: ' . $client->name, $client);

        return response()->json(['ok' => true]);
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
                'status' => $user->status,
                'has_password' => !empty($user->password),
            ] : null,
            'tokens' => ClientAccessToken::where('client_id', $client->id)
                ->orderByDesc('created_at')
                ->take(10)
                ->get(['token', 'purpose', 'expires_at', 'used_at', 'created_at']),
        ]);
    }
}
