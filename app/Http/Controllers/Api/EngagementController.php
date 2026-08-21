<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use App\Models\Comment;
use App\Models\Like;
use App\Models\Package;
use App\Models\Portfolio;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

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
            ->whereNull('parent_id')
            ->with(['replies' => fn ($query) => $query
                ->where('status', 'approved')
                ->with('user')
                ->oldest()])
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
            'parent_id' => 'nullable|integer|exists:comments,id',
            'body' => 'required|string|min:2|max:2000',
        ]);

        $model = $this->resolveModel($data['type']);
        $target = $model::findOrFail($data['id']);
        $body = trim(strip_tags($data['body']));

        if (mb_strlen($body) < 2) {
            throw ValidationException::withMessages(['body' => 'Komentar minimal 2 karakter.']);
        }

        $parent = null;
        if (!empty($data['parent_id'])) {
            $parent = Comment::whereKey($data['parent_id'])
                ->where('commentable_type', $model)
                ->where('commentable_id', $target->id)
                ->where('status', 'approved')
                ->first();

            if (!$parent) {
                throw ValidationException::withMessages(['parent_id' => 'Komentar induk tidak valid.']);
            }

            if ($parent->parent_id) {
                throw ValidationException::withMessages(['parent_id' => 'Balasan hanya dapat dibuat satu tingkat.']);
            }
        }

        $comment = Comment::create([
            'user_id' => $request->user()->id,
            'commentable_type' => $model,
            'commentable_id' => $target->id,
            'parent_id' => $parent?->id,
            'body' => $body,
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

        $comments = Comment::with('user', 'commentable', 'parent.user')
            ->withCount('replies')
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
            'parent_id' => $comment->parent_id,
            'body' => $comment->body,
            'status' => $comment->status,
            'user' => [
                'id' => $comment->user?->id,
                'name' => $comment->user?->name ?? 'Subscriber',
                'username' => $comment->user?->username,
                'avatar' => $comment->user?->avatar(),
            ],
            'target' => $target ? [
                'type' => class_basename($comment->commentable_type),
                'id' => $target->id,
                'title' => $target->title ?? $target->name ?? 'Konten',
            ] : null,
            'parent' => $comment->relationLoaded('parent') && $comment->parent ? [
                'id' => $comment->parent->id,
                'body' => $comment->parent->body,
                'user' => [
                    'id' => $comment->parent->user?->id,
                    'name' => $comment->parent->user?->name ?? 'Subscriber',
                    'username' => $comment->parent->user?->username,
                ],
            ] : null,
            'replies' => $comment->relationLoaded('replies')
                ? $comment->replies->map(fn ($reply) => $this->serializeComment($reply, $viewer))->values()
                : [],
            'replies_count' => $comment->replies_count ?? ($comment->relationLoaded('replies') ? $comment->replies->count() : 0),
            'created_at' => $comment->created_at,
            'created_at_rel' => $comment->created_at?->diffForHumans(),
            'can_delete' => $viewer && ($viewer->id === $comment->user_id || $viewer->hasRole('owner') || $viewer->hasRole('admin')),
        ];
    }
}