<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServiceCategory;
use App\Services\AuditLogger;
use App\Support\ContentSanitizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ServiceCategoryController extends Controller
{
    public function index()
    {
        $categories = ServiceCategory::with('items')->orderBy('order')->get();

        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $category = ServiceCategory::create($data);
        $this->syncItems($category, $data['items'] ?? []);

        app(AuditLogger::class)->log('service_category.created', 'Kategori harga dibuat: ' . $category->title, $category);

        return response()->json($category->load('items'), 201);
    }

    public function update(Request $request, ServiceCategory $serviceCategory)
    {
        $data = $this->validateData($request);

        $serviceCategory->update($data);
        $this->syncItems($serviceCategory, $data['items'] ?? []);

        app(AuditLogger::class)->log('service_category.updated', 'Kategori harga diperbarui: ' . $serviceCategory->title, $serviceCategory);

        return response()->json($serviceCategory->load('items'));
    }

    public function destroy(ServiceCategory $serviceCategory)
    {
        app(AuditLogger::class)->log('service_category.deleted', 'Kategori harga dihapus: ' . $serviceCategory->title, $serviceCategory);
        $serviceCategory->delete();

        return response()->json(['ok' => true]);
    }

    private function syncItems(ServiceCategory $category, array $items): void
    {
        $category->items()->delete();

        foreach (array_values($items) as $i => $item) {
            $category->items()->create([
                'name' => ContentSanitizer::plainText($item['name'] ?? ''),
                'values' => $item['values'] ?? [],
                'order' => $i,
            ]);
        }
    }

    private function validateData(Request $request): array
    {
        $data = Validator::make($request->all(), [
            'label' => 'nullable|string|max:255',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'layout' => 'required|in:table,grid',
            'columns' => 'nullable|array',
            'columns.*' => 'string|max:255',
            'order' => 'integer|min:0',
            'published' => 'boolean',
            'items' => 'nullable|array',
            'items.*.name' => 'required|string|max:255',
            'items.*.values' => 'nullable|array',
            'items.*.values.*' => 'string|max:255',
        ])->validate();

        $data['description'] = ContentSanitizer::plainText($data['description'] ?? '');
        $data['columns'] = $data['columns'] ?? [];
        $data['published'] = (bool) ($data['published'] ?? true);

        return $data;
    }
}
