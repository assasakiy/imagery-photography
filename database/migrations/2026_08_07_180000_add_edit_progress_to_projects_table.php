<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->unsignedInteger('photo_total')->default(0)->after('price');
            $table->unsignedInteger('photo_done')->default(0)->after('photo_total');
            $table->unsignedInteger('video_total')->default(0)->after('photo_done');
            $table->unsignedInteger('video_done')->default(0)->after('video_total');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['photo_total', 'photo_done', 'video_total', 'video_done']);
        });
    }
};
