<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('full_name')->nullable();
            $table->string('avatar')->nullable();
            $table->string('cover')->nullable();
            $table->text('bio')->nullable();
            $table->string('company')->nullable();
            $table->string('occupation')->nullable();
            $table->string('website')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('gender')->nullable();
            $table->timestamps();
        });

        // Migrate data dari users.name_legacy/bio/avatar_url/cover_url + clients.company
        $users = DB::table('users')->get();
        foreach ($users as $u) {
            $company = null;
            if (isset($u->role) && $u->role === 'client') {
                $company = DB::table('clients')->where('user_id', $u->id)->value('company');
            }
            DB::table('user_profiles')->insert([
                'user_id' => $u->id,
                'full_name' => $u->name_legacy,
                'bio' => $u->bio ?? null,
                'avatar' => $u->avatar_url ?? null,
                'cover' => $u->cover_url ?? null,
                'company' => $company,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};