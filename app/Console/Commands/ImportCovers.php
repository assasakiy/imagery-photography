<?php

namespace App\Console\Commands;

use App\Models\Blog;
use App\Models\Portfolio;
use Illuminate\Console\Command;

class ImportCovers extends Command
{
    protected $signature = 'media:import-covers {--dry : Hanya laporan, tanpa aksi}';

    protected $description = 'Impor cover dari image_url (URL eksternal) menjadi media Spatie lokal untuk Portfolio & Blog';

    public function handle(): int
    {
        // Collection cover dengan singleFile() otomatis mengganti media lama,
        // jadi cukup hapus image_url setelah berhasil diimpor.
        $imported = 0;
        $failed = 0;

        // Gunakan collection 'covers' biar tidak bentrok dengan single-file 'cover'.
        $cases = [];
        foreach (Portfolio::all() as $p) {
            $media = $p->getMedia('cover')->first();
            if (! $media && $p->image_url) {
                $cases[] = ['model' => 'portfolio', 'instance' => $p];
            }
        }
        foreach (Blog::all() as $b) {
            $media = $b->getMedia('cover')->first();
            if (! $media && $b->image_url) {
                $cases[] = ['model' => 'blog', 'instance' => $b];
            }
        }

        $this->info('Perlu diimpor: '.count($cases).' item.');

        foreach ($cases as $case) {
            $modelType = $case['model'];
            $obj = $case['instance'];
            $url = $obj->image_url;

            if ($this->option('dry')) {
                $this->line('  [dry] '.$modelType.' #'.$obj->id.' -> '.$url);
                continue;
            }

            try {
                $obj->addMediaFromUrl($url)
                    ->toMediaCollection('cover');

                $obj->update(['image_url' => null]);
                $imported++;
                $this->line('  OK  '.$modelType.' #'.$obj->id.' '.$url);
            } catch (\Throwable $e) {
                $failed++;
                $this->warn('  FAIL '.$modelType.' #'.$obj->id.' '.$url.' ('.$e->getMessage().')');
            }
        }

        $this->info('Selesai. '.$imported.' berhasil, '.$failed.' gagal.');

        return 0;
    }
}