<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Models\BlogTag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BlogTagController extends Controller
{
    public function index()
    {
        return response()->json(
            BlogTag::withCount('posts as posts_count')->orderBy('name')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $tag = BlogTag::create($data);
        app(\App\Services\AuditLogger::class)->log('blogtag.created', 'Tag blog dibuat', $tag);

        return response()->json($tag, 201);
    }

    public function update(Request $request, BlogTag $tag)
    {
        $data = $this->validateData($request, $tag->id);

        $tag->update($data);
        app(\App\Services\AuditLogger::class)->log('blogtag.updated', 'Tag blog diperbarui', $tag);

        return response()->json($tag);
    }

    public function destroy(BlogTag $tag)
    {
        $tag->delete();
        app(\App\Services\AuditLogger::class)->log('blogtag.deleted', 'Tag blog dihapus');

        return response()->json(['ok' => true]);
    }

    private function validateData(Request $request, ?int $ignoreId = null): array
    {
        $data = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
        ])->validate();

        $data['slug'] = BlogTag::uniqueSlug($data['name'], $ignoreId);

        return $data;
    }
}
