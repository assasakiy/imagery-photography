<?php

namespace App\Models;

use App\Support\Bookmarkable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Portfolio extends Model implements HasMedia
{
    use Bookmarkable, InteractsWithMedia;

    protected $fillable = ['title', 'slug', 'description', 'image_url', 'is_featured', 'order'];

    protected function casts(): array
    {
        return [
            'is_featured' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Portfolio $portfolio) {
            if (empty($portfolio->slug)) {
                $portfolio->slug = Str::slug($portfolio->title);
            }
        });
    }

    public function categories()
    {
        return $this->morphToMany(Category::class, 'categorizable');
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('cover')->singleFile();
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumbnail')
            ->width(800)
            ->format('webp')
            ->nonQueued();
    }

    public function coverMedia(): ?Media
    {
        return $this->getMedia('cover')->first();
    }

    public function getCoverUrlAttribute(): ?string
    {
        try {
            if ($cover = $this->coverMedia()) {
                return $cover->getUrl();
            }
        } catch (\Throwable $e) {}

        if ($this->image_url) {
            return $this->image_url;
        }

        return null;
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        try {
            if ($cover = $this->coverMedia()) {
                return $cover->getUrl('thumbnail');
            }
        } catch (\Throwable $e) {}

        return $this->cover_url;
    }
}
