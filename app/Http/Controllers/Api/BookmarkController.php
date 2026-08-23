<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Blog;
use App\Models\Package;
use App\Models\Portfolio;
use Illuminate\Http\Request;

class BookmarkController extends Controller
{
    private function resolveModel(string $type)
    {
        return match ($type) {
            'blog' => Blog::class,
            'portfolio' => Portfolio::class,
            'package' => Package::class,
            default => abort(422, 'Tipe bookmark tidak dikenal.'),
        };
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $bookmarks = $user->bookmarks()->with('bookmarkable')->latest()->get();

        return response()->json($bookmarks->map(function ($b) use ($user) {
            $target = $b->bookmarkable;
            if (!$target) {
                return [
                    'id' => $b->id,
                    'type' => class_basename($b->bookmarkable_type),
                    'target_id' => $b->bookmarkable_id,
                    'title' => 'Konten dihapus',
                    'excerpt' => null,
                    'cover_url' => null,
                    'author' => null,
                    'url' => null,
                    'likes_count' => 0,
                    'comments_count' => 0,
                    'user_liked' => false,
                    'created_at' => $b->created_at,
                ];
            }

            $typeKey = match (class_basename($b->bookmarkable_type)) {
                'Blog' => 'blog',
                'Portfolio' => 'portfolio',
                default => 'package',
            };

            $likesCount = $target->likes()->count();
            $commentsCount = $target->comments()->count();
            $userLiked = $user->likes()
                ->where('likeable_type', $b->bookmarkable_type)
                ->where('likeable_id', $target->id)
                ->exists();

            $coverUrl = null;
            if (method_exists($target, 'resolveCoverUrl')) {
                $coverUrl = $target->resolveCoverUrl();
            } elseif (!empty($target->image_url)) {
                $coverUrl = $target->image_url;
            }

            $authorName = null;
            if ($typeKey === 'blog' && $target->relationLoaded('author') && $target->author) {
                $authorName = $target->author->name;
            }

            return [
                'id' => $b->id,
                'type' => $typeKey,
                'target_id' => $target->id,
                'title' => $target->title ?? $target->name ?? 'Konten',
                'excerpt' => $target->excerpt ?? $target->description ?? null,
                'cover_url' => $coverUrl,
                'author' => $authorName,
                'url' => $this->targetUrl($b->bookmarkable_type, $target),
                'likes_count' => $likesCount,
                'comments_count' => $commentsCount,
                'user_liked' => $userLiked,
                'created_at' => $b->created_at,
            ];
        }));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'type' => 'required|string|in:blog,portfolio,package',
            'id' => 'required|integer',
        ]);

        $model = $this->resolveModel($data['type']);
        $target = $model::findOrFail($data['id']);

        $request->user()->bookmarks()->firstOrCreate([
            'bookmarkable_type' => $model,
            'bookmarkable_id' => $target->id,
        ]);

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, string $type, int $id)
    {
        $model = $this->resolveModel($type);

        $request->user()->bookmarks()
            ->where('bookmarkable_type', $model)
            ->where('bookmarkable_id', $id)
            ->delete();

        return response()->json(['ok' => true]);
    }

    private function targetUrl(string $type, $target): ?string
    {
        if (class_basename($type) === 'Blog') {
            return route('blog.show', $target->slug);
        }
        if (class_basename($type) === 'Portfolio') {
            return route('gallery.show', $target->slug);
        }

        return route('services');
    }
}