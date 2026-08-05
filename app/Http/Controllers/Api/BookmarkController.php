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
        $bookmarks = $user->bookmarks()->latest()->get();

        return response()->json($bookmarks->map(function ($b) {
            $target = $b->bookmarkable;
            $title = $target?->title ?? $target?->name ?? 'Item dihapus';

            return [
                'id' => $b->id,
                'type' => class_basename($b->bookmarkable_type) === 'Blog' ? 'blog' : (class_basename($b->bookmarkable_type) === 'Portfolio' ? 'portfolio' : 'package'),
                'target_id' => $b->bookmarkable_id,
                'title' => $title,
                'url' => $target ? $this->targetUrl($b->bookmarkable_type, $target) : null,
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