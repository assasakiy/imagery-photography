<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Faq extends Model
{
    protected $fillable = ['question', 'answer', 'order', 'published'];

    protected function casts(): array
    {
        return [
            'published' => 'boolean',
        ];
    }
}
