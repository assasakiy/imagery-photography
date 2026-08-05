<?php

namespace App\Support;

class ContentRenderer
{
    /**
     * Ubah konten menjadi HTML yang aman untuk ditampilkan.
     * - Konten baru (Tiptap) sudah berupa HTML -> disanitasi.
     * - Konten lama (plain text, paragraf dipisah baris kosong) -> dibungkus <p>.
     */
    public static function toHtml(?string $text): string
    {
        if ($text === null || trim($text) === '') {
            return '';
        }

        if (str_contains($text, '<')) {
            return ContentSanitizer::clean($text);
        }

        $paragraphs = preg_split('/\n\s*\n/', trim($text));

        $html = array_map(function ($p) {
            $p = trim($p);

            return $p === '' ? '' : '<p>' . e($p) . '</p>';
        }, $paragraphs);

        return implode('', $html);
    }
}
