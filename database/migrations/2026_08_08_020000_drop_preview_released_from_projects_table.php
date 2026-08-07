<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Toggle "Sembunyikan/Tampilkan" link prev tersimpan tidak berguna:
        // setelah preview tersedia, flow tak bisa kembali ke editing.
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('preview_released');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->boolean('preview_released')->default(false)->after('client_notes');
        });
    }
};