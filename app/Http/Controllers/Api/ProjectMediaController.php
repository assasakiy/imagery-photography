<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use ZipArchive;
use Illuminate\Support\Facades\DB;
use App\Services\NotificationService;
use App\Models\Redelivery;

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

        $pf = $project->files()->create([
            'original_name' => $file->getClientOriginalName(),
            'filename' => $file->getClientOriginalName(),
            'mime_type' => $mime,
            'size_bytes' => $file->getSize(),
            'category' => $category,
            'variant' => $stage ? $stage : 'original',
            'drive' => 'local',
        ]);

        try {
            if ($category === 'proof') {
                $media = $project->addMedia($file)
                                 ->usingName($pf->original_name)
                                 ->usingFileName($pf->id . '_' . uniqid() . '.' . $ext)
                                 ->toMediaCollection('proofs', 'public');
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
            $label = $stage === 'start' ? 'Mulai Sesi' : 'Selesai Sesi';
            $project->updates()->create(['kind' => 'system', 'message' => "Bukti lapangan diunggah: {$label}."]);
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
        if ($file->project->status === 'archived') {
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
        $jobId = 'zip_' . $project->id;
        $progress = cache()->get($jobId, null);
        
        if ($progress === 'done') {
            $path = "zips/Project_{$project->id}_Assets.zip";
            if (Storage::disk('local')->exists($path)) {
                return response()->json(['status' => 'ready', 'url' => url('/api/projects/' . $project->id . '/download-zip?ready=1')]);
            }
        }
        
        if ($progress) {
            return response()->json(['status' => 'processing', 'progress' => $progress]);
        }
        
        return response()->json(['status' => 'none']);
    }

    public function downloadZip(Request $request, Project $project)
    {
        if ($project->status === 'archived') abort(403, 'Akses dibekukan.');
        
        $fileName = "Project_{$project->id}_Assets.zip";
        $zipPath = storage_path("app/zips/{$fileName}");
        
        if ($request->has('ready') && file_exists($zipPath)) {
            return response()->download($zipPath)->deleteFileAfterSend(true);
        }
        
        if (!file_exists(storage_path('app/zips'))) {
            mkdir(storage_path('app/zips'), 0755, true);
        }
        
        $jobId = 'zip_' . $project->id;
        cache()->put($jobId, 5, 300); // init progress
        
        $files = $project->files()
            ->whereNotNull('media_id')
            ->where('category', '!=', 'proof')
            ->where(function($q) {
                $q->where('variant', 'original')->orWhereNull('variant');
            })
            ->get();
            
        if ($files->isEmpty()) abort(404, 'Tidak ada file untuk diunduh.');
        
        $zip = new ZipArchive;
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            $total = count($files);
            $i = 0;
            
            foreach ($files as $file) {
                $media = Media::find($file->media_id);
                if ($media && file_exists($media->getPath())) {
                    $zip->addFile($media->getPath(), $file->original_name);
                }
                $i++;
                if ($i % 10 === 0) cache()->put($jobId, round(($i / $total) * 90), 300);
            }
            $zip->close();
        } else {
            cache()->forget($jobId);
            abort(500, 'Gagal membuat file ZIP.');
        }
        
        cache()->put($jobId, 'done', 300);
        return response()->json(['status' => 'ready', 'url' => url('/api/projects/' . $project->id . '/download-zip?ready=1')]);
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
