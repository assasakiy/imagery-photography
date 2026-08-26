<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\PermissionRegistrar;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Core Data: Roles & Social Platforms (Master Data)
        $this->seedRolesAndPermissions();
        $this->seedSocialPlatforms();

        // 2. Core User: Single Owner Account
        $ownerPassword = 'owner123';

        $owner = User::firstOrCreate(
            ['email' => 'owner@imagery.my.id'],
            [
                'username' => 'owner',
                'status' => 'active',
                'activated_at' => now(),
                'password' => Hash::make($ownerPassword),
            ]
        );

        if ($owner->wasRecentlyCreated) {
            $this->command->info("Owner baru dibuat: owner@imagery.my.id / {$ownerPassword}");
        } else {
            // Kita tidak force update password di sini agar tidak mereset password owner yang sudah diganti di production
            $this->command->info('Akun Owner sudah ada. Melewati pembuatan Owner.');
        }
        
        $owner->profile()->firstOrCreate([], ['full_name' => 'Lalu Sopian Hamdani']);
        $owner->syncRoles('owner');
        
        \App\Models\TeamMember::firstOrCreate(
            ['user_id' => $owner->id],
            [
                'name' => 'Lalu Sopian Hamdani',
                'position' => 'Owner & Founder',
                'is_owner' => true,
                'order' => 1,
                'bio' => 'Photographer & Videographer. Mendokumentasikan momen dan narasi lewat gambar maupun rekaman.',
            ]
        );

        $this->command->info('Core system seeded: Roles, Permissions, Social Platforms, and Owner account.');

        // 3. Optional Dummy Data (Admin, Client, Reviews, Stats, Portfolios, etc)
        if ($this->command?->confirm('Install data sampel/dummy (Akun Admin/Klien, Review, FAQ, Portfolio, dll) untuk keperluan development?', false)) {
            $this->call(DummyDataSeeder::class);
            $this->call(BlogSeeder::class);
            $this->call(BookingAndProjectSeeder::class);
            $this->command->info('Sample data installed successfully.');
        }
    }

    private function seedRolesAndPermissions(): void
    {
        $permissions = [
            'manage-portfolio',
            'manage-media',
            'manage-services',
            'manage-clients',
            'manage-messages',
            'manage-payments',
            'manage-landing',
            'manage-settings',
            'manage-blog',
            'manage-pages',
            'manage-faq',
            'manage-reviews',
            'manage-team',
            'view-projects',
            'submit-reviews',
            'read-blog',
            'manage-bookmarks',
            'view-history',
            'manage-subscribers',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $ownerRole = Role::firstOrCreate(['name' => 'owner', 'guard_name' => 'web']);
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $clientRole = Role::firstOrCreate(['name' => 'client', 'guard_name' => 'web']);
        $subscriberRole = Role::firstOrCreate(['name' => 'subscriber', 'guard_name' => 'web']);

        $ownerRole->syncPermissions($permissions);

        $adminPermissions = array_diff($permissions, ['manage-landing', 'manage-settings', 'manage-team']);
        $adminRole->syncPermissions($adminPermissions);

        $clientRole->syncPermissions(['view-projects', 'submit-reviews', 'read-blog', 'manage-bookmarks', 'view-history']);
        $subscriberRole->syncPermissions(['read-blog', 'manage-bookmarks', 'view-history']);
    }

    private function seedSocialPlatforms(): void
    {
        $platforms = [
            ['name' => 'Facebook', 'slug' => 'facebook', 'icon' => 'facebook', 'base_url' => 'https://facebook.com/'],
            ['name' => 'Instagram', 'slug' => 'instagram', 'icon' => 'instagram', 'base_url' => 'https://instagram.com/'],
            ['name' => 'TikTok', 'slug' => 'tiktok', 'icon' => 'tiktok', 'base_url' => 'https://tiktok.com/'],
            ['name' => 'YouTube', 'slug' => 'youtube', 'icon' => 'youtube', 'base_url' => 'https://youtube.com/@'],
            ['name' => 'GitHub', 'slug' => 'github', 'icon' => 'github', 'base_url' => 'https://github.com/'],
            ['name' => 'WhatsApp', 'slug' => 'whatsapp', 'icon' => 'whatsapp', 'base_url' => 'https://wa.me/'],
        ];

        foreach ($platforms as $i => $p) {
            \App\Models\SocialPlatform::firstOrCreate(
                ['slug' => $p['slug']],
                $p + ['is_active' => true, 'sort_order' => $i + 1]
            );
        }
    }
}
