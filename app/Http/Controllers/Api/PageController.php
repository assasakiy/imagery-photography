<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Models\Page;
use App\Support\ContentSanitizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PageController extends Controller
{
    public function index()
    {
        return response()->json(Page::orderBy('slug')->get()->makeHidden([]));
    }

    public function show(string $slug)
    {
        $page = Page::where('slug', $slug)->firstOrFail();

        return response()->json($page);
    }

    public function store(Request $request)
    {
        return $this->save($request, null);
    }

    public function update(string $slug, Request $request)
    {
        $page = Page::where('slug', $slug)->firstOrFail();

        return $this->save($request, $page);
    }

    protected function save(Request $request, ?Page $page = null)
    {
        $data = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'hero_title' => 'nullable|string|max:255',
            'hero_subtitle' => 'nullable|string',
            'badge' => 'nullable|string|max:100',
            'button_text' => 'nullable|string|max:100',
            'button_link' => 'nullable|string|max:255',
            'button2_text' => 'nullable|string|max:100',
            'button2_link' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'published' => 'boolean',
            'sections' => 'nullable|array',
        ])->validate();

        $payload = [
            'name' => null,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'hero_title' => $data['hero_title'] ?? null,
            'hero_subtitle' => $data['hero_subtitle'] ?? null,
            'badge' => $data['badge'] ?? null,
            'button_text' => $data['button_text'] ?? null,
            'button_link' => $data['button_link'] ?? null,
            'button2_text' => $data['button2_text'] ?? null,
            'button2_link' => $data['button2_link'] ?? null,
            'content' => ContentSanitizer::clean($data['content'] ?? ''),
            'published' => (bool) ($data['published'] ?? true),
        ];

        if (array_key_exists('sections', $data)) {
            $payload['sections'] = $data['sections'];
        }

        if ($page) {
            $page->update($payload);
            app(AuditLogger::class)->log('page.updated', 'Halaman diperbarui: ' . $page->slug, $page);
        } else {
            if (empty($request->input('slug'))) {
                return response()->json(['message' => 'Kolom slug wajib diisi.'], 422);
            }
            $existing = Page::where('slug', $request->input('slug'))->first();
            if ($existing) {
                return response()->json(['errors' => ['slug' => ['Slug sudah dipakai.']]], 422);
            }
            $payload['slug'] = $request->input('slug');
            $page = Page::create($payload);
            app(AuditLogger::class)->log('page.created', 'Halaman dibuat: ' . $page->slug, $page);
        }

        // Home: kelola images (hero_image/about_image) & sections dari FormData editor.
        if ($request->hasFile('new_images') || $request->has('images') || $request->boolean('reset_images')) {
            $this->processImages($page, $request);
        }

        return response()->json($page->fresh(), $page->wasRecentlyCreated ? 201 : 200);
    }

    private function processImages(Page $page, Request $request): void
    {
        $images = is_array($page->images) ? $page->images : [];

        if ($request->has('reset_images')) {
            foreach (array_keys($request->input('reset_images')) as $key) {
                unset($images[$key]);
            }
        }

        if ($request->has('images')) {
            foreach ($request->input('images') as $key => $value) {
                if (is_string($value) && $value !== '') {
                    $images[$key] = $value;
                }
            }
        }

        if ($request->hasFile('new_images')) {
            foreach ($request->file('new_images') as $key => $file) {
                if ($file && $file->isValid()) {
                    $media = $page->addMedia($file)->toMediaCollection('page_images');
                    $images[$key] = 'media:' . $media->id;
                }
            }
        }

        $page->update(['images' => $images]);
    }
}
