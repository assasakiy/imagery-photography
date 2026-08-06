<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\ClientRegistrationService;
use App\Services\NotificationService;
use App\Services\NotificationType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

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
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required_without:phone|nullable|email|max:255|unique:users,email',
            'phone' => 'required_without:email|nullable|string|max:30',
        ]);

        $result = app(ClientRegistrationService::class)->registerWithInvite(
            ['name' => $data['name'], 'email' => $data['email'] ?? null, 'phone' => $data['phone'] ?? null],
            'admin',
            null,
            $request->user()
        );

        app(AuditLogger::class)->log('team.created', 'Admin diundang: ' . $data['name'] . ' (' . ($data['email'] ?? $data['phone']) . ')', $result['user']);

        return response()->json([
            'admin' => $this->serialize($result['user']),
            'invite' => $result['invite'] ? [
                'url' => $result['invite']->url,
                'expires_at' => $result['invite']->expires_at,
            ] : null,
        ], 201);
    }

    public function update(Request $request, User $user)
    {
        $this->ensureManaged($user);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:30',
            'username' => 'sometimes|string|max:80|unique:users,username,' . $user->id,
            'password' => 'sometimes|nullable|string|min:6',
        ]);

        if (isset($data['password'])) {
            if ($data['password'] === '') {
                unset($data['password']);
            } else {
                $data['password'] = Hash::make($data['password']);
            }
        }

        if (isset($data['name'])) {
            $user->profile()->updateOrCreate([], ['full_name' => $data['name']]);
            unset($data['name']);
        }

        $user->update($data);

        app(AuditLogger::class)->log('team.updated', 'Admin diperbarui: ' . $user->name, $user);

        return response()->json(['admin' => $this->serialize($user->fresh('profile'))]);
    }

    public function destroy(User $user)
    {
        if ($user->isOwner()) {
            return response()->json(['message' => 'Owner tidak dapat dihapus.'], 422);
        }

        $this->ensureManaged($user);

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

    private function serialize(User $user): array
    {
        return [
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->status,
            'role' => $user->primaryRole(),
            'created_at' => $user->created_at,
        ];
    }
}