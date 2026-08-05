<?php

namespace App\Console\Commands;

use App\Support\MediaPathGenerator;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class MigrateMediaPaths extends Command
{
    protected $signature = 'media:migrate-paths
        {--dry : Tampilkan rencana tanpa memindahkan file}';

    protected $description = 'Pindahkan file media dari path default lama ke path generator baru';

    public function handle(): int
    {
        $generator = new MediaPathGenerator();
        $dry = (bool) $this->option('dry');
        $moved = 0;
        $failed = 0;

        foreach (Media::lazyById() as $media) {
            $disk = Storage::disk($media->disk ?: 'public');
            $oldBase = (string) $media->getKey();
            $newBase = rtrim($generator->getPath($media), '/');

            if ($oldBase === $newBase) {
                continue;
            }

            $moves = [
                'file' => [$oldBase.'/'.$media->file_name, $newBase.'/'.$media->file_name],
                'conversions' => ["{$oldBase}/conversions", "{$newBase}/conversions"],
                'responsive-images' => ["{$oldBase}/responsive-images", "{$newBase}/responsive-images"],
            ];

            foreach ($moves as $label => [$from, $to]) {
                if (! $disk->exists($from)) {
                    continue;
                }

                if ($dry) {
                    $this->line("  [$label] {$from}  ->  {$to}");
                    continue;
                }

                try {
                    $this->movePath($disk, $from, $to);
                    $this->info("  [{$label}] {$from}  ->  {$to}");
                } catch (\Throwable $e) {
                    $this->error("  [{$label}] {$from} : {$e->getMessage()}");
                    $failed++;
                }
            }

            // hapus folder base lama jika sudah kosong
            if (! $dry) {
                $disk->deleteDirectory($oldBase);
            }

            $moved++;
        }

        $this->newLine();
        $this->info($dry
            ? "Perencanaan selesai (dry-run)."
            : "Selesai. Media diproses: {$moved}, gagal: {$failed}.");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }

    private function movePath($disk, string $from, string $to): void
    {
        if ($disk->directoryExists($from)) {
            foreach ($disk->allFiles($from) as $file) {
                $relative = substr($file, strlen($from) + 1);
                $dest = "{$to}/{$relative}";
                $disk->makeDirectory(dirname($dest));
                $disk->move($file, $dest);
            }
            $disk->deleteDirectory($from);
        } else {
            $disk->makeDirectory(dirname($to));
            $disk->move($from, $to);
        }
    }
}