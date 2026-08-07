<?php

namespace App\Console\Commands;

use App\Models\ProjectFile;
use Illuminate\Console\Command;

class PruneProjectPreviews extends Command
{
    protected $signature = 'projects:prune-previews';

    protected $description = 'Hapus preview public (conversion foto & video preview) yang lewat masa 30 hari; original privat selalu dipertahankan';

    public function handle(): int
    {
        $count = ProjectFile::pruneExpired();

        $this->info("Selesai: {$count} preview dibersihkan.");

        return self::SUCCESS;
    }
}