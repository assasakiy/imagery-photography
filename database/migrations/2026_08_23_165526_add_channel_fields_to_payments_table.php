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
        Schema::table('payments', function (Blueprint $table) {
            $table->string('channel_type', 20)->nullable()->after('status');
            $table->string('channel_label', 100)->nullable()->after('channel_type');
            $table->string('account_number', 50)->nullable()->after('channel_label');
            $table->string('account_name', 100)->nullable()->after('account_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['channel_type', 'channel_label', 'account_number', 'account_name']);
        });
    }
};
