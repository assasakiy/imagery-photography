<?php

namespace App\Console\Commands;

use App\Models\ClientAccessToken;
use App\Models\User;
use Illuminate\Console\Command;

class ProcessInvites extends Command
{
    protected $signature = 'auth:process-invites';

    protected $description = 'Tandai invite kadaluarsa & nonaktifkan user pending yang tak aktivasi.';

    public function handle(): int
    {
        // Invite kadaluarsa (lewat masa berlaku) → status expired.
        $expiredInvites = ClientAccessToken::where('purpose', 'invite')
            ->where('status', 'pending')
            ->where('expires_at', '<', now())
            ->update(['status' => 'expired']);

        // User pending yang semua invite-nya expired → status disabled (data tetap).
        $pendingUsers = User::where('status', 'pending')->get();

        $disabled = 0;
        foreach ($pendingUsers as $user) {
            $hasValidInvite = ClientAccessToken::where('user_id', $user->id)
                ->where('purpose', 'invite')
                ->where('status', 'pending')
                ->valid()
                ->exists();

            if (!$hasValidInvite) {
                $user->update(['status' => 'disabled']);
                $disabled++;
            }
        }

        $this->info("Invite expired: {$expiredInvites}. User pending dinonaktifkan: {$disabled}.");

        return Command::SUCCESS;
    }
}