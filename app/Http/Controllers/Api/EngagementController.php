<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use App\Models\Comment;
use App\Models\Like;
use App\Models\Package;
use App\Models\Portfolio;
use Illuminate\Http\Request;

class EngagementController extends Controller
{
    private function resolveModel(string $type)
    {
        return match ($type) {
            'blog' => Blog::class,
            'portfolio' => Portfolio::class,
            'package' => Package::class,
            default => abort(422, 'Tipe tidak dikenal.'),
        };
    }

    private function ensureCanEngage(Request $request): void
    {
        $user = $request->user();
        if (!$user || !($user->hasRole('subscriber') || $user->hasRole('client') || $user->hasRole('owner') || $user->hasRole('admin'))) {
            abort(403, 'Fitur ini khusus untuk pengguna yang login.');
        }
    }

    public function toggleLike(Request $request)
    {
        $this->ensureCanEngage($request);

        $data = $request->validate([
            'type' => 'required|string|in:blog,portfolio,package',
            'id' => 'required|integer',
        ]);

        $model = $this->resolveModel($data['type']);
        $target = $model::findOrFail($data['id']);

        $existing = $request->user()->likes()
            ->where('likeable_type', $model)
            ->where('likeable_id', $target->id)
            ->first();

        if ($existing) {
            $existing->delete();
            $liked = false;
        } else {
            Like::create([
                'user_id' => $request->user()->id,
                'likeable_type' => $model,
                'likeable_id' => $target->id,
            ]);
            $liked = true;
        }

        return response()->json([
            'ok' => true,
            'liked' => $liked,
            'likes_count' => $target->likes()->count(),
        ]);
    }

    public function comments(Request $request, string $type, int $id)
    {
        $model = $this->resolveModel($type);
        $target = $model::findOrFail($id);

        $comments = $target->approvedComments()
            ->latest()
            ->limit(100)
            ->get()
            ->map(fn ($c) => $this->serializeComment($c, $request->user()));

        return response()->json($comments);
    }

    public function storeComment(Request $request)
    {
        $this->ensureCanEngage($request);

        $data = $request->validate([
            'type' => 'required|string|in:blog,portfolio,package',
            'id' => 'required|integer',
            'body' => 'required|string|min:2|max:2000',
        ]);

        $model = $this->resolveModel($data['type']);
        $target = $model::findOrFail($data['id']);

        $comment = Comment::create([
            'user_id' => $request->user()->id,
            'commentable_type' => $model,
            'commentable_id' => $target->id,
            'body' => $data['body'],
            'status' => 'approved',
            'approved_at' => now(),
        ]);

        return response()->json([
            'ok' => true,
            'comment' => $this->serializeComment($comment->load('user'), $request->user()),
        ], 201);
    }

    public function destroyComment(Request $request, Comment $comment)
    {
        $user = $request->user();
        $isOwner = $comment->user_id === $user->id;
        $isModerator = $user->hasRole('owner') || $user->hasRole('admin');

        if (!$isOwner && !$isModerator) {
            abort(403, 'Anda tidak berhak menghapus komentar ini.');
        }

        $comment->delete();

        return response()->json(['ok' => true]);
    }

    public function moderateList(Request $request)
    {
        $data = $request->validate([
            'status' => 'sometimes|string|in:all,approved,hidden',
        ]);

        $status = $data['status'] ?? 'all';

        $comments = Comment::with('user', 'commentable')
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->latest()
            ->paginate(20);

        return response()->json($comments->through(fn ($c) => $this->serializeComment($c, $request->user())));
    }

    public function moderate(Request $request, Comment $comment)
    {
        $data = $request->validate([
            'status' => 'required|string|in:approved,hidden',
        ]);

        $comment->update([
            'status' => $data['status'],
            'approved_at' => $data['status'] === 'approved' ? now() : null,
        ]);

        return response()->json(['ok' => true]);
    }

    private function serializeComment(Comment $comment, ?\App\Models\User $viewer): array
    {
        $target = $comment->relationLoaded('commentable') ? $comment->commentable : null;

        return [
            'id' => $comment->id,
            'body' => $comment->body,
            'status' => $comment->status,
            'user' => [
                'id' => $comment->user?->id,
                'name' => $comment->user?->name ?? 'Subscriber',
                'avatar' => $comment->user?->avatar(),
            ],
            'target' => $target ? [
                'type' => class_basename($comment->commentable_type),
                'id' => $target->id,
                'title' => $target->title ?? $target->name ?? 'Konten',
            ] : null,
            'created_at' => $comment->created_at,
            'created_at_rel' => $comment->created_at?->diffForHumans(),
            'can_delete' => $viewer && ($viewer->id === $comment->user_id || $viewer->hasRole('owner') || $viewer->hasRole('admin')),
        ];
    }
}