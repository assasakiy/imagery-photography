<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class AuditLogger
{
    public function log(
        string $action,
        ?string $description = null,
        $subject = null,
        ?User $user = null,
        ?string $oldValue = null,
        ?string $newValue = null,
        ?string $identifier = null,
    ): void {
        $user = $user ?? Auth::user();

        AuditLog::create([
            'user_id' => $user?->id,
            'user_name' => $user?->name,
            'user_role' => $user?->getRoleNames()->first() ?? $user?->role,
            'action' => $action,
            'description' => $description,
            'identifier' => $identifier,
            'subject_type' => is_object($subject) ? get_class($subject) : null,
            'subject_id' => is_object($subject) ? $subject->getKey() : null,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'ip' => request()->ip(),
            'user_agent' => substr((string) request()->userAgent(), 0, 500),
        ]);
    }
}
