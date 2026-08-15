<?php

namespace App\Models;

use App\Support\Bookmarkable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Blog extends Model implements HasMedia
{
    use Bookmarkable, InteractsWithMedia, SoftDeletes;

    protected $fillable = [
        'author_id', 'category_id', 'title', 'slug', 'excerpt',
        'content', 'image_url', 'status', 'published_at',
        'views_count', 'is_featured',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
        ];
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function categories()
    {
        return $this->morphToMany(Category::class, 'categorizable');
    }

    public function tags()
    {
        return $this->belongsToMany(BlogTag::class, 'blog_post_tag', 'blog_id', 'tag_id');
    }

    public function coverMedia()
    {
        return $this->getFirstMedia('cover');
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('cover')->singleFile();
        $this->addMediaCollection('content_images');
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumbnail')
            ->width(400)
            ->format('webp')
            ->nonQueued();

        $this->addMediaConversion('medium')
            ->width(1200)
            ->format('webp')
            ->nonQueued();
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('published_at')->orWhere('published_at', '<=', now());
            });
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopePopular($query, int $limit = 6)
    {
        return $query->orderByDesc('views_count')->orderByDesc('published_at')->take($limit);
    }

    public function resolveCoverUrl(): ?string
    {
        try {
            if ($media = $this->coverMedia()) {
                return $media->getUrl();
            }
        } catch (\Throwable $e) {}

        if (!empty($this->image_url)) {
            return $this->image_url;
        }

        return null;
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        try {
            if ($media = $this->coverMedia()) {
                return $media->getUrl('medium');
            }
        } catch (\Throwable $e) {}

        return $this->resolveCoverUrl();
    }

    public static function uniqueSlug(string $title, ?int $ignoreId = null): string
    {
        $slug = Str::slug($title) ?: 'post-' . Str::lower(Str::random(6));
        $base = $slug;
        $i = 2;

        while (static::where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = $base . '-' . $i++;
        }

        return $slug;
    }
}
