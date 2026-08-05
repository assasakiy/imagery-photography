<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class BlogCategory extends Model
{
    protected $fillable = ['name', 'slug', 'description'];

    public function posts()
    {
        return $this->hasMany(Blog::class, 'category_id');
    }

    public function publishedPosts()
    {
        return $this->posts()->published();
    }

    public static function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $slug = Str::slug($name) ?: 'kategori-' . Str::lower(Str::random(6));
        $base = $slug;
        $i = 2;

        while (static::where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = $base . '-' . $i++;
        }

        return $slug;
    }
}
