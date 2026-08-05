<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceCategory extends Model
{
    protected $fillable = ['label', 'title', 'type', 'description', 'layout', 'columns', 'order', 'published'];

    protected function casts(): array
    {
        return [
            'type' => 'string',
            'columns' => 'array',
            'published' => 'boolean',
        ];
    }
}
