<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Portfolio extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $fillable = ['title', 'slug', 'description', 'category', 'image_url', 'is_featured', 'order'];

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

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('cover')->singleFile();
    }

    public function coverMedia(): ?Media
    {
        return $this->getMedia('cover')->first();
    }

    public function getCoverUrlAttribute(): string
    {
        if ($cover = $this->coverMedia()) {
            return $cover->getUrl();
        }

        if ($this->image_url) {
            return $this->image_url;
        }

        return asset('storage/placeholders/portfolio-placeholder.svg');
    }
}
