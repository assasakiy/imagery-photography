<?php

namespace App\Console\Commands;

use App\Models\Project;
use App\Services\NotificationService;
use App\Services\NotificationType;
use Illuminate\Console\Command;

class ProcessProjectDeliveries extends Command
{
    protected $signature = 'projects:process-deliveries';

    protected $description = 'Lifecycle preview: reminder H-7 & arsip otomatis day-90 (ZIP day-30 via web-lazy)';

    public function handle(): int
    {
        $now = now();
        $reminded = 0;
        $archived = 0;

        // H-7: ingatkan unduh preview sebelum ditutup jadi 1 ZIP.
        Project::whereIn('status', ['awaiting_payment', 'completed'])
            ->whereNotNull('preview_ends_at')
            ->whereNull('reminded_at')
            ->whereNull('preview_expired_at')
            ->where('preview_ends_at', '>', $now)
            ->where('preview_ends_at', '<=', $now->copy()->addDays(7))
            ->get()
            ->each(function (Project $p) use (&$reminded) {
                $user = $p->user;
                if ($user) {
                    $days = max(1, (int) $p->preview_ends_at->diffInDays($now = now()));
                    $link = $p->accessTokens()->valid()->latest('id')->first()?->url ?? url('/dashboard/preview/' . $p->id);
                    app(NotificationService::class)->send(NotificationType::DOWNLOAD_LINK, $user, [
                        'name' => $user->name,
                        'link' => $link,
                        'message' => "Halo {$user->name}, preview galeri \"{$p->name}\" akan berakhir dalam {$days} hari. Unduh foto/video favorit Anda sekarang — setelahnya tersedia dalam 1 file ZIP.",
                    ]);
                }
                $p->update(['reminded_at' => now()]);
                $reminded++;
            });

        // Arsip otomatis day-90 (30 preview + 60 masa tenang).
        Project::where('status', '!=', 'archived')
            ->whereNotNull('preview_ends_at')
            ->whereNull('archived_at')
            ->where('preview_ends_at', '<=', $now->copy()->subDays(60))
            ->get()
            ->each(function (Project $p) use (&$archived) {
                $p->update(['archived_at' => now(), 'status' => 'archived']);
                $p->addSystemUpdate('Proyek diarsipkan otomatis (90 hari sejak preview).');
                $archived++;
            });

        $this->info("Selesai: {$reminded} reminder, {$archived} diarsipkan.");

        return self::SUCCESS;
    }
}