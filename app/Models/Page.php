<?php

namespace App\Models;

use App\Services\AssetResolver;
use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    protected $fillable = ['slug', 'title', 'description', 'hero_title', 'hero_subtitle', 'badge', 'button_text', 'button_link', 'button2_text', 'button2_link', 'content', 'sections', 'images', 'published'];

    protected function casts(): array
    {
        return [
            'published' => 'boolean',
            'sections' => 'array',
            'images' => 'array',
        ];
    }

    protected $appends = ['image_urls'];

    public function getImageUrlsAttribute(): array
    {
        $urls = [];
        foreach ((array) $this->images as $key => $value) {
            $urls[$key] = AssetResolver::resolveImageValue((string) $value, '');
        }

        return $urls;
    }
}
