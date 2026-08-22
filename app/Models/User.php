<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use App\Support\SoftDeletesWithWho;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class User extends Authenticatable implements HasMedia
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable, SoftDeletesWithWho, InteractsWithMedia;

    protected $fillable = [
        'username',
        'email',
        'phone',
        'password',
        'notif_inapp',
        'notif_email',
        'notif_whatsapp',
        'notif_events',
        'notif_otp_channel',
        'status',
        'activated_at',
        'deleted_by_id',
        'deleted_by_name',
        'delete_reason',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = [
        'name',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'password' => 'hashed',
            'notif_inapp' => 'boolean',
            'notif_email' => 'boolean',
            'notif_whatsapp' => 'boolean',
            'notif_events' => 'array',
            'activated_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    public function socials(): HasMany
    {
        return $this->hasMany(UserSocial::class);
    }

    /** Nama tampil: full_name ?? @username ?? email-prefix. */
    public function getNameAttribute(): string
    {
        $full = $this->profile?->full_name;
        if ($full) return $full;
        if ($this->username) {
            return '@' . $this->username;
        }

        return $full ?? '';
    }

    public function getBioAttribute(): ?string
    {
        return $this->profile?->bio;
    }

    public function getCompanyAttribute(): ?string
    {
        return $this->profile?->company;
    }

    public function getOccupationAttribute(): ?string
    {
        return $this->profile?->occupation;
    }

    public function getWebsiteAttribute(): ?string
    {
        return $this->profile?->website;
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('avatar')->singleFile();
        $this->addMediaCollection('cover')->singleFile();
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumbnail')
            ->width(600)
            ->height(600)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('avatar');

        $this->addMediaConversion('hero')
            ->width(1600)
            ->height(1600)
            ->format('webp')
            ->nonQueued()
            ->performOnCollections('cover');
    }

    public function avatar(): ?string
    {
        $media = $this->getFirstMedia('avatar');
        if ($media) {
            return $media->hasGeneratedConversion('thumbnail') ? $media->getUrl('thumbnail') : $media->getUrl();
        }
        return $this->profile?->avatarUrl();
    }

    public function cover(): ?string
    {
        $media = $this->getFirstMedia('cover');
        if ($media) {
            return $media->hasGeneratedConversion('hero') ? $media->getUrl('hero') : $media->getUrl();
        }
        return $this->profile?->coverUrl();
    }

    public function isStaff(): bool
    {
        return $this->hasRole(['owner', 'admin']);
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    public function isOwner(): bool
    {
        return $this->hasRole('owner');
    }

    public function isClient(): bool
    {
        return $this->hasRole('client');
    }

    public function isSubscriber(): bool
    {
        return $this->hasRole('subscriber');
    }

    public function isPending(): bool
    {
        return ($this->status ?? 'pending') === 'pending';
    }

    public function isDisabled(): bool
    {
        return ($this->status ?? 'pending') === 'disabled';
    }

    public function isActive(): bool
    {
        return ($this->status ?? 'pending') === 'active';
    }

    public function isVerified(): bool
    {
        return $this->isActive() && !empty($this->activated_at);
    }

    /**
     * Ambang waktu (detik) user dianggap "sedang online" sejak last_seen_at.
     */
    public static function onlineThresholdSeconds(): int
    {
        return (int) config('presence.online_threshold_seconds', 180);
    }

    public function isOnline(?int $thresholdSeconds = null): bool
    {
        if (!$this->last_seen_at) {
            return false;
        }

        return $this->last_seen_at->diffInSeconds(now()) < ($thresholdSeconds ?? static::onlineThresholdSeconds());
    }

    public function presence(): array
    {
        return [
            'online' => $this->isOnline(),
            'last_seen_at' => $this->last_seen_at?->toIso8601String(),
        ];
    }

    public function primaryRole(): string
    {
        if ($this->hasRole('owner')) return 'owner';
        if ($this->hasRole('admin')) return 'admin';
        if ($this->hasRole('client')) return 'client';
        if ($this->hasRole('subscriber')) return 'subscriber';

        return 'user';
    }

    public function teamMember()
    {
        return $this->hasOne(TeamMember::class);
    }

    public function projects()
    {
        return $this->hasMany(Project::class, 'user_id');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'user_id');
    }

    public function accessTokens(): HasMany
    {
        return $this->hasMany(ClientAccessToken::class);
    }

    public function bookmarks(): HasMany
    {
        return $this->hasMany(Bookmark::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(Like::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function historyEvents(): HasMany
    {
        return $this->hasMany(HistoryEvent::class);
    }

    public function loginHistories(): HasMany
    {
        return $this->hasMany(LoginHistory::class);
    }

    public function allowedLoginMethods(): array
    {
        return app(\App\Services\RuntimeSettings::class)->globalLoginMethods();
    }

    public function canUseLoginMethod(string $method): bool
    {
        return in_array($method, $this->allowedLoginMethods(), true);
    }

    public function updateUsername(string $username): void
    {
        $this->update(['username' => $username]);
    }
}