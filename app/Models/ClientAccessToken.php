<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ClientAccessToken extends Model
{
    protected $fillable = ['project_id', 'user_id', 'token', 'purpose', 'status', 'expires_hours', 'created_by_type', 'created_by_id', 'expires_at', 'used_at'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
        ];
    }

    public const PURPOSES = ['recovery', 'invite', 'subscribe', 'otp_login'];

    public const PURPOSES_STATUS = ['pending', 'expired', 'accepted', 'cancelled'];

    public const PURPOSE_LIFETIME = [
        'recovery'  => 1800,    // 30 menit
        'invite'    => 86400,   // 24 jam (default global; bisa dioverride expires_hours)
        'subscribe' => 86400,   // 24 jam — link aktivasi subscriber baru (wajib set-password)
        'otp_login' => 900,     // 15 menit — link login OTP (setara TTL OTP)
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
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
        if ($this->purpose === 'invite') {
            $hours = $this->expires_hours ?: app(\App\Services\RuntimeSettings::class)->inviteExpiryHours();

            return $hours * 3600;
        }

        return self::PURPOSE_LIFETIME[$this->purpose] ?? 86400;
    }

    public function isValid(): bool
    {
        return $this->expires_at === null || $this->expires_at->isFuture();
    }

    public function isPending(): bool
    {
        return ($this->status ?? 'pending') === 'pending';
    }

    public function isExpired(): bool
    {
        return ($this->status ?? 'pending') === 'expired' || !$this->isValid();
    }

    public function getUrlAttribute(): string
    {
        // Pakai APP_URL (domain produksi) supaya bebas port/host request (mis. dev :8081).
        $base = rtrim((string) config('app.url'), '/') ?: url('/');

        return $base . '/access/' . $this->token;
    }

    public static function generateToken(): string
    {
        return 'SLI-' . Str::random(20);
    }

    public static function createToken(int|User $user, string $purpose = 'invite', ?string $creatorType = null, ?int $creatorId = null, ?int $expiresHours = null): self
    {
        $userId = $user instanceof User ? $user->id : $user;

        $model = static::create([
            'project_id' => null,
            'user_id' => $userId,
            'token' => static::generateToken(),
            'purpose' => $purpose,
            'status' => 'pending',
            'expires_hours' => $purpose === 'invite' ? $expiresHours : null,
            'created_by_type' => $creatorType,
            'created_by_id' => $creatorId,
        ]);

        $model->update(['expires_at' => now()->addSeconds($model->purposeLifetime())]);

        return $model;
    }

    public function scopeValid($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
        });
    }
}
