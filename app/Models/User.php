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

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable, SoftDeletesWithWho;

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

    public function avatar(): ?string
    {
        return $this->profile?->avatarUrl();
    }

    public function cover(): ?string
    {
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

    public function accessTokens(): HasMany
    {
        return $this->hasMany(ClientAccessToken::class);
    }

    public function bookmarks(): HasMany
    {
        return $this->hasMany(Bookmark::class);
    }

    public function historyEvents(): HasMany
    {
        return $this->hasMany(HistoryEvent::class);
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