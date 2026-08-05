<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TeamMember extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'position',
        'bio',
        'photo_url',
        'social_facebook',
        'social_instagram',
        'social_tiktok',
        'social_whatsapp',
        'is_owner',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'is_owner' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function resolvePhotoUrl(): ?string
    {
        if (!empty($this->photo_url)) {
            if (str_starts_with($this->photo_url, 'media:')) {
                $mediaId = (int) substr($this->photo_url, 6);
                $media = \Spatie\MediaLibrary\MediaCollections\Models\Media::find($mediaId);

                if ($media) {
                    return $media->getUrl();
                }
            }

            return $this->photo_url;
        }

        // Fallback: profil user (owner) bila belum diganti dengan profil formal.
        if ($this->relationLoaded('user') || $this->user) {
            $userAvatar = $this->user?->resolveAvatarUrl();

            if ($userAvatar) {
                return $userAvatar;
            }
        }

        return \App\Services\AssetResolver::DEFAULT_ABOUT_IMAGE;
    }
}
