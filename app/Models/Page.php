<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    protected $fillable = ['slug', 'title', 'description', 'hero_title', 'hero_subtitle', 'badge', 'button_text', 'button_link', 'content', 'sections', 'images', 'published'];

    protected function casts(): array
    {
        return [
            'published' => 'boolean',
            'sections' => 'array',
            'images' => 'array',
        ];
    }
}
