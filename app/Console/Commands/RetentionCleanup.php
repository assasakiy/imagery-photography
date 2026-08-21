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
        $retentionDays = (int) app(\App\Services\RuntimeSettings::class)->get('file_retention_days', '0');

        if ($retentionDays <= 0) {
            $this->info("File retention disetel ke 'selamanya' — tidak ada pembersihan otomatis.");
            return self::SUCCESS;
        }

        $cutoff = now()->subDays($retentionDays);
        $count = 0;

        // Hanya project yang SUDAH archived/completed DAN updated_at sudah melewati cutoff
        Project::whereIn('status', ['archived', 'completed'])
            ->where('updated_at', '<', $cutoff)
            ->get()
            ->each(function (Project $project) use (&$count) {
                ProjectFile::where('project_id', $project->id)
                    ->with('media')
                    ->get()
                    ->each(function (ProjectFile $file) use (&$count) {
                        if ($file->media) {
                            $file->media->delete();
                        }
                        $file->delete();
                        $count++;
                    });
            });

        $this->info("Selesai: {$count} file project dibersihkan (retention {$retentionDays} hari).");

        return self::SUCCESS;
    }
}
