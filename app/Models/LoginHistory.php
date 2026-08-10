<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoginHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'method',
        'status',
        'identifier',
        'ip',
        'user_agent',
        'logged_in_at',
        'logged_out_at',
        'duration_seconds',
    ];

    protected function casts(): array
    {
        return [
            'logged_in_at' => 'datetime',
            'logged_out_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeOpen($query)
    {
        return $query->whereNull('logged_out_at');
    }
}
