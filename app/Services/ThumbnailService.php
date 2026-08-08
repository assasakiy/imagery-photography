<?php

namespace App\Services;

use App\Models\Project;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\UploadedFile;

class ThumbnailService
{
    private const MAX = 600;

    /**
     * Auto (tanpa aksi admin): proyek belum punya thumbnail → buat dari source berdasar 600px.
     */
    public function ensureAuto(Project $p, string $sourcePath): void
    {
        if ($p->getMedia('thumbnail')->first()) {
            return;
        }

        $out = $this->resize($sourcePath);
        if (! $out) {
            return;
        }

        $p->addMedia($out)
            ->withCustomProperties(['type' => 'thumbnail', 'source' => 'auto'])
            ->toMediaCollection('thumbnail', 'public');
        @unlink($out);
    }

    /** Override: replace thumbnail tunggal dari gambar yang di-upload admin. */
    public function overrideFromUpload(Project $p, UploadedFile $file): ?string
    {
        $out = $this->resize($file->getRealPath() ?: $file->path());
        if (! $out) {
            return null;
        }

        foreach ($p->getMedia('thumbnail') as $old) {
            $old->delete();
        }

        $media = $p->addMedia($out)
            ->withCustomProperties(['type' => 'thumbnail', 'source' => 'manual'])
            ->toMediaCollection('thumbnail', 'public');
        @unlink($out);

        return $media->getUrl();
    }

    /** Resize menjadi ≤600px (paling besar sisi) JPEG kualitas ~80; return path temp atau null. */
    private function resize(string $src): ?string
    {
        if (! is_file($src)) {
            return null;
        }

        $data = @file_get_contents($src);
        $img = $data ? @imagecreatefromstring($data) : false;
        if (! $img) {
            return null;
        }

        $w = imagesx($img);
        $h = imagesy($img);
        $scale = min(1, self::MAX / max($w, $h));
        $nw = max(1, (int) round($w * $scale));
        $nh = max(1, (int) round($h * $scale));

        $dst = imagecreatetruecolor($nw, $nh);
        imagecopyresampled($dst, $img, 0, 0, 0, 0, $nw, $nh, $w, $h);
        imagedestroy($img);

        $dir = storage_path('app/private/thumb-tmp');
        if (! is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        $out = $dir . '/thumb-' . bin2hex(random_bytes(6)) . '.jpg';
        $ok = imagejpeg($dst, $out, 80);
        imagedestroy($dst);

        return $ok ? $out : null;
    }
}