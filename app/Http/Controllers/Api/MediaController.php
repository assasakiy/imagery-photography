<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Models\Blog;
use App\Models\MediaLibrary;
use Illuminate\Http\Request;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class MediaController extends Controller
{
    public function index(Request $request)
    {
        $query = Media::query();

        // Visibilitas: milik sendiri ATAU ditandai publik.
        $query->where(fn ($w) => $w
            ->where('uploaded_by', $request->user()->id)
            ->orWhere('is_public', true));

        // Filter cerdas: sembunyikan media milik Blog yang sudah soft-deleted (anti gambar "zombie").
        $trashedIds = Blog::onlyTrashed()->pluck('id');
        if ($trashedIds->isNotEmpty()) {
            $query->whereNot(function ($w) use ($trashedIds) {
                $w->where('model_type', Blog::class)->whereIn('model_id', $trashedIds);
            });
        }

        if ($request->filled('type')) {
            $query->where('mime_type', 'like', $request->input('type') . '%');
        }

        if ($q = trim((string) $request->input('q'))) {
            $query->where(fn ($w) => $w
                ->where('name', 'like', '%' . $q . '%')
                ->orWhere('file_name', 'like', '%' . $q . '%'));
        }

        $perPage = $request->integer('per_page', 24);

        return response()->json($query->latest()->paginate($perPage)->through(fn ($media) => $this->serialize($media)));
    }

    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:102400',
            'name' => 'nullable|string|max:255',
        ]);

        $library = MediaLibrary::singleton();
        $media = $library->addMediaFromRequest('file')
            ->usingFileName($request->file('file')->getClientOriginalName())
            ->toMediaCollection('library');

        $media->uploaded_by = $request->user()->id;
        $media->is_public = $request->boolean('is_public', true);
        $media->save();

        if ($request->filled('name')) {
            $media->update(['name' => $request->input('name')]);
        }

                app(\App\Services\AuditLogger::class)->log('media.created', 'Media diupload: ' . $media->file_name, $media);

        return response()->json($this->serialize($media), 201);
    }

    public function destroy(Media $media)
    {
        $media->delete();
        app(\App\Services\AuditLogger::class)->log('media.deleted', 'Media dihapus: ' . $media->file_name);

        return response()->json(['ok' => true]);
    }

    private function serialize(Media $media): array
    {
        $type = explode('/', $media->mime_type ?? '')[0];

        return [
            'id' => $media->id,
            'name' => $media->name,
            'file_name' => $media->file_name,
            'mime_type' => $media->mime_type,
            'type' => $type,
            'size' => $media->size,
            'url' => $media->getUrl(),
            'collection_name' => $media->collection_name,
            'created_at' => $media->created_at,
            'uploaded_by' => $media->uploaded_by,
            'is_public' => (bool) $media->is_public,
        ];
    }
}
