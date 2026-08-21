<?php

namespace App\Console\Commands;

use App\Models\Project;
use App\Models\ProjectFile;
use Illuminate\Console\Command;

class RetentionCleanup extends Command
{
    protected $signature = 'projects:retention-cleanup';

    protected $description = 'Bersihkan file project lama berdasarkan setting file_retention_days';

    public function handle(): int
    {
        $retentionDays = app(\App\Services\RuntimeSettings::class)->fileRetentionDays();

        if ($retentionDays === 0) {
            $this->info("File retention disetel ke 'selamanya' — tidak ada pembersihan otomatis.");
            return self::SUCCESS;
        }

        $cutoff = now()->copy()->subDays($retentionDays);
        $count = 0;

        Project::whereNotIn('status', ['archived', 'completed'])
            ->get()
            ->each(function (Project $project) use ($cutoff, &$count) {
                $projectFiles = $project->files;
                foreach ($projectFiles as $file) {
                    if ($file->media) {
                        $file->media->delete();
                    }
                    $file->delete();
                }
                $count += $projectFiles->count();
            });

        // Also check completed/archived projects
        Project::whereIn('status', ['archived', 'completed'])
            ->where('updated_at', '<', $cutoff)
            ->get()
            ->each(function (Project $project) use ($cutoff, &$count) {
                $projectFiles = $project->files;
                foreach ($projectFiles as $file) {
                    if ($file->media) {
                        $file->media->delete();
                    }
                    $file->delete();
                }
                $count += $projectFiles->count();
            });

        $this->info("Selesai: {$count} file project dibersihkan (retention {$retentionDays} hari).");

        return self::SUCCESS;
    }
}