<?php

use App\Support\ContentRenderer;
use App\Support\ContentSanitizer;

if (! function_exists('content_html')) {
    function content_html(?string $text): string
    {
        return ContentRenderer::toHtml($text);
    }
}

if (! function_exists('content_plain')) {
    function content_plain(?string $html): string
    {
        return ContentSanitizer::plainText($html);
    }
}

if (! function_exists('content_first_sentences')) {
    function content_first_sentences(?string $html, int $count = 2): string
    {
        $text = ContentSanitizer::plainText($html);
        if ($text === '') {
            return '';
        }

        $sentences = preg_split('/(?<=[.!?])\s+/u', trim($text));
        $sentences = array_values(array_filter($sentences, fn ($s) => trim($s) !== ''));

        return trim(implode(' ', array_slice($sentences, 0, $count)));
    }
}

if (! function_exists('watermark_url')) {
    function watermark_url(?string $source): string
    {
        if ($source === null || $source === '') {
            return '';
        }
        return app(\App\Services\WatermarkService::class)->publicUrl($source);
    }
}

if (! function_exists('maps_embed_url')) {
    /**
     * Ubah URL Google Maps biasa/link bagikan menjadi URL embed untuk <iframe>.
     */
    function maps_embed_url(?string $url): string
    {
        $url = trim((string) $url);
        if ($url === '') {
            return '';
        }

        if (str_contains($url, 'output=embed')) {
            return $url;
        }

        if (preg_match('/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/', $url, $m)) {
            return 'https://www.google.com/maps?q=' . $m[1] . ',' . $m[2] . '&output=embed';
        }

        parse_str((string) parse_url($url, PHP_URL_QUERY), $params);
        if (! empty($params['q'])) {
            return 'https://www.google.com/maps?q=' . urlencode((string) $params['q']) . '&output=embed';
        }

        return 'https://www.google.com/maps?q=' . urlencode($url) . '&output=embed';
    }
}

if (! function_exists('contact_info')) {
    /**
     * Contact = single source of truth semua info kontak website.
     * Sumber: sections.kontak halaman Contact.
     *
     * Return: ['phone','email','address','map_url','socials' => [['type','label','url']]]
     */
    function contact_info(): array
    {
        $page = \App\Models\Page::where('slug', 'contact')->first();
        $sections = is_array($page?->sections) ? $page->sections : [];
        $c = collect($sections)->firstWhere('type', 'kontak') ?: [];

        $labels = ['facebook' => 'Facebook', 'instagram' => 'Instagram', 'tiktok' => 'TikTok', 'whatsapp' => 'WhatsApp', 'youtube' => 'YouTube', 'x' => 'X / Twitter', 'telegram' => 'Telegram', 'threads' => 'Threads', 'linkedin' => 'LinkedIn', 'pinterest' => 'Pinterest'];

        // Sosmed dari section (array baru) / objek legacy.
        $rawSocials = $c['socials'] ?? [];
        $socials = [];
        if (array_is_list($rawSocials)) {
            foreach ($rawSocials as $s) {
                if (empty($s['url'])) {
                    continue;
                }
                $socials[] = ['type' => (string) ($s['type'] ?? ''), 'label' => (string) ($s['label'] ?? ($labels[$s['type'] ?? ''] ?? 'Sosial')), 'url' => (string) $s['url']];
            }
        } else {
            foreach (['facebook', 'instagram', 'tiktok', 'whatsapp'] as $type) {
                if (! empty($rawSocials[$type])) {
                    $socials[] = ['type' => $type, 'label' => $labels[$type], 'url' => $rawSocials[$type]];
                }
            }
            foreach ((array) ($rawSocials['extra'] ?? []) as $s) {
                if (! empty($s['url'])) {
                    $socials[] = ['type' => (string) ($s['type'] ?? ''), 'label' => (string) ($s['label'] ?? 'Sosial'), 'url' => (string) $s['url']];
                }
            }
        }

        return [
            'phone' => trim((string) ($c['phone'] ?? '')),
            'email' => trim((string) ($c['email'] ?? '')),
            'address' => trim((string) ($c['address'] ?? '')),
            'map_url' => trim((string) ($c['map_url'] ?? '')),
            'socials' => $socials,
        ];
    }
}
