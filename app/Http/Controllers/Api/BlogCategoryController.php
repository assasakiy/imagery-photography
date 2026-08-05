<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Models\BlogCategory;
use App\Support\ContentSanitizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BlogCategoryController extends Controller
{
    public function index()
    {
        return response()->json(
            BlogCategory::withCount('publishedPosts as posts_count')->orderBy('name')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $category = BlogCategory::create($data);
        app(\App\Services\AuditLogger::class)->log('blogcategory.created', 'Kategori blog dibuat', $category);

        return response()->json($category, 201);
    }

    public function update(Request $request, BlogCategory $category)
    {
        $data = $this->validateData($request, $category->id);

        $category->update($data);
        app(\App\Services\AuditLogger::class)->log('blogcategory.updated', 'Kategori blog diperbarui', $category);

        return response()->json($category);
    }

    public function destroy(BlogCategory $category)
    {
        $category->delete();
        app(\App\Services\AuditLogger::class)->log('blogcategory.deleted', 'Kategori blog dihapus');

        return response()->json(['ok' => true]);
    }

    private function validateData(Request $request, ?int $ignoreId = null): array
    {
        $data = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ])->validate();

        $data['description'] = ContentSanitizer::plainText($data['description']);

        $data['slug'] = BlogCategory::uniqueSlug($data['name'], $ignoreId);

        return $data;
    }
}
