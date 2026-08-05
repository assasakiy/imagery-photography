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
