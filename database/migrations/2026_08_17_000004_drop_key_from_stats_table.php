<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stats', function (Blueprint $table) {
            if (Schema::hasColumn('stats', 'key')) {
                $table->dropUnique(['key']);
                $table->dropColumn('key');
            }
        });
    }

    public function down(): void
    {
        Schema::table('stats', function (Blueprint $table) {
            $table->string('key')->nullable()->unique()->after('id');
        });
    }
};