<?php

namespace App\Services;

use App\Models\Portfolio;

class AssetResolver
{
    public const DEFAULT_HERO_IMAGE = 'https://sopianlaluimagery.wordpress.com/wp-content/uploads/2025/11/desain-tanpa-judul-1.png';

    public const DEFAULT_LOGO_IMAGE = 'https://sopianlaluimagery.wordpress.com/wp-content/uploads/2025/11/desain-tanpa-judul.jpg';

    public const DEFAULT_ABOUT_IMAGE = 'https://sopianlaluimagery.wordpress.com/wp-content/uploads/2026/07/wp-1783272926403.jpg';

    /** Avatar netral (siluet) inline, dipakai saat profil tak punya foto — tanpa dependensi eksternal. */
    public const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%20100%20100%22%3E%3Crect%20width=%22100%22%20height=%22100%22%20fill=%22%23e2e8f0%22/%3E%3Ccircle%20cx=%2250%22%20cy=%2236%22%20r=%2218%22%20fill=%22%2394a3b8%22/%3E%3Cpath%20d=%22M50%2068c-18%200-30%209-30%2022v4h60v-4c0-13-12-22-30-22z%22%20fill=%22%2394a3b8%22/%3E%3C/svg%3E';

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
