<?php

namespace App\Services;

use App\Models\HistoryEvent;
use App\Models\User;

class HistoryService
{
    public function record(User|int|null $user, string $action, ?string $targetType = null, ?int $targetId = null, array $meta = []): ?HistoryEvent
    {
        if (!$user) {
            return null;
        }

        $userId = $user instanceof User ? $user->id : $user;

        return HistoryEvent::create([
            'user_id' => $userId,
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'meta' => $meta ?: null,
            'ip' => request()->ip(),
        ]);
    }

    public function viewed(User $user, string $type, int $id, array $meta = []): ?HistoryEvent
    {
        return $this->record($user, 'viewed', $type, $id, $meta);
    }

    public function read(User $user, string $type, int $id, array $meta = []): ?HistoryEvent
    {
        return $this->record($user, 'read', $type, $id, $meta);
    }

    public function downloaded(User $user, string $type, int $id, array $meta = []): ?HistoryEvent
    {
        return $this->record($user, 'downloaded', $type, $id, $meta);
    }
}