<?php

namespace App\Services;

use App\Models\WatermarkedAsset;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class WatermarkService
{
    private const FONTS = [
        '/usr/share/fonts/google-noto-vf/NotoSans[wght].ttf',
        '/usr/share/fonts/redhat-vf/RedHatText[wght].ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    ];

    private const ALLOWED_MIME = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    private string $cacheDir;

    public function __construct()
    {
        $this->cacheDir = storage_path('app/watermarked');
        if (! is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0775, true);
        }
    }

    public function hash(string $source): string
    {
        $text = trim(app(RuntimeSettings::class)->siteName()) ?: 'Imagery Photography';

        return sha1($source.'|'.$text.'|v2');
    }

    public function publicUrl(string $source): string
    {
        if (! $this->isWatermarkable($source)) {
            return $source;
        }

        $hash = $this->hash($source);
        WatermarkedAsset::firstOrCreate(
            ['hash' => $hash],
            ['source' => $source]
        );

        return url('/watermark/'.$hash);
    }

    public function ensure(string $source): string
    {
        $url = $this->publicUrl($source);
        $asset = WatermarkedAsset::where('hash', $this->hash($source))->first();

        if ($asset && ! $asset->generated) {
            $this->generate($asset);
        }

        return $url;
    }

    public function serve(string $hash)
    {
        $asset = WatermarkedAsset::where('hash', $hash)->firstOrFail();

        $lock = Cache::lock('watermark:'.$hash, 120);

        if (! $lock->get()) {
            $lock->block(30);
        }

        try {
            $path = $this->cachedPath($asset);

            if (! $path || ! file_exists($path)) {
                $path = $this->generate($asset);
            }
        } finally {
            $lock->release();
        }

        if (! $path) {
            return redirect($asset->source, 302);
        }

        return response()->file($path, [
            'Content-Type' => $asset->mime_type,
            'Cache-Control' => 'public, max-age=2592000, immutable',
        ]);
    }

    private function cachedPath(WatermarkedAsset $asset): ?string
    {
        if (! $asset->mime_type || ! isset(self::ALLOWED_MIME[$asset->mime_type])) {
            return null;
        }

        return $this->cacheDir.'/'.$asset->hash.'.'.self::ALLOWED_MIME[$asset->mime_type];
    }

    private function generate(WatermarkedAsset $asset): ?string
    {
        $source = $asset->source;
        $local = $this->resolveLocalPath($source);
        $data = $local ? @file_get_contents($local) : $this->download($source);

        if (! $data) {
            Log::warning('Watermark: gagal membaca sumber', ['source' => $source]);

            return null;
        }

        $img = @imagecreatefromstring($data);
        if (! $img) {
            Log::warning('Watermark: format tidak didukung', ['source' => $source]);

            return null;
        }

        $w = imagesx($img);
        $h = imagesy($img);
        $this->drawWatermark($img, $w, $h);

        $mime = $this->detectMime($data, $source);
        $ext = self::ALLOWED_MIME[$mime] ?? null;

        if (! $ext) {
            imagedestroy($img);
            Log::warning('Watermark: mime tidak diizinkan', ['source' => $source, 'mime' => $mime]);

            return null;
        }

        $out = $this->cacheDir.'/'.$asset->hash.'.'.$ext;
        $saved = $this->saveImage($img, $out, $ext);
        imagedestroy($img);

        if (! $saved) {
            return null;
        }

        $asset->update([
            'mime_type' => $mime,
            'generated' => true,
        ]);

        return $out;
    }

    private function drawWatermark($img, int $w, int $h): void
    {
        $text = trim(app(\App\Services\RuntimeSettings::class)->siteName()) ?: 'Imagery Photography';
        $font = $this->fontPath();

        if (! $font) {
            return;
        }

        $overlay = imagecreatetruecolor($w, $h);
        imagesavealpha($overlay, true);
        $transparent = imagecolorallocatealpha($overlay, 0, 0, 0, 127);
        imagefill($overlay, 0, 0, $transparent);

        $size = max(24, (int) round(min($w, $h) * 0.055));
        $angle = -22;
        $color = imagecolorallocatealpha($overlay, 255, 255, 255, 105);

        $bbox = imagettfbbox($size, $angle, $font, $text);
        $minX = min($bbox[0], $bbox[2], $bbox[4], $bbox[6]);
        $maxX = max($bbox[0], $bbox[2], $bbox[4], $bbox[6]);
        $minY = min($bbox[1], $bbox[3], $bbox[5], $bbox[7]);
        $maxY = max($bbox[1], $bbox[3], $bbox[5], $bbox[7]);

        $tw = $maxX - $minX;
        $th = $maxY - $minY;
        $x = (int) (($w - $tw) / 2) - $minX;
        $y = (int) (($h - $th) / 2) - $minY;

        imagettftext($overlay, $size, $angle, $x, $y, $color, $font, $text);

        imagecopy($img, $overlay, 0, 0, 0, 0, $w, $h);
        imagedestroy($overlay);
    }

    private function fontPath(): ?string
    {
        foreach (self::FONTS as $font) {
            if (is_file($font)) {
                return $font;
            }
        }

        return null;
    }

    private function saveImage($img, string $out, string $ext): bool
    {
        return match ($ext) {
            'png' => imagepng($img, $out),
            'webp' => imagewebp($img, $out, 90),
            default => imagejpeg($img, $out, 92),
        };
    }

    private function detectMime(string $data, string $source): string
    {
        $info = @getimagesizefromstring($data);
        if ($info && isset(self::ALLOWED_MIME[$info['mime']])) {
            return $info['mime'];
        }

        return mime_content_type($source) ?: '';
    }

    private function isWatermarkable(string $source): bool
    {
        if (str_contains($source, '/storage/placeholders/')) {
            return false;
        }

        if (str_ends_with($source, '.svg')) {
            return false;
        }

        return true;
    }

    private function resolveLocalPath(string $source): ?string
    {
        $parsed = parse_url($source);
        if (! $parsed) {
            return null;
        }

        $host = $parsed['host'] ?? '';
        $appHost = parse_url(config('app.url'), PHP_URL_HOST) ?? '';
        $requestHost = request()->getHost();

        if ($host !== '' && $host !== $appHost && $host !== $requestHost) {
            return null;
        }

        $path = $parsed['path'] ?? '';

        if (str_starts_with($path, '/storage/')) {
            $file = storage_path('app/public/'.substr($path, strlen('/storage/')));
            if (is_file($file)) {
                return $file;
            }
        }

        if (str_starts_with($path, '/watermark/')) {
            return null;
        }

        if ($path && is_file(public_path(ltrim($path, '/')))) {
            return public_path(ltrim($path, '/'));
        }

        return null;
    }

    private function download(string $url): ?string
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_USERAGENT => 'ImageryBot/1.0 (watermark generator)',
            CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $data = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($data === false || $data === '') {
            Log::warning('Watermark: gagal download', ['url' => $url, 'error' => $error]);

            return null;
        }

        return $data;
    }
}
