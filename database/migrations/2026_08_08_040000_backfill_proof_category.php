<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Bukti sesi lama (path-based) kini dikategorikan 'proof' supaya terpisah dari aset foto/video.
        DB::table('project_files')
            ->whereNull('media_id')
            ->whereNotNull('path')
            ->update(['category' => 'proof', 'variant' => 'record']);
    }

    public function down(): void
    {
        DB::table('project_files')->where('category', 'proof')->where('variant', 'record')->update(['category' => 'photo', 'variant' => null]);
    }
};