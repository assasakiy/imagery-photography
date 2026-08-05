<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $landing = DB::table('landing_contents')->pluck('value', 'key')->toArray();

        $defaults = [
            'site_name' => 'Sopian Lalu Imagery',
            'site_tagline' => $landing['site_tagline'] ?? '',
            'site_description' => $landing['site_description'] ?? '',
            'site_logo' => $landing['logo_image'] ?? '',
            'site_favicon' => $landing['favicon_image'] ?? '',
            'login_attempts_max' => '5',
            'login_attempts_lockout_minutes' => '15',
            'login_remember_enabled' => '1',
            'login_remember_days' => '30',
            'maintenance_enabled' => '0',
            'maintenance_message' => 'Kami sedang melakukan pemeliharaan. Silakan kembali beberapa saat lagi.',
        ];

        foreach ($defaults as $key => $value) {
            DB::table('settings')->updateOrInsert(
                ['key' => $key],
                ['key' => $key, 'value' => $value]
            );
        }

        DB::table('landing_contents')->where('key', 'site_tagline')->delete();
        DB::table('landing_contents')->where('key', 'site_description')->delete();
        DB::table('landing_contents')->where('key', 'logo_image')->delete();
        DB::table('landing_contents')->where('key', 'favicon_image')->delete();
    }

    public function down(): void
    {
        $keys = [
            'site_name', 'site_tagline', 'site_description', 'site_logo', 'site_favicon',
            'login_attempts_max', 'login_attempts_lockout_minutes',
            'login_remember_enabled', 'login_remember_days',
            'maintenance_enabled', 'maintenance_message',
        ];

        DB::table('settings')->whereIn('key', $keys)->delete();
    }
};
