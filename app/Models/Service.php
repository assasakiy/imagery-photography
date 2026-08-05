<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Service extends Model
{
    protected $fillable = ['title', 'slug', 'description', 'icon', 'starting_price', 'order'];

    protected function casts(): array
    {
        return [
            'starting_price' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Service $service) {
            if (empty($service->slug)) {
                $service->slug = Str::slug($service->title);
            }
        });
    }
}
