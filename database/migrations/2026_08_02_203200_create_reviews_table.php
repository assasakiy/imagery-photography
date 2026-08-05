<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->string('service')->nullable();
            $table->unsignedTinyInteger('rating')->default(5);
            $table->text('content');
            $table->string('status')->default('pending')->index();
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
