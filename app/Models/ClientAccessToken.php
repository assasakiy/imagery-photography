<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ClientAccessToken extends Model
{
    protected $fillable = ['project_id', 'client_id', 'user_id', 'token', 'purpose', 'created_by_type', 'created_by_id', 'expires_at', 'used_at'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
        ];
    }

    public const PURPOSES = ['project', 'recovery', 'invite'];

    public const PURPOSE_LIFETIME = [
        'project' => 86400,   // 24 jam
        'recovery' => 1800,   // 30 menit
        'invite' => 604800,   // 7 hari
    ];

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

    public function creator()
    {
        return $this->morphTo('creator', 'created_by_type', 'created_by_id')->withDefault();
    }

    public function purposeLifetime(): int
    {
        return self::PURPOSE_LIFETIME[$this->purpose] ?? 86400;
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

    public static function createToken(int|Client $client, int|User|null $user, string $purpose = 'project', ?string $creatorType = null, ?int $creatorId = null, $expiresAt = null): self
    {
        $clientId = $client instanceof Client ? $client->id : $client;
        $userId = $user instanceof User ? $user->id : $user;

        return static::create([
            'project_id' => null,
            'client_id' => $clientId,
            'user_id' => $userId,
            'token' => static::generateToken(),
            'purpose' => $purpose,
            'created_by_type' => $creatorType,
            'created_by_id' => $creatorId,
            'expires_at' => $expiresAt ?? now()->addSeconds(static::PURPOSE_LIFETIME[$purpose] ?? 86400),
        ]);
    }

    public function scopeValid($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
        });
    }
}
