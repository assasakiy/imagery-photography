<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->foreignId('project_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->string('title')->nullable()->after('content');
            $table->unsignedTinyInteger('recommend_score')->nullable()->after('rating');
            $table->timestamp('published_at')->nullable()->after('status');
        });

        Schema::table('project_updates', function (Blueprint $table) {
            $table->string('kind')->default('manual')->after('type'); // system, manual
        });

        Schema::table('project_files', function (Blueprint $table) {
            $table->string('category')->nullable()->after('type'); // photo, video, document
            $table->boolean('is_preview')->default(false)->after('type');
            $table->string('gallery_status')->default('preparing')->after('is_preview'); // preparing, preview_ready, released
        });
    }

    public function down(): void
    {
        Schema::table('project_files', function (Blueprint $table) {
            $table->dropColumn(['category', 'is_preview', 'gallery_status']);
        });
        Schema::table('project_updates', function (Blueprint $table) {
            $table->dropColumn('kind');
        });
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropColumn(['project_id', 'title', 'recommend_score', 'published_at']);
        });
    }
};