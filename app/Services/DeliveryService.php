<?php

namespace App\Services;

use App\Models\Project;
use App\Models\ProjectFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use ZipArchive;

class DeliveryService
{
    /**
     * Verifikasi zip: bisa dibuka & jumlah entri cocok dengan ekspektasi.
     * PINTU GERBANG sebelum original boleh dihapus.
     */
    public function verifyZip(string $zipPath, int $expectedCount): bool
    {
        if (! is_file($zipPath)) {
            return false;
        }

        $zip = new ZipArchive;

        if ($zip->open($zipPath) !== true) {
            return false;
        }

        $ok = $zip->numFiles === $expectedCount;
        $zip->close();

        return $ok;
    }

    /**
     * Pastikan sebuah proyek punya paket unduhan yang siap.
     * Return: 'stored'|'generated'|'live'|'empty'.
     * Original HANYA dihapus setelah zip baru terverifikasi (verify-before-kill).
     */
    public function ensureReady(Project $p): string
    {
        // Zip permanen yang valid → siap instan.
        if ($p->delivery_zip && $p->deliveryZipAbsPath() && $this->verifyZip($p->deliveryZipAbsPath(), $p->delivery_zip_count ?? 0)) {
            if (! $p->preview_expired_at) {
                $p->update(['preview_expired_at' => now()]);
            }

            return 'stored';
        }

        return Cache::lock('delivery:' . $p->id, 600)->block(5, function () use ($p) {
            // Coba bangun zip dari original yang masih ada.
            $zipPath = $this->buildZip($p);
            if (! $zipPath) {
                // Tidak ada original sama sekali.
                if (! $p->delivery_zip && ! $p->preview_expired_at) {
                    $p->update(['preview_expired_at' => now()]);
                }

                return $p->delivery_zip ? 'stored' : 'empty';
            }

            $expected = $p->files()->where('variant', 'original')->count();

            if ($this->verifyZip($zipPath, $expected)) {
                $p->update([
                    'preview_expired_at' => now(),
                    'delivery_zip' => 'zips/' . basename($zipPath),
                    'delivery_zip_size' => filesize($zipPath),
                    'delivery_zip_count' => $expected,
                ]);
                $this->deleteOriginals($p);
                $p->addSystemUpdate('Preview berakhir. File dikemas menjadi 1 ZIP; unduhan per-file ditutup.');

                return 'generated';
            }

            // Zip cacat/gagal → jangan dipakai, original dipertahankan, log pasif.
            @unlink($zipPath);
            Log::warning('Delivery: zip tidak lolos verifikasi', ['project' => $p->id, 'expected' => $expected]);

            return 'live';
        });
    }

    /** Logika lama finalize — disatukan ke ensureReady (verify-before-kill). */
    public function finalize(Project $p): bool
    {
        return in_array($this->ensureReady($p), ['stored', 'generated'], true);
    }

    private function buildZip(Project $p): ?string
    {
        $originals = $p->files()
            ->where('variant', 'original')
            ->whereNotNull('media_id')
            ->with('media')
            ->get()
            ->filter(fn ($f) => $f->media && is_file($f->media->getPath()));

        if ($originals->isEmpty()) {
            return null;
        }

        $dir = storage_path('app/private/zips');
        if (! is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        $zipPath = $dir . '/proyek-' . $p->id . '.zip';
        $zip = new ZipArchive;

        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            Log::warning('Delivery: gagal buka zip utk build', ['project' => $p->id]);

            return null;
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
            Log::warning('Delivery: zip close gagal', ['project' => $p->id]);

            return null;
        }

        return $zipPath;
    }

    private function deleteOriginals(Project $p): void
    {
        // FK media_id cascadeOnDelete → lepas dulu agar row ProjectFile tersimpan (metadata/ringkasan).
        $p->files()->where('variant', 'original')->with('media')->get()->each(function (ProjectFile $f) {
            if ($f->media) {
                $f->update(['media_id' => null]);
                $f->media->delete();
            }
        });
    }
}