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
        return response()->json(ServiceCategory::orderBy('order')->get());
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $category = ServiceCategory::create($data);
        app(AuditLogger::class)->log('service_category.created', 'Kategori tampilan dibuat: ' . $category->title, $category);

        return response()->json($category, 201);
    }

    public function update(Request $request, ServiceCategory $serviceCategory)
    {
        $data = $this->validateData($request);

        $serviceCategory->update($data);
        app(AuditLogger::class)->log('service_category.updated', 'Kategori tampilan diperbarui: ' . $serviceCategory->title, $serviceCategory);

        return response()->json($serviceCategory);
    }

    public function destroy(ServiceCategory $serviceCategory)
    {
        app(AuditLogger::class)->log('service_category.deleted', 'Kategori tampilan dihapus: ' . $serviceCategory->title, $serviceCategory);
        $serviceCategory->delete();

        return response()->json(['ok' => true]);
    }

    private function validateData(Request $request): array
    {
        $data = Validator::make($request->all(), [
            'label' => 'nullable|string|max:255',
            'title' => 'required|string|max:255',
            'type' => 'required|in:satuan,bundling,combo',
            'description' => 'nullable|string',
            'layout' => 'required|in:table,grid',
            'columns' => 'nullable|array',
            'columns.*' => 'string|max:255',
            'order' => 'integer|min:0',
            'published' => 'boolean',
        ])->validate();

        $data['description'] = ContentSanitizer::plainText($data['description'] ?? '');
        $data['columns'] = $data['columns'] ?? [];
        $data['published'] = (bool) ($data['published'] ?? true);

        return $data;
    }
}