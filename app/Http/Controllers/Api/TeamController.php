<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\AdminInvitationMail;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TeamController extends Controller
{
    public function index()
    {
        $users = User::whereHas('roles', fn ($q) => $q->whereIn('name', ['owner', 'admin']))
            ->orderByRaw("FIELD(role, 'owner', 'admin')")
            ->orderBy('name')
            ->get();

        return response()->json($users->map(fn ($u) => $this->serialize($u)));
    }

    public function store(Request $request, NotificationService $notifications)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required_without:phone|nullable|email|max:255|unique:users,email',
            'phone' => 'required_without:email|nullable|string|max:30',
            'invite_via' => 'required|string|in:email,whatsapp,manual',
        ]);

        $password = Str::random(12);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($password),
            'role' => 'admin',
        ]);
        $user->assignRole('admin');

        $send = $data['invite_via'];

        if ($send === 'email' && !empty($data['email'])) {
            $notifications->email(
                new AdminInvitationMail($user->name, $data['email'], $password, url('/login')),
                $user,
                'team.invited'
            );
        } elseif ($send === 'whatsapp' && !empty($data['phone'])) {
            $notifications->whatsapp(
                $data['phone'],
                "Anda diundang menjadi Admin di Sopian Lalu Imagery.\nEmail: {$data['email']}\nPassword: {$password}\nLogin: " . url('/login'),
                null,
                null,
                'team.invited'
            );
        }

        app(AuditLogger::class)->log('team.created', 'Admin diundang: ' . $data['name'] . ' (' . ($data['email'] ?? $data['phone']) . ')', $user);

        return response()->json([
            'admin' => $this->serialize($user),
            'credentials' => [
                'email' => $user->email,
                'phone' => $user->phone,
                'password' => $password,
            ],
        ], 201);
    }

    public function update(Request $request, User $user)
    {
        $this->ensureManaged($user);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:30',
            'password' => 'sometimes|nullable|string|min:6',
        ]);

        if (isset($data['password'])) {
            if ($data['password'] === '') {
                unset($data['password']);
            } else {
                $data['password'] = Hash::make($data['password']);
            }
        }

        $user->update($data);

        app(AuditLogger::class)->log('team.updated', 'Admin diperbarui: ' . $user->name, $user);

        return response()->json(['admin' => $this->serialize($user)]);
    }

    public function destroy(User $user)
    {
        if ($user->isOwner()) {
            return response()->json(['message' => 'Owner tidak dapat dihapus.'], 422);
        }

        $this->ensureManaged($user);

        $user->delete();

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
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->getRoleNames()->first() ?? $user->role,
            'created_at' => $user->created_at,
        ];
    }
}
