<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('page_views', function (Blueprint $table) {
            $table->id();
            $table->string('session_id', 64)->nullable()->index();
            $table->string('path', 500);
            $table->string('ip_hash', 64)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->string('device_type', 20)->nullable();
            $table->string('os', 50)->nullable();
            $table->string('browser', 50)->nullable();
            $table->string('referrer', 500)->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->timestamp('created_at')->nullable()->index();

            $table->index(['path', 'created_at']);
        });

        Schema::create('page_view_daily', function (Blueprint $table) {
            $table->id();
            $table->date('date')->index();
            $table->string('path', 500);
            $table->unsignedInteger('views_count')->default(0);
            $table->unsignedInteger('unique_visitors')->default(0);

            $table->unique(['date', 'path']);
        });

        Schema::create('cookie_consents', function (Blueprint $table) {
            $table->id();
            $table->string('session_id', 64)->nullable()->index();
            $table->string('consent', 20)->default('necessary');
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cookie_consents');
        Schema::dropIfExists('page_view_daily');
        Schema::dropIfExists('page_views');
    }
};