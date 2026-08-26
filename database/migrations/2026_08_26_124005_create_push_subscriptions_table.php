<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('endpoint', 500);
            $table->string('public_key', 255);
            $table->string('auth_token', 255);
            $table->string('content_encoding', 25)->default('aes128gcm');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['user_id', 'endpoint']);
            $table->index('endpoint');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
    }
};
