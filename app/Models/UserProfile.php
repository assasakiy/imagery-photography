<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserProfile extends Model
{
    protected $table = 'user_profiles';

    protected $fillable = [
        'user_id', 'full_name', 'avatar', 'cover', 'bio',
        'company', 'occupation', 'website', 'birth_date', 'gender',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function resolveMediaValue(string $field, string $conversion = ''): ?string
    {
        $value = $this->{$field};

        if (!empty($value)) {
            if (str_starts_with($value, 'media:')) {
                $mediaId = (int) substr($value, 6);
                $media = \Spatie\MediaLibrary\MediaCollections\Models\Media::find($mediaId);

                if ($media) {
                    return $conversion && $media->hasGeneratedConversion($conversion) ? $media->getUrl($conversion) : $media->getUrl();
                }
            }

            return $value;
        }

        return null;
    }

    public function avatarUrl(): ?string
    {
        return $this->resolveMediaValue('avatar', 'thumbnail');
    }

    public function coverUrl(): ?string
    {
        return $this->resolveMediaValue('cover', 'hero');
    }
}