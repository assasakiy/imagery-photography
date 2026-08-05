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
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => 'nullable|string|max:30',
            'bio' => 'nullable|string|max:1000',
            'avatar_url' => 'nullable|string|max:1000',
            'cover_url' => 'nullable|string|max:1000',
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

        foreach ($data as $key => $value) {
            if ($key === 'password' || $key === 'notif_events') {
                continue;
            }
            $old = $user->getOriginal($key);
            if ((string) $old !== (string) $value) {
                $changes[$key] = ['old' => $old, 'new' => $value];
            }
        }

        $user->update($data);

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
        $user->client()?->delete();
        $user->delete();

        return response()->json(['ok' => true]);
    }

    private function payload($user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->getRoleNames()->first() ?? $user->role,
            'bio' => $user->bio,
            'avatar' => $user->resolveAvatarUrl(),
            'cover' => $user->resolveCoverUrl(),
            'social_facebook' => $user->social_facebook,
            'social_instagram' => $user->social_instagram,
            'social_tiktok' => $user->social_tiktok,
            'social_whatsapp' => $user->social_whatsapp,
            'notif_inapp' => $user->notif_inapp,
            'notif_email' => $user->notif_email,
            'notif_whatsapp' => $user->notif_whatsapp,
            'notif_events' => $user->notif_events ?? [],
            'notif_otp_channel' => $user->notif_otp_channel,
            'notif' => $this->notifMeta($user),
            'created_at' => $user->created_at,
        ];
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
