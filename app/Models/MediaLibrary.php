<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class MediaLibrary extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $table = 'media_libraries';

    protected $fillable = ['id'];

    public $timestamps = false;

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('library');
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumbnail')
            ->width(600)
            ->format('webp')
            ->nonQueued();

        $this->addMediaConversion('hero')
            ->width(1600)
            ->format('webp')
            ->nonQueued();

        $this->addMediaConversion('preview')
            ->width(1200)
            ->format('webp')
            ->nonQueued();
    }

    public static function singleton(): self
    {
        return static::firstOrCreate(['id' => 1], ['id' => 1]);
    }
}
