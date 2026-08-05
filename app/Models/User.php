<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasRoles, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'bio',
        'avatar_url',
        'cover_url',
        'social_facebook',
        'social_instagram',
        'social_tiktok',
        'social_whatsapp',
        'notif_inapp',
        'notif_email',
        'notif_whatsapp',
        'notif_events',
        'notif_otp_channel',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'notif_inapp' => 'boolean',
            'notif_email' => 'boolean',
            'notif_whatsapp' => 'boolean',
            'notif_events' => 'array',
        ];
    }

    private function resolveMediaValue(string $field): ?string
    {
        $value = $this->{$field};

        if (!empty($value)) {
            if (str_starts_with($value, 'media:')) {
                $mediaId = (int) substr($value, 6);
                $media = \Spatie\MediaLibrary\MediaCollections\Models\Media::find($mediaId);

                if ($media) {
                    return $media->getUrl();
                }
            }

            return $value;
        }

        return null;
    }

    public function resolveAvatarUrl(): ?string
    {
        return $this->resolveMediaValue('avatar_url');
    }

    public function resolveCoverUrl(): ?string
    {
        return $this->resolveMediaValue('cover_url');
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    public function isOwner(): bool
    {
        return $this->hasRole('owner');
    }

    public function isStaff(): bool
    {
        return $this->isOwner() || $this->isAdmin();
    }

    public function isClient(): bool
    {
        return $this->hasRole('client');
    }

    public function client()
    {
        return $this->hasOne(Client::class);
    }

    public function teamMember()
    {
        return $this->hasOne(TeamMember::class);
    }

    public function projects()
    {
        return $this->hasMany(Project::class, 'user_id');
    }
}
