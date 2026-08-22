<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Bookmark;
use App\Models\Like;
use App\Models\Comment;
use App\Services\ClientCascadeService;
use App\Services\RuntimeSettings;

class PurgeStaleAccounts extends Command
{
    protected $signature = 'accounts:purge-trashed';
    protected $description = 'Bersihkan otomatis akun yang telah melewati masa tenggang di Recycle Bin';

    public function handle(): int
    {
        $retentionDays = (int) app(RuntimeSettings::class)->get('account_retention_days', '30');

        if ($retentionDays <= 0) {
            $this->info("Retensi akun disetel ke 'Tidak pernah' — tidak ada pembersihan otomatis.");
            return self::SUCCESS;
        }

        $cutoff = now()->subDays($retentionDays);
        $staleUsers = User::onlyTrashed()->where('deleted_at', '<', $cutoff)->get();
        
        $countClient = 0;
        $countSubscriber = 0;
        $countAdmin = 0;

        foreach ($staleUsers as $user) {
            if ($user->hasRole('client')) {
                app(ClientCascadeService::class)->purgeClient($user);
                $countClient++;
            } else if ($user->hasRole('admin') || $user->hasRole('owner')) {
                if ($user->teamMember) {
                    $user->teamMember->delete();
                }
                $user->forceDelete();
                $countAdmin++;
            } else {
                Bookmark::where('user_id', $user->id)->delete();
                Like::where('user_id', $user->id)->delete();
                Comment::where('user_id', $user->id)->delete();
                $user->forceDelete();
                $countSubscriber++;
            }
        }

        $total = $countClient + $countSubscriber + $countAdmin;
        $this->info("Selesai: {$total} akun dibersihkan permanen (Client: {$countClient}, Subscriber: {$countSubscriber}, Admin/Team: {$countAdmin}).");

        return self::SUCCESS;
    }
}
