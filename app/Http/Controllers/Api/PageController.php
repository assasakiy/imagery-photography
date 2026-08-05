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
        return response()->json(Page::orderBy('slug')->get());
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $page = Page::create($data);
        app(\App\Services\AuditLogger::class)->log('page.created', 'Halaman dibuat', $page);

        return response()->json($page, 201);
    }

    public function update(Request $request, Page $page)
    {
        $data = $this->validateData($request, $page->id);

        $page->update($data);
        app(\App\Services\AuditLogger::class)->log('page.updated', 'Halaman diperbarui', $page);

        return response()->json($page);
    }

    public function destroy(Page $page)
    {
        $page->delete();
        app(\App\Services\AuditLogger::class)->log('page.deleted', 'Halaman dihapus');

        return response()->json(['ok' => true]);
    }

    private function validateData(Request $request, ?int $ignoreId = null): array
    {
        $data = Validator::make($request->all(), [
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:pages,slug' . ($ignoreId ? ',' . $ignoreId : '')],
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'published' => 'boolean',
        ])->validate();

        $data['content'] = ContentSanitizer::plainText($data['content']);

        return $data;
    }
}
