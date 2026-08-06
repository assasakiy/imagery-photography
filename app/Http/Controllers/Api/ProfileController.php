<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Services\NotificationService;
use App\Services\RuntimeSettings;
use App\Support\ContentSanitizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json([
            'user' => $this->payload($request->user()),
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'full_name' => 'sometimes|string|max:255',
            'username' => ['sometimes', 'string', 'max:255', 'regex:/^[a-zA-Z0-9_]+$/', Rule::unique('users', 'username')->ignore($user->id)],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => 'nullable|string|max:30',
            'bio' => 'nullable|string|max:1000',
            'company' => 'nullable|string|max:255',
            'occupation' => 'nullable|string|max:255',
            'website' => 'nullable|string|max:255',
            'avatar' => 'nullable|string|max:1000',
            'cover' => 'nullable|string|max:1000',
            'social_facebook' => 'nullable|string|max:500',
            'social_instagram' => 'nullable|string|max:500',
            'social_tiktok' => 'nullable|string|max:500',
            'social_whatsapp' => 'nullable|string|max:500',
            'notif_inapp' => 'sometimes|boolean',
            'notif_email' => 'sometimes|boolean',
            'notif_whatsapp' => 'sometimes|boolean',
            'notif_events' => 'nullable|array',
            'notif_events.email' => 'nullable|array',
            'notif_events.email.*' => ['nullable', 'string', Rule::in(NotificationService::CHANNEL_EVENTS['email'])],
            'notif_events.whatsapp' => 'nullable|array',
            'notif_events.whatsapp.*' => ['nullable', 'string', Rule::in(NotificationService::CHANNEL_EVENTS['whatsapp'])],
            'notif_otp_channel' => ['nullable', 'string', Rule::in(['email', 'whatsapp'])],
            'current_password' => 'required_with:password|string',
            'password' => 'sometimes|nullable|string|min:6',
        ]);

        if (isset($data['bio'])) {
            $data['bio'] = ContentSanitizer::plainText($data['bio']);
        }

        if (isset($data['password']) && $data['password'] !== '') {
            if (!Hash::check($data['current_password'], $user->password)) {
                return response()->json(['message' => 'Kata sandi saat ini salah.', 'errors' => ['current_password' => ['Kata sandi saat ini salah.']]], 422);
            }

            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        unset($data['current_password']);

        $changes = [];

        $profileKeys = ['full_name', 'bio', 'company', 'occupation', 'website', 'avatar', 'cover'];
        $profileData = array_intersect_key($data, array_flip($profileKeys));
        if (!empty($profileData)) {
            $profile = $user->profile()->firstOrNew();
            foreach ($profileData as $key => $value) {
                $old = $profile->{$key};
                if ((string) $old !== (string) $value) {
                    $changes['profile.' . $key] = ['old' => $old, 'new' => $value];
                }
            }
            $user->profile()->updateOrCreate([], $profileData);
        }

        $accountKeys = ['username', 'email', 'phone', 'password', 'notif_inapp', 'notif_email', 'notif_whatsapp', 'notif_events', 'notif_otp_channel'];
        $accountData = array_intersect_key($data, array_flip($accountKeys));
        if (!empty($accountData)) {
            foreach ($accountData as $key => $value) {
                $old = $user->getOriginal($key);
                if ((string) $old !== (string) $value) {
                    $changes[$key] = ['old' => $old, 'new' => $value];
                }
            }
            $user->update($accountData);
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
            $existing = $user->socials()->where('social_platform_id', $platform->id)->first();
            $old = $existing?->url;
            if ((string) $old !== (string) $url) {
                $changes[$field] = ['old' => $old, 'new' => $url];
            }
            if ($url) {
                $user->socials()->updateOrCreate(['social_platform_id' => $platform->id], ['url' => $url, 'is_public' => true]);
            } elseif ($existing) {
                $existing->delete();
            }
        }

        app(AuditLogger::class)->log(
            'profile.updated',
            'Profil diperbarui: ' . (empty($changes) ? 'tidak ada perubahan field' : implode(', ', array_keys($changes))),
            $user,
            $user,
            empty($changes) ? null : json_encode(array_column($changes, 'old')),
            empty($changes) ? null : json_encode(array_column($changes, 'new'))
        );

        return response()->json([
            'user' => $this->payload($user->fresh()),
        ]);
    }

    public function checkUsername(Request $request)
    {
        $data = $request->validate([
            'username' => 'required|string|max:255',
        ]);

        $username = trim($data['username']);
        $available = !\App\Models\User::where('username', $username)->exists();

        return response()->json([
            'username' => $username,
            'available' => $available,
        ]);
    }

    public function destroy(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'password' => 'required|string',
        ]);

        if (!Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Kata sandi salah.', 'errors' => ['password' => ['Kata sandi salah.']]], 422);
        }

        if ($user->isOwner()) {
            return response()->json(['message' => 'Akun pemilik tidak dapat dihapus.'], 422);
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $user->teamMember()?->delete();
        $user->softDeleteBy('dihapus oleh user');

        return response()->json(['ok' => true]);
    }

    private function payload($user): array
    {
        return [
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->primaryRole(),
            'roles' => $user->getRoleNames()->values(),
            'bio' => $user->bio,
            'company' => $user->company,
            'occupation' => $user->occupation,
            'website' => $user->website,
            'avatar' => $user->avatar(),
            'cover' => $user->cover(),
            'socials' => $user->socials()->with('platform')->get()->map(fn ($s) => [
                'slug' => $s->platform?->slug,
                'url' => $s->url,
            ])->values(),
            'social_facebook' => $this->socialUrl($user, 'facebook'),
            'social_instagram' => $this->socialUrl($user, 'instagram'),
            'social_tiktok' => $this->socialUrl($user, 'tiktok'),
            'social_whatsapp' => $this->socialUrl($user, 'whatsapp'),
            'notif_inapp' => $user->notif_inapp,
            'notif_email' => $user->notif_email,
            'notif_whatsapp' => $user->notif_whatsapp,
            'notif_events' => $user->notif_events ?? [],
            'notif_otp_channel' => $user->notif_otp_channel,
            'notif' => $this->notifMeta($user),
            'created_at' => $user->created_at,
        ];
    }

    private function socialUrl($user, string $slug): ?string
    {
        return $user->socials()->whereHas('platform', fn ($q) => $q->where('slug', $slug))->value('url');
    }

    private function notifMeta($user): array
    {
        $settings = app(RuntimeSettings::class);
        $service = app(NotificationService::class);

        return [
            'email_configured' => $settings->emailConfigured(),
            'whatsapp_configured' => $settings->whatsappConfigured(),
            'email_enabled' => $settings->channelEnabled('email'),
            'whatsapp_enabled' => $settings->channelEnabled('whatsapp'),
            'events' => [
                'email' => $service->channelEvents('email'),
                'whatsapp' => $service->channelEvents('whatsapp'),
            ],
            'user_events' => $user->notif_events ?? [],
            'otp_channel' => $user->notif_otp_channel,
        ];
    }
}
