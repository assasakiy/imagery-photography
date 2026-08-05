<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('bio')->nullable()->after('phone');
            $table->string('avatar_url')->nullable()->after('bio');
            $table->string('social_facebook')->nullable()->after('avatar_url');
            $table->string('social_instagram')->nullable()->after('social_facebook');
            $table->string('social_tiktok')->nullable()->after('social_instagram');
            $table->string('social_whatsapp')->nullable()->after('social_tiktok');
            $table->boolean('notif_inapp')->default(true)->after('social_whatsapp');
            $table->boolean('notif_email')->default(true)->after('notif_inapp');
            $table->boolean('notif_whatsapp')->default(true)->after('notif_email');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'bio',
                'avatar_url',
                'social_facebook',
                'social_instagram',
                'social_tiktok',
                'social_whatsapp',
                'notif_inapp',
                'notif_email',
                'notif_whatsapp',
            ]);
        });
    }
};
