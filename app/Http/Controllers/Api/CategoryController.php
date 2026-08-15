<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Models\Category;
use App\Support\ContentSanitizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::query()
            ->withCount([
                'blogs' => fn ($q) => $q->published(),
                'portfolios',
            ]);

        if ($request->filled('scope')) {
            $column = Str::studly($request->string('scope')) === 'Blog' ? 'blogs_count' : 'portfolios_count';
            $query->having($column, '>', 0);
        }

        $categories = $query->orderBy('name')->get();

        return response()->json($categories->map(fn (Category $c) => $this->serialize($c)));
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $category = Category::create($data);
        app(\App\Services\AuditLogger::class)->log('category.created', 'Kategori dibuat', $category);

        return response()->json($this->serialize($category), 201);
    }

    public function update(Request $request, Category $category)
    {
        $data = $this->validateData($request, $category->id);

        $category->update($data);
        app(\App\Services\AuditLogger::class)->log('category.updated', 'Kategori diperbarui', $category);

        return response()->json($this->serialize($category));
    }

    public function destroy(Category $category)
    {
        $category->delete();
        app(\App\Services\AuditLogger::class)->log('category.deleted', 'Kategori dihapus');

        return response()->json(['ok' => true]);
    }

    private function validateData(Request $request, ?int $ignoreId = null): array
    {
        $data = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
        ])->validate();

        $data['description'] = ContentSanitizer::plainText($data['description'] ?? '');
        $data['slug'] = Category::uniqueSlug($data['name'], $ignoreId);

        return $data;
    }

    private function serialize(Category $category): array
    {
        return [
            'id' => $category->id,
            'name' => $category->name,
            'slug' => $category->slug,
            'description' => $category->description,
            'blogs_count' => $category->blogs_count ?? 0,
            'portfolios_count' => $category->portfolios_count ?? 0,
        ];
    }
}