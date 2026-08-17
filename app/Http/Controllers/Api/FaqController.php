<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Models\Category;
use App\Models\Faq;
use App\Support\ContentSanitizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FaqController extends Controller
{
    public function index()
    {
        return response()->json(Faq::with('categories')->orderBy('order')->orderBy('id')->get());
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $faq = Faq::create($data);
        $this->syncCategories($faq, $request->input('category_ids', []));
        app(\App\Services\AuditLogger::class)->log('faq.created', 'FAQ dibuat', $faq);

        return response()->json($faq->load('categories'), 201);
    }

    public function update(Request $request, Faq $faq)
    {
        $data = $this->validateData($request);

        $faq->update($data);
        if ($request->has('category_ids')) {
            $this->syncCategories($faq, $request->input('category_ids', []));
        }
        app(\App\Services\AuditLogger::class)->log('faq.updated', 'FAQ diperbarui', $faq);

        return response()->json($faq->load('categories'));
    }

    public function destroy(Faq $faq)
    {
        $faq->delete();
        app(\App\Services\AuditLogger::class)->log('faq.deleted', 'FAQ dihapus');

        return response()->json(['ok' => true]);
    }

    private function syncCategories(Faq $faq, array $ids): void
    {
        $faq->categories()->sync(Category::whereIn('id', array_filter($ids, 'is_numeric'))->pluck('id'));
    }

    private function validateData(Request $request): array
    {
        $data = Validator::make($request->all(), [
            'question' => 'required|string|max:255',
            'answer' => 'required|string',
            'order' => 'integer|min:0',
            'category_ids' => 'nullable|array',
            'category_ids.*' => 'integer',
        ])->validate();

        $data['answer'] = ContentSanitizer::clean($data['answer']);

        return $data;
    }
}