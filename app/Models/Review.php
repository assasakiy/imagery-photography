<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $fillable = [
        'client_id',
        'name',
        'service',
        'rating',
        'content',
        'status',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
        ];
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }
}
