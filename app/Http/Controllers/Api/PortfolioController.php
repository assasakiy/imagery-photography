<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Models\MediaLibrary;
use App\Models\Portfolio;
use App\Support\ContentSanitizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class PortfolioController extends Controller
{
    public function index(Request $request)
    {
        $query = Portfolio::query();

        if ($request->filled('category_id')) {
            $query->whereHas('categories', fn ($q) => $q->where('categories.id', $request->integer('category_id')));
        }

        if ($request->filled('q')) {
            $query->where('title', 'like', '%' . $request->input('q') . '%');
        }

        $perPage = $request->integer('per_page', 12);

        $portfolios = $query->orderBy('order')->paginate($perPage);
        $portfolios->through(fn (Portfolio $portfolio) => $this->serialize($portfolio));

        return response()->json($portfolios);
    }

    public function show(Portfolio $portfolio)
    {
        return response()->json($this->serialize($portfolio));
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $portfolio = Portfolio::create($data);
        app(\App\Services\AuditLogger::class)->log('portfolio.created', 'Portofolio dibuat', $portfolio);

        $this->syncCategories($portfolio, $request);

        if ($request->hasFile('image')) {
            $this->attachImage($portfolio, $request);
        } elseif ($request->filled('media_id')) {
            $this->attachMedia($portfolio, (int) $request->input('media_id'), $request);
        }

        return response()->json($this->serialize($portfolio->load('categories')), 201);
    }

    public function update(Request $request, Portfolio $portfolio)
    {
        $data = $this->validateData($request, $portfolio);

        app(\App\Services\AuditLogger::class)->log('portfolio.updated', 'Portofolio diperbarui', $portfolio);

        if ($request->boolean('use_image_url')) {
            $portfolio->clearMediaCollection('cover');
        }

        $portfolio->update($data);

        $this->syncCategories($portfolio, $request);

        if ($request->hasFile('image')) {
            $this->attachImage($portfolio, $request);
        } elseif ($request->filled('media_id')) {
            $this->attachMedia($portfolio, (int) $request->input('media_id'), $request);
        }

        return response()->json($this->serialize($portfolio->load('categories')));
    }

    public function destroy(Portfolio $portfolio)
    {
        $portfolio->delete();
        app(\App\Services\AuditLogger::class)->log('portfolio.deleted', 'Portofolio dihapus');

        return response()->json(['ok' => true]);
    }

    private function attachImage(Portfolio $portfolio, Request $request): void
    {
        $portfolio->clearMediaCollection('cover');
        $portfolio->addMediaFromRequest('image')
            ->usingFileName($request->file('image')->getClientOriginalName())
            ->toMediaCollection('cover');

        $portfolio->update(['image_url' => null]);
    }

    private function attachMedia(Portfolio $portfolio, int $mediaId, Request $request): void
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

        $temporary = tempnam(sys_get_temp_dir(), 'portfolio-cover-');
        if (!$temporary || !copy($media->getPath(), $temporary)) {
            throw ValidationException::withMessages(['media_id' => 'Media gambar gagal disalin.']);
        }

        $portfolio->clearMediaCollection('cover');
        $portfolio->addMedia($temporary)
            ->usingFileName($media->file_name)
            ->toMediaCollection('cover');

        $portfolio->update(['image_url' => null]);
    }

    private function syncCategories(Portfolio $portfolio, Request $request): void
    {
        $ids = collect($request->input('category_ids', []))->filter()->map(fn ($id) => (int) $id)->unique()->values();
        $portfolio->categories()->sync($ids);
    }

    private function validateData(Request $request, ?Portfolio $portfolio = null): array
    {
        $data = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'integer|exists:categories,id',
            'image_url' => 'nullable|url|max:2048',
            'is_featured' => 'boolean',
            'order' => 'integer|min:0',
        ])->validate();

        $data['description'] = ContentSanitizer::plainText($data['description'] ?? '');

        return $data;
    }

    private function serialize(Portfolio $portfolio): array
    {
        $cover = $portfolio->coverMedia();

        return [
            'id' => $portfolio->id,
            'title' => $portfolio->title,
            'slug' => $portfolio->slug,
            'description' => $portfolio->description,
            'category' => $portfolio->categories->isNotEmpty() ? $portfolio->categories->first()->name : null,
            'categories' => $portfolio->categories->map(fn ($cat) => ['id' => $cat->id, 'name' => $cat->name, 'slug' => $cat->slug])->values(),
            'is_featured' => (bool) $portfolio->is_featured,
            'order' => $portfolio->order,
            'image_url' => $portfolio->image_url,
            'cover_url' => $portfolio->cover_url,
            'thumbnail_url' => $portfolio->thumbnail_url,
            'has_local_media' => (bool) $cover,
            'media_id' => $cover?->id,
            'created_at' => $portfolio->created_at,
            'updated_at' => $portfolio->updated_at,
        ];
    }
}
