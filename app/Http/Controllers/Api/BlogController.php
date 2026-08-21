<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Models\Blog;
use App\Models\BlogTag;
use App\Models\MediaLibrary;
use App\Support\ContentSanitizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class BlogController extends Controller
{
    public function index(Request $request)
    {
        $query = Blog::with(['author:id,username', 'author.profile', 'author.roles', 'categories:id,name,slug', 'tags:id,name']);

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($categoryId = $request->integer('category_id')) {
            $query->whereHas('categories', fn ($q) => $q->where('categories.id', $categoryId));
        }

        if ($q = trim((string) $request->input('q'))) {
            $query->where(function ($w) use ($q) {
                $w->where('title', 'like', '%' . $q . '%')
                    ->orWhere('excerpt', 'like', '%' . $q . '%');
            });
        }

        $perPage = $request->integer('per_page', 12);

        $posts = $query->orderByDesc('published_at')->orderByDesc('id')->paginate($perPage);

        $posts->through(fn (Blog $post) => $this->serialize($post));

        return response()->json($posts);
    }

    public function show(Blog $blog)
    {
        return response()->json($this->serialize($blog->load(['author:id,username', 'author.profile', 'author.roles', 'categories:id,name,slug', 'tags:id,name'])));
    }

    public function counts()
    {
        return response()->json([
            'featured' => Blog::published()->featured()->count(),
            'latest' => Blog::published()->count(),
            'popular' => Blog::published()->count(),
        ]);
    }

    public function store(Request $request)
    {
        $this->decodeTags($request);
        $data = $this->validateData($request);

        $data['author_id'] = $request->user()->id;

        $this->applyPublishing($data, null);

        $blog = Blog::create($data);
        app(\App\Services\AuditLogger::class)->log('blog.created', 'Artikel dibuat', $blog);

        if ($request->hasFile('cover')) {
            $this->attachCover($blog, $request);
        } elseif ($request->filled('media_id')) {
            $this->attachMedia($blog, (int) $request->input('media_id'), $request);
        }

        $this->syncInlineImages($blog);

        $this->syncTags($blog, $request->input('tags', []));

        $this->syncCategories($blog, $request);

        return response()->json($this->serialize($blog->load(['author:id,username', 'author.profile', 'author.roles', 'categories:id,name,slug', 'tags:id,name'])), 201);
    }

    public function update(Request $request, Blog $blog)
    {
        $this->decodeTags($request);
        $data = $this->validateData($request, $blog->id);

        if ($request->boolean('use_image_url')) {
            $blog->clearMediaCollection('cover');
        }

        $this->applyPublishing($data, $blog);

        $blog->update($data);
        app(\App\Services\AuditLogger::class)->log('blog.updated', 'Artikel diperbarui', $blog);

        if ($request->hasFile('cover')) {
            $this->attachCover($blog, $request);
        } elseif ($request->filled('media_id')) {
            $this->attachMedia($blog, (int) $request->input('media_id'), $request);
        }

        $this->syncInlineImages($blog);

        $this->syncTags($blog, $request->input('tags', []));

        $this->syncCategories($blog, $request);

        return response()->json($this->serialize($blog->load(['author:id,username', 'author.profile', 'author.roles', 'categories:id,name,slug', 'tags:id,name'])));
    }

    private function syncInlineImages(Blog $blog): void
    {
        $html = app(\App\Services\BlogContentMediaSync::class)->sync($blog, (string) $blog->content);

        if ($html !== (string) $blog->content) {
            $blog->update(['content' => $html]);
        }
    }

    public function destroy(Blog $blog)
    {
        $blog->delete();
        app(\App\Services\AuditLogger::class)->log('blog.deleted', 'Artikel dihapus');

        return response()->json(['ok' => true]);
    }

    private function decodeTags(Request $request): void
    {
        if ($request->has('tags') && is_string($request->input('tags'))) {
            $decoded = json_decode($request->input('tags'), true);

            $request->merge(['tags' => is_array($decoded) ? $decoded : []]);
        }
    }

    private function attachCover(Blog $blog, Request $request): void
    {
        $blog->clearMediaCollection('cover');
        $blog->addMediaFromRequest('cover')
            ->usingFileName($request->file('cover')->getClientOriginalName())
            ->toMediaCollection('cover');

        $blog->update(['image_url' => null]);
    }

    private function attachMedia(Blog $blog, int $mediaId, Request $request): void
    {
        $media = \Spatie\MediaLibrary\MediaCollections\Models\Media::find($mediaId);
        $accessible = $media
            && $media->model_type === MediaLibrary::class
            && str_starts_with((string) $media->mime_type, 'image/')
            && ((int) $media->uploaded_by === (int) $request->user()->id || $media->is_public)
            && is_file($media->getPath());

        if (!$accessible) {
            throw ValidationException::withMessages(['media_id' => 'Media gambar tidak valid atau tidak dapat diakses.']);
        }

        $temporary = tempnam(sys_get_temp_dir(), 'blog-cover-');
        if (!$temporary || !copy($media->getPath(), $temporary)) {
            throw ValidationException::withMessages(['media_id' => 'Media gambar gagal disalin.']);
        }

        $blog->clearMediaCollection('cover');
        $blog->addMedia($temporary)
            ->usingFileName($media->file_name)
            ->toMediaCollection('cover');

        $blog->update(['image_url' => null]);
    }

    private function syncTags(Blog $blog, array $names): void
    {
        $ids = BlogTag::findOrCreateByNames($names);
        $blog->tags()->sync($ids);
    }

    private function syncCategories(Blog $blog, Request $request): void
    {
        $ids = collect($request->input('category_ids', []))->filter()->map(fn ($id) => (int) $id)->unique()->values();
        $blog->categories()->sync($ids);
    }

    private function applyPublishing(array &$data, ?Blog $blog = null): void
    {
        if (($data['status'] ?? 'draft') === 'published') {
            if (!$blog || $blog->status !== 'published') {
                $data['published_at'] = now();
            }
        } else {
            $data['published_at'] = null;
        }
    }

    private function validateData(Request $request, ?int $ignoreId = null): array
    {
        $data = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'integer|exists:categories,id',
            'excerpt' => 'nullable|string|max:500',
            'content' => 'required|string',
            'image_url' => 'nullable|url|max:2048',
            'is_featured' => 'nullable|boolean',
            'status' => 'required|in:draft,published',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:100',
        ])->validate();

        $data['content'] = ContentSanitizer::clean($data['content'] ?? '');
        $data['excerpt'] = ContentSanitizer::plainText($data['excerpt'] ?? '');
        $data['slug'] = Blog::uniqueSlug($data['title'], $ignoreId);

        return $data;
    }

    private function serialize(Blog $blog): array
    {
        $cover = $blog->coverMedia();

        return [
            'id' => $blog->id,
            'title' => $blog->title,
            'slug' => $blog->slug,
            'excerpt' => $blog->excerpt,
            'content' => $blog->content,
            'status' => $blog->status,
            'author' => $blog->author ? [
                'id' => $blog->author->id,
                'name' => $blog->author->name,
                'verified' => $blog->author->hasRole(['owner', 'admin']),
            ] : null,
            'category' => $blog->categories->isNotEmpty() ? [
                'id' => $blog->categories->first()->id,
                'name' => $blog->categories->first()->name,
                'slug' => $blog->categories->first()->slug,
            ] : null,
            'categories' => $blog->categories->map(fn ($cat) => ['id' => $cat->id, 'name' => $cat->name, 'slug' => $cat->slug])->values(),
            'tags' => $blog->tags->map(fn ($tag) => ['id' => $tag->id, 'name' => $tag->name])->values(),
            'cover_url' => $blog->resolveCoverUrl(),
            'thumbnail_url' => $blog->thumbnail_url,
            'has_local_media' => (bool) $cover,
            'media_id' => $cover?->id,
            'image_url' => $blog->image_url,
            'is_featured' => (bool) $blog->is_featured,
            'views_count' => (int) $blog->views_count,
            'published_at' => $blog->published_at?->toIso8601String(),
            'created_at' => $blog->created_at?->toIso8601String(),
            'updated_at' => $blog->updated_at?->toIso8601String(),
        ];
    }
}
