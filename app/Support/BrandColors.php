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

    public static function css(string $hex): string
    {
        $scale = self::scale($hex);
        $rules = ':root{';

        foreach ($scale as $shade => $value) {
            $rules .= '--color-brand-' . $shade . ':' . $value . ';';
        }

        return $rules . '}';
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
            '50' => '#f5f3ff',
            '100' => '#ede9fe',
            '200' => '#ddd6fe',
            '300' => '#c4b5fd',
            '400' => '#a78bfa',
            '500' => '#8b5cf6',
            '600' => '#7c3aed',
            '700' => '#6d28d9',
            '800' => '#5b21b6',
            '900' => '#4c1d95',
        ];
    }
}
