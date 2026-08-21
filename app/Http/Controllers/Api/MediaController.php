<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Models\MediaLibrary;
use Illuminate\Http\Request;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class MediaController extends Controller
{
    public function index(Request $request)
    {
        // Hanya media milik Library (hasil upload/impor sendiri), bukan copy
        // yang menjadi milik Blog/Portofolio/aset situs, agar tidak terlihat duplikat.
        $query = Media::query()->where('model_type', MediaLibrary::class);

        // Visibilitas: milik sendiri ATAU ditandai publik.
        $query->where(fn ($w) => $w
            ->where('uploaded_by', $request->user()->id)
            ->orWhere('is_public', true));

        if ($request->filled('type')) {
            match ($request->input('type')) {
                'image' => $query->where('mime_type', 'like', 'image/%'),
                'video' => $query->where('mime_type', 'like', 'video/%'),
                'audio' => $query->where('mime_type', 'like', 'audio/%'),
                'document' => $query->where(fn ($w) => $w
                    ->where('mime_type', 'like', 'application/%')
                    ->orWhere('mime_type', 'like', 'text/%')),
                default => $query->where('mime_type', 'like', $request->input('type') . '%'),
            };
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
            'file' => 'required|file|max:102400|mimetypes:image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,video/mp4,video/quicktime,application/pdf',
            'name' => 'nullable|string|max:255',
        ]);

        $file = $request->file('file');
        if (! $file || ! $file->isValid()) {
            return response()->json([
                'message' => 'File gagal diunggah. Pastikan ukuran file tidak melebihi batas server.',
            ], 422);
        }

        $library = MediaLibrary::singleton();
        $media = $library->addMedia($file)
            ->usingFileName($file->getClientOriginalName())
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

    public function importFromUrl(Request $request)
    {
        $request->validate([
            'url' => 'required|url|max:2048',
            'name' => 'nullable|string|max:255',
        ]);

        $library = MediaLibrary::singleton();
        $tmpFile = null;

        try {
            $url = $request->input('url');

            $downloader = app(\App\Services\SafeUrlDownloader::class);
            $tmpFile = $downloader->fetchToTempFile($url);

            $media = $library->addMedia($tmpFile)
                ->usingFileName(basename(parse_url($url, PHP_URL_PATH)) ?: 'import.jpg')
                ->toMediaCollection('library');

            $media->uploaded_by = $request->user()->id;
            $media->is_public = $request->boolean('is_public', true);
            $media->save();

            if ($request->filled('name')) {
                $media->update(['name' => $request->input('name')]);
            }

            app(\App\Services\AuditLogger::class)->log('media.created', 'Media diimpor dari URL: ' . $media->file_name, $media);

            return response()->json($this->serialize($media), 201);
        } catch (\Throwable $e) {
            if ($tmpFile && file_exists($tmpFile)) {
                @unlink($tmpFile);
            }
            return response()->json([
                'message' => 'Gagal mengimpor URL. Pastikan link menunjuk ke file gambar yang dapat diunduh.',
            ], 422);
        }
    }

    public function destroy(Media $media)
    {
        $media->delete();
        app(\App\Services\AuditLogger::class)->log('media.deleted', 'Media dihapus: ' . $media->file_name);

        return response()->json(['ok' => true]);
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|distinct',
        ]);

        $ids = $request->input('ids');
        $mediaItems = Media::whereIn('id', $ids)->get();

        foreach ($mediaItems as $media) {
            $media->delete();
            app(\App\Services\AuditLogger::class)->log('media.deleted', 'Media dihapus: ' . $media->file_name);
        }

        return response()->json(['ok' => true, 'deleted' => $mediaItems->count()]);
    }

    public function update(Request $request, Media $media)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $media->update(['name' => $request->input('name')]);
        app(\App\Services\AuditLogger::class)->log('media.updated', 'Media diperbarui: ' . $media->file_name, $media);

        return response()->json($this->serialize($media));
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
            'thumbnail_url' => $type === 'image' ? ($media->getUrl('thumbnail') ?: $media->getUrl()) : null,
            'collection_name' => $media->collection_name,
            'created_at' => $media->created_at,
            'uploaded_by' => $media->uploaded_by,
            'is_public' => (bool) $media->is_public,
        ];
    }
}
