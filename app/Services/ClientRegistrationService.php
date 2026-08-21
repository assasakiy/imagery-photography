<?php

namespace App\Services;

use App\Models\ClientAccessToken;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Pusat pembuatan & pengelolaan akun (client/admin/dll) + invite aktivasi.
 */
class ClientRegistrationService
{
    /**
     * Pastikan user ber-role $role ada (by email/phone). Buat bila tak ada.
     */
    public function ensureUser(array $data, string $role = 'client'): User
    {
        $user = $this->findUser($data);

        if (!$user) {
            $user = $this->createUser($data, $role);
        }

        return $user;
    }

    /**
     * Buat user pending + invite link set-password (kirim/salin).
     */
    public function registerWithInvite(array $data, string $role = 'client', ?int $expiresHours = null, $actor = null): array
    {
        $user = $this->findUser($data);

        if (!$user) {
            $user = $this->createUser($data, $role);
        } else {
            if (!$user->hasRole($role)) {
                $user->assignRole($role);
            }

            if ($user->status === 'pending' && !$user->phone && !empty($data['phone'])) {
                $user->update(['phone' => $data['phone']]);
            }
        }

        $isNew = $user->wasRecentlyCreated;

        $invite = null;
        if ($user->status !== 'active') {
            $invite = $this->issueInvite($user, $expiresHours, $actor);
        }

        return ['user' => $user, 'invite' => $invite, 'new' => $isNew];
    }

    /**
     * Terbitkan token invite, batalkan invite pending sebelumnya, kirim link.
     */
    public function issueInvite(User $user, ?int $expiresHours = null, $actor = null): ClientAccessToken
    {
        $creatorType = is_object($actor) ? get_class($actor) : null;
        $creatorId = $actor?->id ?? null;

        $user->accessTokens()
            ->where('purpose', 'invite')
            ->where('status', 'pending')
            ->update(['status' => 'cancelled']);

        $token = ClientAccessToken::createToken($user, 'invite', $creatorType, $creatorId, $expiresHours);

        app(NotificationService::class)->send(
            NotificationType::ACCOUNT_INVITE,
            $user,
            ['name' => $user->name, 'url' => $token->url]
        );

        app(AuditLogger::class)->log('client.invite_issued', 'Undangan dikirim untuk ' . $user->name, $user);

        return $token;
    }

    /**
     * Aktivasi: password → status active. Username/full_name tidak diubah (sudah diatur saat create).
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

    private function findUser(array $data): ?User
    {
        if (!empty($data['email'])) {
            return User::where('email', $data['email'])->first();
        }

        if (!empty($data['phone'])) {
            return User::where('phone', $data['phone'])->first();
        }

        if (!empty($data['username'])) {
            return User::where('username', $data['username'])->first();
        }

        return null;
    }

    /**
     * Buat user baru tanpa invite (dipakai untuk registrasi formal publik).
     * Role default: client (otomatis juga subscriber).
     */
    public function createUser(array $data, string $role = 'client'): User
    {
        return $this->createUserInternal($data, $role);
    }

    private function createUserInternal(array $data, string $role): User
    {
        $username = $this->uniqueUsername($data['username'] ?? null);
        $email = $data['email'] ?? ('client_' . Str::random(8) . '@imagery.local');

        $user = User::create([
            'username' => $username,
            'email' => $email,
            'phone' => $data['phone'] ?? null,
            'password' => null,
            'status' => 'pending',
        ]);
        $user->assignRole(array_values(array_unique(array_filter([$role, 'subscriber']))));

        $user->profile()->create([
            'full_name' => $data['name'] ?? $data['full_name'] ?? null,
            'bio' => $data['bio'] ?? null,
            'company' => $data['company'] ?? null,
            'occupation' => $data['occupation'] ?? null,
        ]);

        return $user;
    }

    private function uniqueUsername(?string $preferred): string
    {
        $base = $preferred ? Str::lower(preg_replace('/[^a-z0-9_]/', '', $preferred)) : null;
        if (!$base) {
            $base = 'user' . Str::lower(Str::random(8));
        }

        $username = $base;
        $i = 1;
        while (User::where('username', $username)->exists()) {
            $username = $base . $i;
            $i++;
        }

        return $username;
    }
}