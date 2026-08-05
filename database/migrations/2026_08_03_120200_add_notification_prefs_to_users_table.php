<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('notif_events')->nullable()->after('notif_whatsapp');
            $table->string('notif_otp_channel', 20)->nullable()->after('notif_events');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['notif_events', 'notif_otp_channel']);
        });
    }
};
