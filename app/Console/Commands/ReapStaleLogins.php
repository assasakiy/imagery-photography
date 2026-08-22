<?php

namespace App\Console\Commands;

use App\Models\LoginHistory;
use App\Models\User;
use Illuminate\Console\Command;

class ReapStaleLogins extends Command
{
    protected $signature = 'session:reap-stale-logins';

    protected $description = 'Tutup riwayat login yang masih terbuka padahal user sudah tidak aktif melebihi masa sesi.';

    public function handle(): int
    {
        $lifetimeMinutes = (int) config('session.lifetime', 120);
        $inactiveSince = now()->subMinutes($lifetimeMinutes);

        $openRows = LoginHistory::whereNull('logged_out_at')->get();

        $closed = 0;
        foreach ($openRows as $row) {
            $user = $row->user;
            $stillActive = $user?->last_seen_at && $user->last_seen_at->gte($inactiveSince);

            if ($stillActive) {
                continue;
            }

            $loggedInAt = $row->logged_in_at ?: $row->created_at;
            $closedAt = $user?->last_seen_at && $user->last_seen_at->gt($loggedInAt)
                ? $user->last_seen_at
                : now();

            $row->update([
                'logged_out_at' => $closedAt,
                'duration_seconds' => max(0, abs($closedAt->getTimestamp() - $loggedInAt->getTimestamp())),
            ]);

            $closed++;
        }

        $this->info("Login stale ditutup: {$closed}.");

        return Command::SUCCESS;
    }
}