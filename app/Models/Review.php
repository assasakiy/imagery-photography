<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $fillable = [
        'project_id',
        'client_id',
        'name',
        'service',
        'rating',
        'recommend_score',
        'title',
        'content',
        'is_published',
        'published_at',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'recommend_score' => 'integer',
            'is_published' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }
}
