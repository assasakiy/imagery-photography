<?php

namespace App\Services;

use App\Models\Client;
use App\Models\ClientAccessToken;
use App\Models\User;
use App\Support\ContentSanitizer;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Pusat pembuatan & pengelolaan akun client.
 * Dipakai booking, admin, API, import, dst — hindari duplikasi logika.
 */
class ClientRegistrationService
{
    /**
     * Pastikan client memiliki user aktif/pending. Buat bila belum ada.
     * Return: ['client' => Client, 'user' => User, 'invite' => ?ClientAccessToken, 'new' => bool].
     */
    public function ensureActiveClient(array $data): array
    {
        $client = $this->findClient($data);

        if ($client && $client->user) {
            return [
                'client' => $client,
                'user' => $client->user,
                'invite' => null,
                'new' => false,
            ];
        }

        $client = $client ?: $this->createClient($data);
        $user = $client->user ?: $this->createUser($client, $data);

        return [
            'client' => $client,
            'user' => $user,
            'invite' => null,
            'new' => false,
        ];
    }

    /**
     * Buat client baru beserta user pending + invite link set-password.
     */
    public function registerWithInvite(array $data, ?int $expiresHours = null, $actor = null): array
    {
        $client = $this->findClient($data);

        if ($client && $client->user) {
            return $this->reuseOrReissue($client, $expiresHours, $actor);
        }

        $client = $client ?: $this->createClient($data);
        $user = $client->user ?: $this->createUser($client, $data);
        $client->unsetRelation('user');
        $client->setRelation('user', $user);

        $invite = $this->issueInvite($client, $expiresHours, $actor);

        return [
            'client' => $client,
            'user' => $user,
            'invite' => $invite,
            'new' => true,
        ];
    }

    private function reuseOrReissue(Client $client, ?int $expiresHours, $actor): array
    {
        $user = $client->user;

        // User pending dengan invite masih valid → jangan buat akun/invite baru.
        if ($user->isPending()) {
            $pending = $client->accessTokens()
                ->where('purpose', 'invite')
                ->where('status', 'pending')
                ->valid()
                ->first();

            if ($pending) {
                return ['client' => $client, 'user' => $user, 'invite' => $pending, 'new' => false];
            }
        }

        // User disabled/pending tanpa invite valid → buat invite baru (reissue).
        $invite = $this->issueInvite($client, $expiresHours, $actor);

        return ['client' => $client, 'user' => $user, 'invite' => $invite, 'new' => false];
    }

    /**
     * Terbitkan token invite (status pending) + kirim link set-password.
     */
    public function issueInvite(Client $client, ?int $expiresHours = null, $actor = null): ClientAccessToken
    {
        $creatorType = is_object($actor) ? get_class($actor) : null;
        $creatorId = $actor?->id ?? null;

        // Invalidasikan token invite lama yang belum dipakai.
        $client->accessTokens()
            ->where('purpose', 'invite')
            ->where('status', 'pending')
            ->update(['status' => 'cancelled']);

        $client->load('user');
        $token = ClientAccessToken::createToken($client, $client->user, 'invite', $creatorType, $creatorId, $expiresHours);

        if ($client->user) {
            app(NotificationService::class)->send(
                NotificationType::ACCOUNT_INVITE,
                $client->user,
                ['name' => $client->name, 'url' => $token->url]
            );
        }

        app(AuditLogger::class)->log(
            'client.invite_issued',
            'Undangan dikirim untuk ' . $client->name,
            $client
        );

        return $token;
    }

    /**
     * Aktivasi user: set password → status active + activated_at; token invite → accepted.
     */
    public function activate(User $user, string $password): void
    {
        $user->update([
            'password' => Hash::make($password),
            'status' => 'active',
            'activated_at' => now(),
        ]);

        ClientAccessToken::where('user_id', $user->id)
            ->where('purpose', 'invite')
            ->where('status', 'pending')
            ->update(['status' => 'accepted', 'used_at' => now()]);

        app(AuditLogger::class)->log('client.activated', 'Akun diaktifkan: ' . $user->email, $user);
    }

    private function findClient(array $data): ?Client
    {
        if (!empty($data['client_id'])) {
            return Client::find($data['client_id']);
        }

        if (!empty($data['email'])) {
            $byUser = User::where('email', $data['email'])->value('id');
            if ($byUser) {
                return Client::where('user_id', $byUser)->first();
            }
            $byClient = Client::where('email', $data['email'])->first();
            if ($byClient) {
                return $byClient;
            }
        }

        if (!empty($data['phone'])) {
            $byPhone = Client::where('phone', $data['phone'])->first();
            if ($byPhone) {
                return $byPhone;
            }
        }

        return null;
    }

    private function createClient(array $data): Client
    {
        return Client::create([
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'notes' => ContentSanitizer::plainText($data['notes'] ?? ''),
        ]);
    }

    private function createUser(Client $client, array $data): User
    {
        $user = User::create([
            'name' => $client->name,
            'email' => $client->email ?? ('client_' . Str::random(8) . '@imagery.local'),
            'phone' => $client->phone,
            'password' => null,
            'role' => 'client',
            'status' => 'pending',
        ]);
        $user->assignRole(['client', 'subscriber']);

        $client->update(['user_id' => $user->id]);

        return $user;
    }
}