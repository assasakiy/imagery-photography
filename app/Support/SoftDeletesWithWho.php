<?php

namespace App\Support;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

trait SoftDeletesWithWho
{
    use SoftDeletes;

    public function softDeleteBy(?string $reason = null, ?\App\Models\User $actor = null): bool
    {
        $actor = $actor ?? Auth::user();

        $this->update([
            'deleted_by_id' => $actor?->id,
            'deleted_by_name' => $actor?->name,
            'delete_reason' => $reason,
        ]);

        return $this->delete();
    }

    public function deletedBy()
    {
        return $this->belongsTo(\App\Models\User::class, 'deleted_by_id');
    }
}