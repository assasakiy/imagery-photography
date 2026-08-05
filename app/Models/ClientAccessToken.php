<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ClientAccessToken extends Model
{
    protected $fillable = ['project_id', 'client_id', 'user_id', 'token', 'expires_at', 'used_at'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
        ];
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isValid(): bool
    {
        return $this->expires_at === null || $this->expires_at->isFuture();
    }

    public function getUrlAttribute(): string
    {
        return url('/access/' . $this->token);
    }

    public static function generateToken(): string
    {
        return 'SLI-' . Str::random(20);
    }

    public function scopeValid($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
        });
    }
}
