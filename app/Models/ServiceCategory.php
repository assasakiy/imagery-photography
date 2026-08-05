<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceCategory extends Model
{
    protected $fillable = ['label', 'title', 'description', 'layout', 'columns', 'order', 'published'];

    protected function casts(): array
    {
        return [
            'columns' => 'array',
            'published' => 'boolean',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(ServiceItem::class)->orderBy('order');
    }
}
