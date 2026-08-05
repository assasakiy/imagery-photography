<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->renameColumn('title', 'name');
            $table->renameColumn('starting_price', 'price');
            $table->string('media')->default('photo');
            $table->string('event')->nullable();
            $table->string('duration')->nullable();
            $table->boolean('active')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->renameColumn('name', 'title');
            $table->renameColumn('price', 'starting_price');
            $table->dropColumn(['media', 'event', 'duration', 'active']);
        });
    }
};