<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->timestamp('preview_ends_at')->nullable()->after('awaiting_payment_at');
            $table->timestamp('preview_expired_at')->nullable()->after('preview_ends_at');
            $table->timestamp('reminded_at')->nullable()->after('preview_expired_at');
            $table->string('delivery_zip')->nullable()->after('reminded_at');
            $table->unsignedBigInteger('delivery_zip_size')->nullable()->after('delivery_zip');
            $table->unsignedInteger('delivery_zip_count')->nullable()->after('delivery_zip_size');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['preview_ends_at', 'preview_expired_at', 'reminded_at', 'delivery_zip', 'delivery_zip_size', 'delivery_zip_count']);
        });
    }
};
