<?php

namespace App\Support;

use App\Models\Bookmark;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait Bookmarkable
{
    public function bookmarks(): MorphMany
    {
        return $this->morphMany(Bookmark::class, 'bookmarkable');
    }

    public function isBookmarkedBy(?\App\Models\User $user): bool
    {
        if (!$user) {
            return false;
        }

        return $this->bookmarks()->where('user_id', $user->id)->exists();
    }
}