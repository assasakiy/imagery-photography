<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class SubscriberController extends Controller
{
    public function index(Request $request)
    {
        $query = User::role('subscriber')
            ->with('profile');

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

    public function show(User $user)
    {
        if (!$user->hasRole('subscriber')) {
            abort(404);
        }

        $user->load('profile');

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->status,
            'avatar' => $user->avatar(),
            'bio' => $user->bio,
            'created_at' => $user->created_at,
            'last_seen_at' => $user->last_seen_at,
            'is_online' => $user->isOnline(),
            'bookmarks_count' => $user->bookmarks()->count(),
            'likes_count' => $user->likes()->count(),
            'comments_count' => $user->comments()->count(),
            'bookmarks' => $user->bookmarks()->with('bookmarkable')->latest()->take(10)->get()->map(fn ($b) => [
                'id' => $b->id,
                'type' => class_basename($b->bookmarkable_type),
                'title' => $b->bookmarkable?->title ?? $b->bookmarkable?->name ?? 'Konten',
            ]),
            'recent_comments' => $user->comments()->latest()->take(10)->get()->map(fn ($c) => [
                'id' => $c->id,
                'body' => mb_strimwidth($c->body, 0, 80, '…'),
                'status' => $c->status,
                'commentable_type' => class_basename($c->commentable_type),
                'created_at' => $c->created_at,
            ]),
        ]);
    }

    public function destroy(Request $request, User $user)
    {
        if (!$user->hasRole('subscriber')) {
            abort(404);
        }

        if ($user->hasRole('client') || $user->hasRole('owner') || $user->hasRole('admin')) {
            abort(422, 'Akun ini juga memiliki role lain dan tidak bisa dihapus dari manajemen subscriber.');
        }

        $name = $user->name;
        $user->delete();

        app(AuditLogger::class)->log('subscriber.deleted', 'Subscriber dihapus: ' . $name, $user);

        return response()->json(['ok' => true]);
    }

    private function serialize(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'status' => $user->status,
            'avatar' => $user->avatar(),
            'is_online' => $user->isOnline(),
            'is_client' => $user->hasRole('client'),
            'last_seen_at' => $user->last_seen_at,
            'created_at' => $user->created_at,
            'bookmarks_count' => $user->bookmarks()->count(),
            'likes_count' => $user->likes()->count(),
            'comments_count' => $user->comments()->count(),
        ];
    }
}
