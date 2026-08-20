<?php

namespace App\Console\Commands;

use App\Services\VisitTracker;
use Illuminate\Console\Command;

class ProcessAnalytics extends Command
{
    protected $signature = 'analytics:process {--days=1 : Jumlah hari terakhir yang diproses}';

    protected $description = 'Rollup kunjungan harian ke tabel agregat page_view_daily.';

    public function handle(VisitTracker $tracker): int
    {
        $days = max(1, (int) $this->option('days'));
        $processed = 0;

        for ($i = 0; $i < $days; $i++) {
            $processed += $tracker->rollup(now()->subDays($i)->toDateString());
        }

        $this->info("Rollup analitik selesai: {$processed} baris ({$days} hari terakhir).");

        return Command::SUCCESS;
    }
}