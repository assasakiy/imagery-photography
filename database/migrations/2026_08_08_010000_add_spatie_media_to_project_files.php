<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

return new class extends Migration
{
    public function up(): void
    {
        // Hapus data legacy (hanya hasil pengetesan).
        $paths = DB::table('project_files')->whereNotNull('path')->pluck('path');
        DB::table('project_files')->delete();
        foreach ($paths as $path) {
            Storage::disk('public')->delete($path);
        }

        Schema::table('project_files', function (Blueprint $table) {
            $table->unsignedBigInteger('media_id')->nullable()->after('project_id');
            $table->string('asset_key', 36)->nullable()->index()->after('media_id');
            $table->string('variant', 20)->nullable()->index()->after('category'); // original, preview
            $table->timestamp('preview_expires_at')->nullable()->after('expires_at');

            $table->foreign('media_id')->references('id')->on('media')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('project_files', function (Blueprint $table) {
            $table->dropForeign(['media_id']);
            $table->dropColumn(['media_id', 'asset_key', 'variant', 'preview_expires_at']);
        });
    }
};
