<?php

/**
 * One-off: generate PWA icons dari logo asli.
 * Jalankan: php scripts/generate-pwa-icons.php
 */

$src = 'storage/app/public/systemassets/library/56/logo.sli.jpg';
$outDir = 'public/icons';
if (! is_dir($outDir)) {
    mkdir($outDir, 0755, true);
}

$brand = [176, 141, 87]; // #b08d57 bronze

function coverResize(GdImage $img, int $size): GdImage
{
    $sw = imagesx($img);
    $sh = imagesy($img);
    $side = min($sw, $sh);
    $dst = imagecreatetruecolor($size, $size);
    imagecopyresampled($dst, $img, 0, 0, (int) (($sw - $side) / 2), (int) (($sh - $side) / 2), $size, $size, $side, $side);

    return $dst;
}

$src = __DIR__ . '/../' . $src;
$img = imagecreatefromjpeg($src);
if (! $img) {
    exit("Gagal memuat {$src}\n");
}

// any: 192 & 512 (cover penuh)
foreach ([192, 512] as $size) {
    imagepng(coverResize($img, $size), "{$outDir}/pwa-{$size}.png", 8);
    echo "OK {$outDir}/pwa-{$size}.png\n";
}

// maskable: canvas bronze, logo ~72% di tengah (safe zone)
$size = 512;
$canvas = imagecreatetruecolor($size, $size);
$bg = imagecolorallocate($canvas, ...$brand);
imagefill($canvas, 0, 0, $bg);

$inner = (int) ($size * 0.72);
$scaled = coverResize($img, $inner);
$x = (int) (($size - $inner) / 2);
imagecopymerge($canvas, $scaled, $x, $x, 0, 0, $inner, $inner, 100);
imagepng($canvas, "{$outDir}/pwa-maskable-512.png", 8);
echo "OK {$outDir}/pwa-maskable-512.png\n";

echo "Selesai.\n";
