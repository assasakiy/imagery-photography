<?php

namespace App\Support;

class BrandColors
{
    /**
     * Generate a Tailwind-style 50..900 scale from a single base hex color.
     * The base color becomes shade 600; lighter shades are mixed toward
     * white, darker shades toward black.
     *
     * @return array<string, string> e.g. ['50' => '#f5f3ff', ..., '900' => '#4c1d95']
     */
    public static function scale(string $hex): array
    {
        $rgb = self::hexToRgb($hex);

        if ($rgb === null) {
            return self::defaultScale();
        }

        $mix = fn (float $ratio, array $target) => array_map(
            fn ($c, $t) => (int) round($c + ($t - $c) * $ratio),
            $rgb,
            $target
        );

        $white = [255, 255, 255];
        $black = [0, 0, 0];

        return [
            '50' => self::rgbToHex($mix(0.96, $white)),
            '100' => self::rgbToHex($mix(0.90, $white)),
            '200' => self::rgbToHex($mix(0.80, $white)),
            '300' => self::rgbToHex($mix(0.65, $white)),
            '400' => self::rgbToHex($mix(0.42, $white)),
            '500' => self::rgbToHex($mix(0.18, $white)),
            '600' => $hex,
            '700' => self::rgbToHex($mix(0.14, $black)),
            '800' => self::rgbToHex($mix(0.30, $black)),
            '900' => self::rgbToHex($mix(0.48, $black)),
        ];
    }

    public static function css(string $primary, ?string $secondary = null, ?string $accent = null): string
    {
        $primaryScale = self::scale($primary);
        $secondaryScale = self::scale($secondary ?: '#18181b');
        $accentScale = self::scale($accent ?: '#d1bd9e');
        $rules = ':root{';

        foreach ($primaryScale as $shade => $value) {
            $rules .= '--color-brand-' . $shade . ':' . $value . ';';
            $rules .= '--color-primary-' . $shade . ':' . $value . ';';
        }

        foreach ($secondaryScale as $shade => $value) {
            $rules .= '--color-secondary-' . $shade . ':' . $value . ';';
        }

        foreach ($accentScale as $shade => $value) {
            $rules .= '--color-accent-' . $shade . ':' . $value . ';';
        }

        $actionBg = self::accessibleBackground($primaryScale['600']);
        $actionHover = self::darken($actionBg, 0.14);
        $rules .= '--action-bg:' . $actionBg . ';';
        $rules .= '--action-bg-hover:' . $actionHover . ';';
        $rules .= '--action-fg:#ffffff;';
        $rules .= '--brand-surface:' . $secondaryScale['800'] . ';';
        $rules .= '--brand-surface-fg:' . self::foreground($secondaryScale['800']) . ';';
        $rules .= '--accent-fg:' . $accentScale['700'] . ';';
        $rules .= '--accent-soft:' . $accentScale['100'] . ';';

        return $rules . '}';
    }

    public static function accessibleBackground(string $hex): string
    {
        $rgb = self::hexToRgb($hex) ?? [176, 141, 87];

        while (self::contrastRatio(self::rgbToHex($rgb), '#ffffff') < 4.5) {
            $rgb = array_map(fn ($channel) => max(0, (int) round($channel * 0.92)), $rgb);
        }

        return self::rgbToHex($rgb);
    }

    private static function darken(string $hex, float $ratio): string
    {
        $rgb = self::hexToRgb($hex) ?? [176, 141, 87];

        return self::rgbToHex(array_map(fn ($channel) => (int) round($channel * (1 - $ratio)), $rgb));
    }

    private static function contrastRatio(string $first, string $second): float
    {
        $l1 = self::luminance(self::hexToRgb($first) ?? [0, 0, 0]);
        $l2 = self::luminance(self::hexToRgb($second) ?? [255, 255, 255]);

        return (max($l1, $l2) + 0.05) / (min($l1, $l2) + 0.05);
    }

    private static function luminance(array $rgb): float
    {
        return array_sum(array_map(function ($channel, $weight) {
            $value = $channel / 255;
            $linear = $value <= 0.04045 ? $value / 12.92 : (($value + 0.055) / 1.055) ** 2.4;
            return $linear * $weight;
        }, $rgb, [0.2126, 0.7152, 0.0722]));
    }

    public static function foreground(string $hex): string
    {
        $rgb = self::hexToRgb($hex) ?? [255, 255, 255];

        return self::luminance($rgb) > 0.179 ? '#18181b' : '#ffffff';
    }

    private static function hexToRgb(string $hex): ?array
    {
        $hex = ltrim(trim($hex), '#');

        if (preg_match('/^[0-9a-fA-F]{3}$/', $hex)) {
            $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
        }

        if (!preg_match('/^[0-9a-fA-F]{6}$/', $hex)) {
            return null;
        }

        return [
            hexdec(substr($hex, 0, 2)),
            hexdec(substr($hex, 2, 2)),
            hexdec(substr($hex, 4, 2)),
        ];
    }

    private static function rgbToHex(array $rgb): string
    {
        return sprintf('#%02x%02x%02x', $rgb[0], $rgb[1], $rgb[2]);
    }

    public static function defaultScale(): array
    {
        return [
            '50' => '#fcfaf8',
            '100' => '#f7f4ee',
            '200' => '#efe8dd',
            '300' => '#e3d7c4',
            '400' => '#d1bd9e',
            '500' => '#bea275',
            '600' => '#b08d57',
            '700' => '#97794b',
            '800' => '#7b633d',
            '900' => '#5c492d',
        ];
    }
}
