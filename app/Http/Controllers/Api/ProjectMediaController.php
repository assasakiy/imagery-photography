<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class ProjectMediaController extends Controller
{
    public function uploadFile(Request $request, Project $project)
    {
        $request->validate([
            'file' => 'required_without:files|file|max:204800',
            'files' => 'required_without:file|array',
            'files.*' => 'file|max:204800',
            'stage' => 'nullable|string|in:start,end',
        ]);

        if ($request->hasFile('files')) {
            return $this->uploadFiles($request, $project);
        }

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());
        $isVideo = in_array($ext, ['mp4', 'mov', 'avi']);
        $mime = $file->getClientMimeType();

        // Admin-only direct upload is handled via routing middleware
        
        $stage = $request->input('stage');
        $category = 'photo';
        if ($stage === 'start' || $stage === 'end') {
            $category = 'proof';
        } elseif ($isVideo) {
            $category = 'video';
        }

        $isProof = $stage === 'start' || $stage === 'end';

        // gallery_status kolom NOT NULL (default 'preparing') — hanya diset eksplisit untuk bukti.
        $attributes = [
            'original_name' => $file->getClientOriginalName(),
            'filename' => $file->getClientOriginalName(),
            'category' => $category,
            // Bukti sesi selalu variant 'record' (dipakai accessor url ProjectFile).
            'variant' => $isProof ? 'record' : ($stage ?: 'original'),
        ];
        if ($isProof) {
            $attributes['gallery_status'] = $request->input('gallery_status') ?? 'preview_ready';
        }
        $pf = $project->files()->create($attributes);

        try {
            if ($category === 'proof') {
                $media = $project->addMedia($file)
                                 ->usingName($pf->original_name)
                                 ->usingFileName($pf->id . '_' . uniqid() . '.' . $ext)
                                 ->withCustomProperties(['type' => 'proof', 'variant' => 'record'])
                                 ->toMediaCollection('proofs', 'public');
                $media->uploaded_by = Auth::id();
                $media->is_public = true;
                $media->save();
            } else {
                $media = $project->addMedia($file)
                                 ->usingName($pf->original_name)
                                 ->usingFileName($pf->id . '_' . uniqid() . '.' . $ext)
                                 ->toMediaCollection('files', 'local');
            }

            $pf->update(['media_id' => $media->id, 'filename' => $media->file_name]);
        } catch (\Exception $e) {
            $pf->delete();
            return response()->json(['message' => 'Gagal memproses file.', 'error' => $e->getMessage()], 500);
        }

        if ($category === 'proof') {
            $message = match ($stage) {
                'start' => 'Tim sudah berada di lokasi acara — lihat foto bukti.',
                'end' => 'Sesi acara selesai — lihat foto bukti.',
                default => 'Foto bukti sesi ditambahkan.',
            };
            $project->updates()->create(['user_id' => Auth::id(), 'kind' => 'manual', 'message' => $message]);
        } else {
            if ($category === 'photo') $project->increment('photo_done');
            if ($category === 'video') $project->increment('video_done');
        }

        return response()->json($pf, 201);
    }

    private function uploadFiles(Request $request, Project $project)
    {
        $files = $request->file('files');
        $uploaded = [];

        foreach ($files as $file) {
            $ext = strtolower($file->getClientOriginalExtension());
            $mime = $file->getClientMimeType();
            
            $pf = tap($project->files()->create([
                'original_name' => $file->getClientOriginalName(),
                'filename' => $file->getClientOriginalName(),
                'mime_type' => $mime,
                'size_bytes' => $file->getSize(),
                'category' => 'photo',
                'variant' => 'original',
                'drive' => 'local',
            ]), function ($pf) use ($project, $file, $ext) {
                $media = $project->addMedia($file)
                                 ->usingName($pf->original_name)
                                 ->usingFileName($pf->id . '_' . uniqid() . '.' . $ext)
                                 ->toMediaCollection('files', 'local');
                $pf->update(['media_id' => $media->id, 'filename' => $media->file_name]);
            });
            $uploaded[] = $pf;
            $project->increment('photo_done');
        }

        $count = count($uploaded);
        $project->updates()->create(['kind' => 'system', 'message' => "{$count} foto hasil edit diunggah."]);

        return response()->json(['message' => "{$count} file diunggah", 'files' => $uploaded], 201);
    }

    public function uploadVideo(Request $request, Project $project)
    {
        $request->validate([
            'preview' => 'required|file|max:204800|mimetypes:video/mp4,video/quicktime,video/x-msvideo',
            'original' => 'required|file|max:1048576|mimetypes:video/mp4,video/quicktime,video/x-msvideo',
        ]);

        $groupKey = uniqid('vid_');
        $uploaded = [];

        foreach (['preview', 'original'] as $variant) {
            $file = $request->file($variant);
            $ext = strtolower($file->getClientOriginalExtension());
            
            $pf = tap($project->files()->create([
                'original_name' => $file->getClientOriginalName(),
                'filename' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'size_bytes' => $file->getSize(),
                'category' => 'video',
                'variant' => $variant,
                'group_key' => $groupKey,
                'drive' => 'local',
            ]), function ($pf) use ($project, $file, $ext) {
                $media = $project->addMedia($file)
                                 ->usingName($pf->original_name)
                                 ->usingFileName($pf->id . '_' . uniqid() . '.' . $ext)
                                 ->toMediaCollection('files', 'local');
                $pf->update(['media_id' => $media->id, 'filename' => $media->file_name]);
            });
            $uploaded[] = $pf;
        }

        $project->increment('video_done');
        $project->updates()->create(['kind' => 'system', 'message' => "Video hasil edit diunggah (1 set)."]);

        return response()->json(['message' => 'Video diunggah', 'files' => $uploaded], 201);
    }

    public function deleteFile(ProjectFile $file)
    {
        $this->deleteProjectFile($file);
        return response()->json(['message' => 'File dihapus']);
    }

    public function deleteFiles(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'exists:project_files,id']);
        
        $files = ProjectFile::whereIn('id', $request->ids)->get();
        foreach ($files as $file) {
            $this->deleteProjectFile($file);
        }

        return response()->json(['message' => count($files) . ' file dihapus']);
    }

    private function deleteProjectFile(ProjectFile $file): void
    {
        $project = clone $file->project;
        
        if ($file->media_id) {
            Media::find($file->media_id)?->delete();
        } elseif ($file->path && Storage::disk($file->drive)->exists($file->path)) {
            Storage::disk($file->drive)->delete($file->path);
        }
        
        $cat = $file->category;
        $file->delete();
        
        if ($cat === 'photo') $project->decrement('photo_done');
        if ($cat === 'video') $project->decrement('video_done');
    }

    public function downloadFile(Request $request, ProjectFile $file)
    {
        if ($request->user()->isClient() && $file->project->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($file->project->status === 'archived' && !$file->project->hasActiveRedelivery()) {
            abort(403, 'Akses dibekukan. Proyek berada di arsip.');
        }

        if ($file->media_id) {
            $media = Media::find($file->media_id);
            if ($media) return response()->download($media->getPath(), $file->original_name);
        }

        if (!$file->path || !Storage::disk($file->drive)->exists($file->path)) {
            abort(404, 'File tidak ditemukan di server.');
        }

        return Storage::disk($file->drive)->download($file->path, $file->original_name);
    }

    public function downloadStatus(Request $request, Project $project)
    {
        if ($request->user()->isClient() && $project->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($project->status === 'archived' && !$project->hasActiveRedelivery()) {
            return response()->json(['status' => 'none']);
        }

        $zipPath = $project->deliveryZipAbsPath();

        if ($project->delivery_zip && $zipPath && file_exists($zipPath)) {
            return response()->json([
                'status' => 'ready',
                'url' => url('/api/projects/' . $project->id . '/download-zip?ready=1'),
            ]);
        }

        return response()->json(['status' => 'none']);
    }

    public function downloadZip(Request $request, Project $project)
    {
        if ($request->user()->isClient() && $project->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($project->status === 'archived' && !$project->hasActiveRedelivery()) {
            abort(403, 'Akses dibekukan.');
        }

        // Fast path: serve existing verified zip (redirected from downloadStatus)
        if ($request->has('ready')) {
            $zipPath = $project->deliveryZipAbsPath();

            if ($zipPath && file_exists($zipPath)) {
                return response()->download($zipPath, basename($zipPath));
            }

            abort(404, 'ZIP tidak ditemukan.');
        }

        // Build / retrieve zip via DeliveryService (single source of truth)
        $result = app(\App\Services\DeliveryService::class)->ensureReady($project);

        if (in_array($result, ['stored', 'generated'])) {
            return response()->json([
                'status' => 'ready',
                'url' => url('/api/projects/' . $project->id . '/download-zip?ready=1'),
            ]);
        }

        if ($result === 'empty') {
            abort(404, 'Tidak ada file untuk diunduh.');
        }

        // 'live' = originals exist but zip verification failed
        abort(503, 'File sedang diproses. Silakan coba lagi dalam beberapa menit.');
    }

    public function setThumbnail(Request $request, Project $project)
    {
        $request->validate(['file' => 'required|image|max:10240']);

        try {
            $project->clearMediaCollection('thumbnail');
            $project->addMediaFromRequest('file')->toMediaCollection('thumbnail');
            return response()->json(['message' => 'Thumbnail tersimpan']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal menyimpan thumbnail'], 500);
        }
    }
}
