<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_platforms', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('icon')->nullable();
            $table->string('color')->nullable();
            $table->string('base_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('user_socials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('social_platform_id')->constrained()->cascadeOnDelete();
            $table->string('username')->nullable();
            $table->string('url')->nullable();
            $table->boolean('is_public')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // Seed platform master.
        $platforms = [
            ['name' => 'Facebook', 'slug' => 'facebook', 'icon' => 'facebook', 'base_url' => 'https://facebook.com/'],
            ['name' => 'Instagram', 'slug' => 'instagram', 'icon' => 'instagram', 'base_url' => 'https://instagram.com/'],
            ['name' => 'TikTok', 'slug' => 'tiktok', 'icon' => 'tiktok', 'base_url' => 'https://tiktok.com/'],
            ['name' => 'YouTube', 'slug' => 'youtube', 'icon' => 'youtube', 'base_url' => 'https://youtube.com/@'],
            ['name' => 'GitHub', 'slug' => 'github', 'icon' => 'github', 'base_url' => 'https://github.com/'],
        ];
        foreach ($platforms as $i => $p) {
            $id = DB::table('social_platforms')->insertGetId($p + ['sort_order' => $i + 1, 'created_at' => now(), 'updated_at' => now()]);
            $platformIds[$p['slug']] = $id;
        }

        // Migrate users.social_* legacy.
        foreach (DB::table('users')->get() as $u) {
            foreach (['facebook', 'instagram', 'tiktok'] as $slug) {
                $val = $u->{'social_' . $slug} ?? null;
                if ($val) {
                    DB::table('user_socials')->insert([
                        'user_id' => $u->id,
                        'social_platform_id' => $platformIds[$slug],
                        'url' => $val,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('user_socials');
        Schema::dropIfExists('social_platforms');
    }
};