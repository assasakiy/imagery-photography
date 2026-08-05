<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    protected $fillable = ['slug', 'title', 'content', 'published'];

    protected function casts(): array
    {
        return [
            'published' => 'boolean',
        ];
    }
}
