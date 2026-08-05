<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('service_categories', function (Blueprint $table) {
            $table->id();
            $table->string('label')->nullable();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('layout')->default('table');
            $table->json('columns')->nullable();
            $table->unsignedInteger('order')->default(0);
            $table->boolean('published')->default(true);
            $table->timestamps();
        });

        Schema::create('service_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_category_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->json('values')->nullable();
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_items');
        Schema::dropIfExists('service_categories');
    }
};
