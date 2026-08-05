<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->foreignId('package_id')->nullable()->after('type')->constrained()->nullOnDelete();
            $table->json('pricing_snapshot')->nullable()->after('price');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropConstrainedForeignId('package_id');
            $table->dropColumn('pricing_snapshot');
        });
    }
};