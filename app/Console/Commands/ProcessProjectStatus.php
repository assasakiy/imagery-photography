<?php

namespace App\Console\Commands;

use App\Models\Project;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;

class ProcessProjectStatus extends Command
{
    protected $signature = 'projects:process-status';

    protected $description = 'Transisi otomatis status proyek berbasis waktu acara & pembayaran';

    public function handle(): int
    {
        $grace = Project::graceMinutes();
        $now = now();

        // scheduled -> pemotretan (jika waktu mulai acara sudah lewat + jeda)
        $shootingCount = $this->advance(
            Project::where('status', 'scheduled')
                ->whereNotNull('event_start')
                ->where('event_start', '<=', $now->copy()->subMinutes($grace))
                ->get(),
            'shooting'
        );

        // pemotretan -> editing (jika waktu selesai acara sudah lewat + jeda)
        $editingCount = $this->advance(
            Project::where('status', 'shooting')
                ->whereNotNull('event_end')
                ->where('event_end', '<=', $now->copy()->subMinutes($grace))
                ->get(),
            'editing'
        );

        // menunggu pembayaran -> selesai (jika invoice lunas)
        $completedCount = 0;
        Project::where('status', 'awaiting_payment')->get()
            ->filter(fn (Project $p) => $p->isPaid())
            ->each(function (Project $p) use (&$completedCount) {
                if ($p->advanceStep('completed')) {
                    $completedCount++;
                }
            });

        $this->info("Selesai: {$shootingCount} ke pemotretan, {$editingCount} ke editing, {$completedCount} ke selesai.");

        return self::SUCCESS;
    }

    private function advance(Collection $projects, string $target): int
    {
        $count = 0;
        $projects->each(function (Project $p) use ($target, &$count) {
            if ($p->advanceStep($target)) {
                $count++;
            }
        });

        return $count;
    }
}
