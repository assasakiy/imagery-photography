<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('watermarked_assets', function (Blueprint $table) {
            $table->id();
            $table->string('hash', 64)->unique();
            $table->text('source');
            $table->string('mime_type', 64)->nullable();
            $table->boolean('generated')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('watermarked_assets');
    }
};
