<?php

namespace App\Services;

use App\Models\Portfolio;

class AssetResolver
{
    public const DEFAULT_HERO_IMAGE = 'https://sopianlaluimagery.wordpress.com/wp-content/uploads/2025/11/desain-tanpa-judul-1.png';

    public const DEFAULT_LOGO_IMAGE = 'https://sopianlaluimagery.wordpress.com/wp-content/uploads/2025/11/desain-tanpa-judul.jpg';

    public const DEFAULT_ABOUT_IMAGE = 'https://sopianlaluimagery.wordpress.com/wp-content/uploads/2026/07/wp-1783272926403.jpg';

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

    /**
     * Resolve a page image from $page->images[]. Falls back to default URL.
     */
    public static function pageImage(\App\Models\Page $page, string $key, string $defaultUrl): string
    {
        $images = is_array($page->images) ? $page->images : (is_string($page->images) ? json_decode($page->images, true) : []);

        if (! array_key_exists($key, $images)) {
            return $defaultUrl;
        }

        return static::resolveImageValue((string) $images[$key], '');
    }

    public static function portfolioCoverUrl(Portfolio $portfolio): string
    {
        return $portfolio->cover_url;
    }
}
