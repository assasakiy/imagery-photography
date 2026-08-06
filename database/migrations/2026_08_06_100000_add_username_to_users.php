<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // users: rename identitas ke nama sementara; tambah username & verified
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('name', 'name_legacy');
            $table->string('username')->nullable()->after('id');
            $table->timestamp('phone_verified_at')->nullable()->after('email_verified_at');
        });

        // Generate username: unique per user. Prefix email untuk owner/admin, acak untuk client.
        $users = DB::table('users')->orderBy('id')->get();
        foreach ($users as $u) {
            $prefix = strtolower(preg_replace('/[^A-Za-z0-9]/', '', explode('@', (string) $u->email)[0] ?? ''));
            $isStaff = in_array($u->role, ['owner', 'admin'], true);
            $base = $isStaff && strlen($prefix) > 0 ? $prefix : 'user' . substr(str_shuffle('abcdefghijklmnopqrstuvwxyz0123456789'), 0, 8);
            $username = $base;
            $i = 1;
            while (DB::table('users')->where('username', $username)->exists()) {
                $username = $base . $i;
                $i++;
            }
            DB::table('users')->where('id', $u->id)->update(['username' => $username]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['username', 'phone_verified_at']);
            $table->renameColumn('name_legacy', 'name');
        });
    }
};