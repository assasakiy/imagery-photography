<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectFile extends Model
{
    protected $fillable = ['project_id', 'filename', 'original_name', 'path', 'size', 'type', 'category', 'is_preview', 'gallery_status', 'expires_at'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
        ];
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function getUrlAttribute()
    {
        return asset('storage/' . $this->path);
    }
}