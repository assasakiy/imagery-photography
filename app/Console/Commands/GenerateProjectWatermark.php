<?php

namespace App\Console\Commands;

use App\Services\RuntimeSettings;
use Illuminate\Console\Command;

class GenerateProjectWatermark extends Command
{
    protected $signature = 'media:generate-project-watermark';

    protected $description = 'Generate public/watermark.png (logo teks transparan utk preview foto proyek)';

    private const FONTS = [
        '/usr/share/fonts/google-noto-vf/NotoSans[wght].ttf',
        '/usr/share/fonts/redhat-vf/RedHatText[wght].ttf',
    ];

    public function handle(): int
    {
        $text = trim(app(RuntimeSettings::class)->siteName()) ?: 'Imagery Photography';

        $font = null;
        foreach (self::FONTS as $candidate) {
            if (is_file($candidate)) {
                $font = $candidate;
                break;
            }
        }

        if (! $font) {
            $this->error('Font TTF tidak ditemukan.');

            return self::FAILURE;
        }

        $size = 96;
        $angle = -22;
        $color = imagecolorallocatealpha($img = imagecreatetruecolor(1200, 600), 255, 255, 255, 105);
        imagesavealpha($img, true);
        $transparent = imagecolorallocatealpha($img, 0, 0, 0, 127);
        imagefill($img, 0, 0, $transparent);

        $bbox = imagettfbbox($size, $angle, $font, $text);
        $minX = min($bbox[0], $bbox[2], $bbox[4], $bbox[6]);
        $maxX = max($bbox[0], $bbox[2], $bbox[4], $bbox[6]);
        $minY = min($bbox[1], $bbox[3], $bbox[5], $bbox[7]);
        $maxY = max($bbox[1], $bbox[3], $bbox[5], $bbox[7]);
        $tw = $maxX - $minX;
        $th = $maxY - $minY;

        $x = (int) ((1200 - $tw) / 2) - $minX;
        $y = (int) ((600 - $th) / 2) - $minY;

        imagettftext($img, $size, $angle, $x, $y, $color, $font, $text);

        $out = public_path('watermark.png');
        imagepng($img, $out);
        imagedestroy($img);

        $this->info('Watermark dibuat: ' . $out);

        return self::SUCCESS;
    }
}
