<?php

namespace App\Services;

use App\Models\Blog;
use DOMDocument;
use DOMXPath;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class BlogContentMediaSync
{
    /**
     * Salin media inline yang dipakai di isi artikel menjadi milik si Post,
     * lalu bersihkan (garbage collect) content_images yang tak lagi ada di teks.
     * Mengembalikan HTML dengan URL gambar yang diperbarui.
     */
    public function sync(Blog $blog, string $html): string
    {
        if (! str_contains($html, '<img')) {
            $this->garbageCollect($blog, []);
            return $html;
        }

        $doc = $this->loadDom($html);
        if (! $doc) {
            return $html;
        }

        $xpath = new DOMXPath($doc);
        $images = $xpath->query('//img[@src]');
        $rewritten = [];

        foreach ($images as $img) {
            $src = $img->getAttribute('src');
            if ($src === '') {
                continue;
            }

            $media = $this->resolveMediaFromUrl($src);

            // Sudah milik artikel ini -> biarkan.
            if ($media && $media->model_type === Blog::class && (int) $media->model_id === (int) $blog->id) {
                continue;
            }

            // Sudah disalin di siklus yang sama -> pakai kembali.
            if (isset($rewritten[$src])) {
                $img->setAttribute('src', $rewritten[$src]);
                continue;
            }

            if (! $media || ! $media->getPath()) {
                continue;
            }

            try {
                $copy = $blog->addMedia($media->getPath())
                    ->preservingOriginal()
                    ->usingFileName($media->file_name)
                    ->toMediaCollection('content_images');

                $rewritten[$src] = $copy->getUrl();
                $img->setAttribute('src', $rewritten[$src]);
            } catch (\Throwable) {
                // file tidak tersedia / proses gagal -> biarkan URL lama.
            }
        }

        $newHtml = '';
        $body = $doc->getElementsByTagName('body')->item(0);
        if ($body) {
            foreach ($body->childNodes as $node) {
                $newHtml .= $doc->saveHTML($node);
            }
        } else {
            $newHtml = $doc->saveHTML();
        }

        $this->garbageCollect($blog, $this->extractImgSrc($newHtml));

        return $newHtml;
    }

    private function garbageCollect(Blog $blog, array $activeUrls): void
    {
        foreach ($blog->getMedia('content_images') as $media) {
            if (in_array($media->getUrl(), $activeUrls, true)) {
                continue;
            }

            $media->delete();
        }
    }

    private function resolveMediaFromUrl(string $src): ?Media
    {
        $path = parse_url($src, PHP_URL_PATH);
        if (! $path) {
            return null;
        }

        $patterns = [
            '#/systemassets/[^/]+/(\d+)/#',
            '#/posts/\d+/(\d+)/#',
            '#/portfolios/\d+/(\d+)/#',
            '#/media/(\d+)/#',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $path, $m)) {
                $media = Media::find((int) $m[1]);
                if ($media) {
                    return $media;
                }
            }
        }

        return null;
    }

    private function extractImgSrc(string $html): array
    {
        $doc = $this->loadDom($html);
        if (! $doc) {
            return [];
        }

        $xpath = new DOMXPath($doc);
        $urls = [];

        foreach ($xpath->query('//img[@src]') as $img) {
            $src = $img->getAttribute('src');
            if ($src !== '') {
                $urls[] = $src;
            }
        }

        return $urls;
    }

    private function loadDom(string $html): ?DOMDocument
    {
        $doc = new DOMDocument();
        libxml_use_internal_errors(true);
        $loaded = $doc->loadHTML('<?xml encoding="utf-8"?>' . $html);
        libxml_clear_errors();

        return $loaded ? $doc : null;
    }
}