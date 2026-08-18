<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('service_categories');
    }

    public function down(): void
    {
        // Tidak di-restore — tabel sudah dihapus permanen.
    }
};