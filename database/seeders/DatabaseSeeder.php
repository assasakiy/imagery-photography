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
        $this->seedRolesAndPermissions();
        $this->seedSocialPlatforms();

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
            $owner->forceFill(['password' => Hash::make($ownerPassword)])->save();
            $this->command->info('Owner di-reset: owner@imagery.my.id / owner123');
        }
        $owner->profile()->updateOrCreate([], ['full_name' => 'Lalu Sopian Hamdani']);

        $owner->syncRoles('owner');

        $admin = User::firstOrCreate(
            ['email' => 'admin@imagery.my.id'],
            [
                'username' => 'admin',
                'status' => 'active',
                'activated_at' => now(),
                'password' => Hash::make('admin123'),
            ]
        );
        $admin->profile()->updateOrCreate([], ['full_name' => 'Admin Sopian Lalu Imagery']);
        $admin->syncRoles('admin');

        $this->seedTeamMembers($owner, $admin);

        $this->seedSampleReviews();

        if ($this->command?->confirm('Seed data dummy (portofolio, paket, artikel blog)?', true)) {
            $this->call(DummyDataSeeder::class);
            $this->call(BlogSeeder::class);
        }

        $this->call(BookingAndProjectSeeder::class);

        $this->command->info('Seeded: roles, permissions, owner, admin, team, reviews, bookings');
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

    private function seedTeamMembers(User $owner, User $admin): void
    {
        $members = [
            ['user_id' => $owner->id, 'name' => $owner->name, 'position' => 'Owner & Founder', 'is_owner' => true, 'order' => 1, 'bio' => 'Photographer & Videographer. Mendokumentasikan momen dan narasi lewat gambar maupun rekaman.'],
            ['user_id' => $admin->id, 'name' => 'Admin Imagery', 'position' => 'Admin', 'is_owner' => false, 'order' => 2, 'bio' => 'Mendukung operasional dan layanan pelanggan.'],
        ];

        foreach ($members as $i => $member) {
            \App\Models\TeamMember::firstOrCreate(
                ['user_id' => $member['user_id']],
                [
                    'name' => $member['name'],
                    'position' => $member['position'],
                    'is_owner' => $member['is_owner'],
                    'order' => $member['order'],
                    'bio' => $member['bio'],
                ]
            );
        }
    }

    private function seedSampleReviews(): void
    {
        $reviews = [
            ['name' => 'Ayu & Rian', 'service' => 'Wedding Package', 'rating' => 5, 'content' => 'Hasil foto dan video pernikahan kami luar biasa. Tim yang sabar dan profesional sepanjang acara.', 'is_published' => true],
            ['name' => 'Sinta Maharani', 'service' => 'PreWedding', 'rating' => 5, 'content' => 'Prewedding kami jadi momen paling menyenangkan, hasilnya estetik dan sesuai ekspektasi.', 'is_published' => true],
            ['name' => 'Budi Santoso', 'service' => 'Event', 'rating' => 4, 'content' => 'Dokumentasi acara kantor berjalan lancar, foto yang dihasilkan berkualitas.', 'is_published' => true],
        ];

        foreach ($reviews as $i => $review) {
            \App\Models\Review::firstOrCreate(
                ['name' => $review['name'], 'content' => $review['content']],
                [
                    'service' => $review['service'],
                    'rating' => $review['rating'],
                    'is_published' => $review['is_published'],
                    'order' => $i + 1,
                ]
            );
        }
    }
}
