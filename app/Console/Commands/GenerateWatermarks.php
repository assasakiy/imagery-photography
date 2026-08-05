<?php

namespace App\Console\Commands;

use App\Models\Portfolio;
use App\Services\WatermarkService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class GenerateWatermarks extends Command
{
    protected $signature = 'media:watermark {--fresh : Hapus semua watermark yang sudah dibuat lalu generate ulang}';

    protected $description = 'Generate watermark untuk semua foto portfolio publik';

    public function handle(WatermarkService $watermark): int
    {
        if ($this->option('fresh')) {
            DB::table('watermarked_assets')->delete();
            foreach (glob(storage_path('app/watermarked/*')) as $file) {
                @unlink($file);
            }
            $this->warn('Cache watermark dibersihkan.');
        }

        $sources = Portfolio::query()
            ->get()
            ->map->cover_url
            ->unique()
            ->filter(fn ($url) => $watermark->publicUrl($url) !== $url)
            ->values();

        $this->info('Ditemukan '.$sources->count().' gambar yang perlu di-watermark.');

        $fail = 0;
        foreach ($sources as $source) {
            $watermark->ensure($source);
            $asset = \App\Models\WatermarkedAsset::where('hash', $watermark->hash($source))->first();

            if ($asset && $asset->generated) {
                $this->line('  OK  '.$source);
            } else {
                $fail++;
                $this->error('GAGAL '.$source);
            }
        }

        $this->info('Selesai. '.($sources->count() - $fail).' berhasil, '.$fail.' gagal.');

        return 0;
    }
}
