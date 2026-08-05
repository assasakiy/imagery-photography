<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class BlogTag extends Model
{
    protected $fillable = ['name', 'slug'];

    public function posts()
    {
        return $this->belongsToMany(Blog::class, 'blog_post_tag', 'tag_id', 'blog_id');
    }

    public static function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $slug = Str::slug($name) ?: 'tag-' . Str::lower(Str::random(6));
        $base = $slug;
        $i = 2;

        while (static::where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = $base . '-' . $i++;
        }

        return $slug;
    }

    public static function findOrCreateByNames(array $names): array
    {
        $ids = [];

        foreach (array_filter(array_map('trim', $names)) as $name) {
            $tag = static::where('name', $name)->first();

            if (!$tag) {
                $tag = static::create(['name' => $name, 'slug' => static::uniqueSlug($name)]);
            }

            $ids[] = $tag->id;
        }

        return $ids;
    }
}
