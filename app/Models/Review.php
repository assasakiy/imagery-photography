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
        'order',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'recommend_score' => 'integer',
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
}
