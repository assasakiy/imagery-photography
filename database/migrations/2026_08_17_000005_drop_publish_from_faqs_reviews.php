<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('faqs', 'published')) {
            Schema::table('faqs', function (Blueprint $table) {
                $table->dropColumn('published');
            });
        }

        if (Schema::hasColumn('reviews', 'is_published')) {
            Schema::table('reviews', function (Blueprint $table) {
                $table->dropIndex(['is_published']);
                $table->dropColumn(['is_published', 'published_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::table('faqs', function (Blueprint $table) {
            $table->boolean('published')->default(true)->after('order');
        });

        Schema::table('reviews', function (Blueprint $table) {
            $table->boolean('is_published')->default(false)->after('recommend_score');
            $table->timestamp('published_at')->nullable()->after('is_published');
            $table->index('is_published');
        });
    }
};