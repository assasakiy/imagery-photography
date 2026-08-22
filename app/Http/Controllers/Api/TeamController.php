<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\ClientRegistrationService;
use App\Services\NotificationService;
use App\Services\NotificationType;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    public function index()
    {
        $users = User::role(['owner', 'admin'])
            ->with('profile')
            ->orderBy('id')
            ->get();

        return response()->json($users->map(fn ($u) => $this->serialize($u)));
    }

    public function store(Request $request)
    {
        $settings = app(\App\Services\RuntimeSettings::class);
        $emailEnabled = $settings->channelEnabled('email');
        $waEnabled = $settings->channelEnabled('whatsapp');

        $emailRule = $emailEnabled && !$waEnabled ? 'required' : 'required_without:phone';
        $phoneRule = $waEnabled && !$emailEnabled ? 'required' : 'required_without:email';

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => "{$emailRule}|nullable|email|max:255|unique:users,email",
            'phone' => "{$phoneRule}|nullable|string|max:30|unique:users,phone",
            'company' => 'nullable|string|max:255',
            'occupation' => 'nullable|string|max:255',
        ]);

        $result = app(ClientRegistrationService::class)->registerWithInvite(
            [
                'name' => $data['name'],
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
                'company' => $data['company'] ?? null,
                'occupation' => $data['occupation'] ?? null,
            ],
            'admin',
            null,
            $request->user()
        );

        $user = $result['user'];

        app(AuditLogger::class)->log('team.created', 'Admin diundang: ' . $user->name . ' (' . ($data['email'] ?? $data['phone']) . ')', $user);

        return response()->json([
            'admin' => $this->serialize($user),
            'invite' => $result['invite'] ? [
                'url' => $result['invite']->url,
                'expires_at' => $result['invite']->expires_at,
            ] : null,
            'credentials' => $this->credentialsPayload($user),
        ], 201);
    }

    public function update(Request $request, User $user)
    {
        $this->ensureManaged($user);

        $settings = app(\App\Services\RuntimeSettings::class);
        $emailEnabled = $settings->channelEnabled('email');
        $waEnabled = $settings->channelEnabled('whatsapp');

        $emailRule = $emailEnabled && !$waEnabled ? 'required' : 'required_without:phone';
        $phoneRule = $waEnabled && !$emailEnabled ? 'required' : 'required_without:email';

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'username' => ['sometimes', 'string', 'max:255', 'regex:/^[a-zA-Z0-9_]+$/', \Illuminate\Validation\Rule::unique('users', 'username')->ignore($user->id)],
            'email' => "{$emailRule}|nullable|email|max:255|unique:users,email," . $user->id,
            'phone' => "{$phoneRule}|nullable|string|max:30|unique:users,phone," . $user->id,
            'company' => 'nullable|string|max:255',
            'occupation' => 'nullable|string|max:255',
            'bio' => 'nullable|string|max:1000',
            'avatar' => 'nullable|string|max:1000',
            'status' => ['sometimes', 'string', \Illuminate\Validation\Rule::in(['pending', 'active', 'disabled'])],
        ]);

        if (isset($data['bio'])) {
            $data['bio'] = \App\Support\ContentSanitizer::plainText($data['bio']);
        }

        $user->update(collect($data)->only('email', 'phone', 'username', 'status')->all());

        $this->updateProfile($user, [
            'full_name' => $data['name'],
            'company' => $data['company'] ?? null,
            'occupation' => $data['occupation'] ?? null,
            'bio' => $data['bio'] ?? null,
            'avatar' => $data['avatar'] ?? null,
        ]);

        app(AuditLogger::class)->log('team.updated', 'Admin diperbarui: ' . $user->name, $user);

        return response()->json(['admin' => $this->serialize($user->fresh(['profile', 'socials.platform']))]);
    }

    public function destroy(User $user)
    {
        if ($user->isOwner()) {
            return response()->json(['message' => 'Owner tidak dapat dihapus.'], 422);
        }

        $this->ensureManaged($user);

        $user->tokens()->delete();
        \Illuminate\Support\Facades\DB::table('sessions')->where('user_id', $user->id)->delete();
        $user->softDeleteBy('dihapus oleh admin');

        app(AuditLogger::class)->log('team.deleted', 'Admin dihapus: ' . $user->name);

        return response()->json(['ok' => true]);
    }

    private function ensureManaged(User $user): void
    {
        if ($user->isOwner()) {
            abort(422, 'Owner tidak dapat diubah lewat sini.');
        }
    }

    public function credentials(User $user)
    {
        $this->ensureManaged($user);

        return response()->json($this->credentialsPayload($user));
    }

    public function issueToken(Request $request, User $user, string $purpose)
    {
        $this->ensureManaged($user);

        $data = $request->validate([
            'send' => 'nullable|boolean',
            'message' => 'nullable|string|max:500',
            'expires_hours' => 'nullable|integer|in:6,12,24,48,72',
        ]);

        if (!in_array($purpose, \App\Models\ClientAccessToken::PURPOSES, true)) {
            abort(422, 'Purpose token tidak dikenal.');
        }

        $creator = $request->user();

        // Jika hanya salin link (send = false), usahakan re-use token yang masih valid.
        if (!$request->boolean('send')) {
            $existing = \App\Models\ClientAccessToken::where('user_id', $user->id)
                ->where('purpose', $purpose)
                ->where('status', 'pending')
                ->valid()
                ->latest()
                ->first();

            if ($existing) {
                app(AuditLogger::class)->log('team.token_reused', 'Token ' . $purpose . ' digunakan ulang (salin) utk ' . $user->name, $existing);
                return response()->json([
                    'url' => $existing->url,
                    'purpose' => $existing->purpose,
                    'expires_at' => $existing->expires_at,
                    'sent' => false,
                ]);
            }
        }

        // Jika dikirim ulang (send = true) ATAU tak ada yang valid, batalkan yang lama.
        \App\Models\ClientAccessToken::where('user_id', $user->id)
            ->where('purpose', $purpose)
            ->where('status', 'pending')
            ->update(['status' => 'cancelled']);

        $token = \App\Models\ClientAccessToken::createToken(
            $user,
            $purpose,
            is_object($creator) ? get_class($creator) : null,
            $creator?->id,
            $purpose === 'invite' ? ($data['expires_hours'] ?? null) : null
        );

        if ($request->boolean('send')) {
            $type = match ($purpose) {
                'invite' => NotificationType::ACCOUNT_INVITE,
                'recovery' => NotificationType::PASSWORD_RESET,
                default => NotificationType::MAGIC_LINK,
            };
            app(NotificationService::class)->send($type, $user, [
                'name' => $user->name,
                'url' => $token->url,
                'message' => $data['message'] ?? null,
            ]);
        }

        app(AuditLogger::class)->log('team.token_issued', 'Token ' . $purpose . ' dibuat utk ' . $user->name, $token);

        return response()->json([
            'url' => $token->url,
            'purpose' => $token->purpose,
            'expires_at' => $token->expires_at,
            'sent' => $request->boolean('send'),
        ]);
    }

    private function credentialsPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->status,
            'has_password' => !empty($user->password),
            'avatar' => $user->avatar(),
            'bio' => $user->bio,
            'company' => $user->company,
            'occupation' => $user->occupation,
            'website' => $user->website,
            'social_facebook' => $this->socialUrl($user, 'facebook'),
            'social_instagram' => $this->socialUrl($user, 'instagram'),
            'social_tiktok' => $this->socialUrl($user, 'tiktok'),
            'social_whatsapp' => $this->socialUrl($user, 'whatsapp'),
            'projects' => $user->projects()
                ->get(['id', 'name', 'status', 'event_date'])
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'status' => $p->status,
                    'event_date' => $p->event_date,
                ])->values(),
            'tokens' => $user->accessTokens()
                ->orderByDesc('created_at')
                ->take(20)
                ->get(['token', 'purpose', 'status', 'expires_at', 'used_at', 'created_at'])
                ->map(fn ($t) => [
                    'purpose' => $t->purpose,
                    'status' => $t->status,
                    'expires_at' => $t->expires_at,
                    'used_at' => $t->used_at,
                    'created_at' => $t->created_at,
                    'url' => $t->url,
                ]),
        ];
    }

    private function socialUrl(User $user, string $slug): ?string
    {
        return $user->socials()->whereHas('platform', fn ($q) => $q->where('slug', $slug))->value('url');
    }

    private function serialize(User $user): array
    {
        $socials = $user->socials()->with('platform')->get()->keyBy('platform.slug');

        return [
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->status,
            'role' => $user->primaryRole(),
            'bio' => $user->bio,
            'company' => $user->company,
            'occupation' => $user->occupation,
            'website' => $user->website,
            'avatar' => $user->avatar(),
            'social_facebook' => $socials->get('facebook')?->url,
            'social_instagram' => $socials->get('instagram')?->url,
            'social_tiktok' => $socials->get('tiktok')?->url,
            'social_whatsapp' => $socials->get('whatsapp')?->url,
            'online' => $user->isOnline(),
            'last_seen_at' => $user->last_seen_at?->toIso8601String(),
            'created_at' => $user->created_at,
        ];
    }

    private function updateProfile(User $user, array $data): void
    {
        $profileFields = array_intersect_key($data, array_flip([
            'full_name', 'company', 'occupation', 'website', 'bio', 'avatar',
        ]));
        if (!empty($profileFields)) {
            $user->profile()->updateOrCreate([], $profileFields);
        }

        $socialMap = [
            'social_facebook' => 'facebook',
            'social_instagram' => 'instagram',
            'social_tiktok' => 'tiktok',
            'social_whatsapp' => 'whatsapp',
        ];
        foreach ($socialMap as $field => $slug) {
            if (!array_key_exists($field, $data)) {
                continue;
            }
            $url = $data[$field] ?? null;
            $platform = \App\Models\SocialPlatform::firstOrCreate(
                ['slug' => $slug],
                ['name' => ucfirst($slug), 'icon' => $slug, 'base_url' => 'https://' . $slug . '.com/']
            );
            if ($url) {
                $user->socials()->updateOrCreate(['social_platform_id' => $platform->id], ['url' => $url, 'is_public' => true]);
            } else {
                $user->socials()->where('social_platform_id', $platform->id)->delete();
            }
        }
    }
}