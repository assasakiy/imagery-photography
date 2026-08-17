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
