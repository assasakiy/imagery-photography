<?php

namespace App\Support;

use HTMLPurifier_Config;

class ContentSanitizer
{
    public static function clean(?string $html): string
    {
        if ($html === null || $html === '') {
            return '';
        }

        $config = HTMLPurifier_Config::createDefault();

        $config->set('HTML.Doctype', 'XHTML 1.0 Transitional');
        $config->set('Cache.SerializerPath', storage_path('framework/cache/purifier'));
        $config->set('HTML.Allowed', implode(',', [
            'h1[class]', 'h2[class]', 'h3[class]',
            'p[class]',
            'br',
            'strong[class]', 'b[class]', 'em[class]', 'i[class]', 'u[class]', 's[class]', 'strike[class]', 'mark[class]', 'sub[class]', 'sup[class]',
            'ul[class]', 'ol[class]', 'li[class]',
            'blockquote[class]',
            'a[href|target|rel|title|class]',
            'img[src|alt|title|width|height|class|loading]',
            'code[class]', 'pre[class]',
            'hr[class]',
        ]));
        $config->set('Attr.EnableID', true);
        $config->set('URI.DisableExternalResources', false);
        $config->set('URI.AllowedSchemes', [
            'http' => true,
            'https' => true,
            'mailto' => true,
            'tel' => true,
        ]);

        return trim(\Purifier::clean($html, $config));
    }

    public static function plainText(?string $html): string
    {
        if ($html === null || $html === '') {
            return '';
        }

        $text = static::clean($html);
        $text = preg_replace('/<br\s*\/?>/i', "\n", $text);
        $text = preg_replace('/<\/p>/i', "\n\n", $text);
        $text = preg_replace('/<\/?(?:h[1-6]|li|blockquote|pre|div|tr)>/i', "\n", $text);

        return trim(html_entity_decode(strip_tags($text)));
    }
}
