<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClientAccessToken;
use App\Services\AuditLogger;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\NotificationType;
use App\Services\ClientRegistrationService;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $query = User::role('client')
            ->with('profile')
            ->withCount('projects');

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(fn ($q) => $q
                ->where('email', 'like', '%' . $s . '%')
                ->orWhere('phone', 'like', '%' . $s . '%')
                ->orWhere('username', 'like', '%' . $s . '%')
                ->orWhereHas('profile', fn ($p) => $p->where('full_name', 'like', '%' . $s . '%')));
        }

        $users = $query->latest()->paginate(15);

        $users->getCollection()->transform(fn ($u) => $this->serialize($u));

        return response()->json($users);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255|required_without:phone',
            'phone' => 'nullable|string|max:20|required_without:email',
            'company' => 'nullable|string|max:255',
            'occupation' => 'nullable|string|max:255',
        ]);

        $reg = app(ClientRegistrationService::class);
        $result = $reg->registerWithInvite(
            [
                'name' => $data['name'],
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
                'company' => $data['company'] ?? null,
                'occupation' => $data['occupation'] ?? null,
            ],
            'client',
            null,
            $request->user()
        );

        $user = $result['user'];

        app(AuditLogger::class)->log('client.created', 'Klien dibuat: ' . $user->name, $user);

        return response()->json([
            'user' => $this->serialize($user->loadCount('projects')),
            'invite' => [
                'url' => $result['invite']->url,
                'expires_at' => $result['invite']->expires_at,
            ],
            'credentials' => $this->credentialsPayload($user),
        ], 201);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'username' => ['sometimes', 'string', 'max:255', 'regex:/^[a-zA-Z0-9_]+$/', \Illuminate\Validation\Rule::unique('users', 'username')->ignore($user->id)],
            'email' => 'nullable|email|max:255|required_without:phone|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20|required_without:email|unique:users,phone,' . $user->id,
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

        app(AuditLogger::class)->log('client.updated', 'Klien diperbarui: ' . $user->name, $user);

        return response()->json($this->serialize($user->loadCount('projects')));
    }

    public function issueToken(Request $request, User $user, string $purpose)
    {
        $data = $request->validate([
            'send' => 'nullable|boolean',
            'message' => 'nullable|string|max:500',
            'expires_hours' => 'nullable|integer|in:6,12,24,48,72',
        ]);

        if (!in_array($purpose, ClientAccessToken::PURPOSES, true)) {
            abort(422, 'Purpose token tidak dikenal.');
        }

        $creator = $request->user();

        $token = ClientAccessToken::createToken(
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

        app(AuditLogger::class)->log('client.token_issued', 'Token ' . $purpose . ' dibuat utk ' . $user->name, $token);

        return response()->json([
            'url' => $token->url,
            'purpose' => $token->purpose,
            'expires_at' => $token->expires_at,
            'sent' => $request->boolean('send'),
        ]);
    }

    public function disable(Request $request, User $user)
    {
        $user->update(['status' => 'disabled']);
        app(AuditLogger::class)->log('client.disabled', 'Akun klien dinonaktifkan: ' . $user->name, $user);

        return response()->json($this->serialize($user->loadCount('projects')));
    }

    public function activate(Request $request, User $user)
    {
        $user->update(['status' => 'active', 'activated_at' => now()]);
        app(AuditLogger::class)->log('client.activated_admin', 'Akun klien diaktifkan: ' . $user->name, $user);

        return response()->json($this->serialize($user->loadCount('projects')));
    }

    public function softDelete(Request $request, User $user)
    {
        $data = $request->validate(['reason' => 'nullable|string|max:500']);
        $reason = $data['reason'] ?? null;

        $user->softDeleteBy($reason);

        app(AuditLogger::class)->log('client.soft_deleted', 'Klien dipindah ke recycle bin: ' . $user->name . ($reason ? " (alasan: $reason)" : ''), $user, null, null, $reason);

        return response()->json(['ok' => true]);
    }

    public function trashed(Request $request)
    {
        $query = User::role('client')->onlyTrashed()->with('profile');

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(fn ($q) => $q
                ->where('email', 'like', '%' . $s . '%')
                ->orWhere('username', 'like', '%' . $s . '%')
                ->orWhereHas('profile', fn ($p) => $p->where('full_name', 'like', '%' . $s . '%')));
        }

        $users = $query->latest()->paginate(15);
        $users->getCollection()->transform(fn ($u) => $this->serialize($u));

        return response()->json($users);
    }

    public function restore(Request $request, User $user)
    {
        $user->restore();
        app(AuditLogger::class)->log('client.restored', 'Klien dipulihkan dari recycle bin: ' . $user->name, $user);

        return response()->json(['ok' => true]);
    }

    public function forceDelete(Request $request, User $user)
    {
        $user->forceDelete();
        app(AuditLogger::class)->log('client.force_deleted', 'Klien dihapus permanen: ' . $user->name, $user);

        return response()->json(['ok' => true]);
    }

    public function credentials(User $user)
    {
        return response()->json($this->credentialsPayload($user));
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
        return [
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->status,
            'company' => $user->profile?->company,
            'occupation' => $user->profile?->occupation,
            'website' => $user->profile?->website,
            'bio' => $user->profile?->bio,
            'avatar' => $user->avatar(),
            'created_at' => $user->created_at,
            'projects_count' => $user->projects_count ?? $user->projects()->count(),
        ];
    }

    private function updateProfile(User $user, array $data): void
    {
        $fields = array_intersect_key($data, array_flip([
            'full_name', 'company', 'bio', 'occupation', 'website', 'avatar', 'cover', 'birth_date', 'gender',
        ]));

        if (!empty($fields)) {
            $user->profile()->updateOrCreate([], $fields);
        }
    }
}