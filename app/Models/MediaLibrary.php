<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

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

    public static function singleton(): self
    {
        return static::firstOrCreate(['id' => 1], ['id' => 1]);
    }
}
