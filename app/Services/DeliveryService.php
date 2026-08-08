<?php

namespace App\Services;

use App\Models\Project;
use Illuminate\Support\Facades\Log;
use ZipArchive;

class DeliveryService
{
    /**
     * Preview berakhir (day-30): kemas file original jadi 1 ZIP di disk privat,
     * lalu HAPUS file individual original (hemat inode). Row ProjectFile tetap utk
     * metadata/ringkasan. Hanya maju bila ZIP berhasil dibuat.
     */
    public function finalize(Project $p): bool
    {
        if ($p->preview_expired_at) {
            return true;
        }

        $originals = $p->files()->where('variant', 'original')->with('media')->get()
            ->filter(fn ($f) => $f->media && is_file($f->media->getPath()));

        if ($originals->isEmpty()) {
            $p->update(['preview_expired_at' => now()]);
            $p->addSystemUpdate('Preview berakhir (tanpa file original).');

            return true;
        }

        $dir = storage_path('app/private/zips');
        if (! is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        $zipPath = $dir . '/proyek-' . $p->id . '.zip';
        $zip = new ZipArchive;

        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            Log::warning('Delivery: gagal buat ZIP', ['project' => $p->id]);

            return false;
        }

        $used = [];
        foreach ($originals as $f) {
            $name = $f->original_name ?: $f->filename;
            $base = pathinfo($name, PATHINFO_FILENAME);
            $ext = pathinfo($name, PATHINFO_EXTENSION);
            $i = 1;
            while (isset($used[$name])) {
                $name = $base . '-' . ($i++) . ($ext ? '.' . $ext : '');
            }
            $used[$name] = true;
            $zip->addFile($f->media->getPath(), $name);
        }

        if (! $zip->close()) {
            @unlink($zipPath);
            Log::warning('Delivery: ZIP close gagal', ['project' => $p->id]);

            return false;
        }

        $p->update([
            'preview_expired_at' => now(),
            'delivery_zip' => 'zips/' . basename($zipPath),
            'delivery_zip_size' => filesize($zipPath),
            'delivery_zip_count' => $originals->count(),
        ]);

        // Hapus file individual original (preview public dibersihkan via prune terpisah).
        // FK media_id cascadeOnDelete → lepas dulu agar row ProjectFile tetap utk metadata/ringkasan.
        foreach ($originals as $f) {
            if ($f->media) {
                $f->update(['media_id' => null]);
                $f->media->delete();
            }
        }

        $p->addSystemUpdate('Preview berakhir. File dikemas menjadi 1 ZIP; unduhan per-file ditutup.');

        return true;
    }
}
