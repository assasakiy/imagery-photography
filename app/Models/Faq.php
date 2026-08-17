<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Faq extends Model
{
    protected $fillable = ['question', 'answer', 'order'];

    protected $appends = ['categories'];

    public function categories()
    {
        return $this->morphToMany(\App\Models\Category::class, 'categorizable');
    }

    public function getCategoriesAttribute()
    {
        return $this->relationLoaded('categories')
            ? $this->categories->map(fn ($c) => ['id' => $c->id, 'name' => $c->name])->values()->toArray()
            : [];
    }
}
