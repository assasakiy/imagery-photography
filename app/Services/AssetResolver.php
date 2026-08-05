<?php

namespace App\Services;

use App\Models\LandingContent;
use App\Models\Portfolio;

class AssetResolver
{
    public const DEFAULT_HERO_IMAGE = 'https://sopianlaluimagery.wordpress.com/wp-content/uploads/2025/11/desain-tanpa-judul-1.png';

    public const DEFAULT_LOGO_IMAGE = 'https://sopianlaluimagery.wordpress.com/wp-content/uploads/2025/11/desain-tanpa-judul.jpg';

    public const DEFAULT_ABOUT_IMAGE = 'https://sopianlaluimagery.wordpress.com/wp-content/uploads/2026/07/wp-1783272926403.jpg';

    /**
     * Landing image resolution.
     * value can be "media:{id}" (Spatie media), a http(s) URL, or empty.
     * Empty falls back to the provided WordPress default.
     */
    public static function landingImage(string $key, string $defaultUrl): string
    {
        return static::resolveImageValue(LandingContent::getValue($key, ''), $defaultUrl);
    }

    /**
     * Resolve a raw image value ("media:{id}", URL, or empty) into a display URL.
     * Empty falls back to the provided default URL.
     */
    public static function resolveImageValue(string $value, string $defaultUrl): string
    {
        if (empty($value)) {
            return $defaultUrl;
        }

        if (str_starts_with($value, 'media:')) {
            $id = (int) substr($value, 6);
            $media = \Spatie\MediaLibrary\MediaCollections\Models\Media::find($id);

            if ($media) {
                return $media->getUrl();
            }
        }

        if (filter_var($value, FILTER_VALIDATE_URL)) {
            if (str_starts_with($value, 'http://')) {
                return 'https://' . substr($value, strlen('http://'));
            }

            return $value;
        }

        return $defaultUrl;
    }

    public static function portfolioCoverUrl(Portfolio $portfolio): string
    {
        return $portfolio->cover_url;
    }
}
