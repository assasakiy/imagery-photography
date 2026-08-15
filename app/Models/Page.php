<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    protected $fillable = ['slug', 'title', 'description', 'content', 'sections', 'images', 'published'];

    protected function casts(): array
    {
        return [
            'published' => 'boolean',
            'sections' => 'array',
            'images' => 'array',
        ];
    }
}
