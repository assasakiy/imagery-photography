<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectFile extends Model
{
    protected $fillable = ['project_id', 'filename', 'original_name', 'path', 'size', 'type'];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function getUrlAttribute()
    {
        return asset('storage/' . $this->path);
    }
}
