<?php

namespace Database\Seeders;

use App\Models\LandingContent;
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

        $defaults = [
            ['hero_title', 'Sopian Lalu Imagery', 'hero'],
            ['hero_subtitle', 'Photography & Videography - Mengabadikan Momen Berharga Anda', 'hero'],
            ['hero_image', \App\Services\AssetResolver::DEFAULT_HERO_IMAGE, 'hero'],
            ['logo_image', \App\Services\AssetResolver::DEFAULT_LOGO_IMAGE, 'hero'],
            ['about_title', 'Tentang Kami', 'about'],
            ['about_content', 'Perkenalkan, saya adalah Lalu Sopian Hamdani, berfokus pada pekerjaan sebagai Photographer dan Videographer. Keahlian saya adalah mendokumentasikan momen dan narasi, baik melalui gambar diam maupun rekaman bergerak. Sebagai seorang fotografer, saya berupaya memastikan setiap frame memiliki komposisi dan pencahayaan yang tepat untuk mengabadikan cerita. Sementara dalam videografi, fokus saya adalah merangkai footage menjadi sebuah cerita yang kohesif dan mudah dipahami.', 'about'],
            ['about_image', \App\Services\AssetResolver::DEFAULT_ABOUT_IMAGE, 'about'],
            ['gallery_intro', 'Dari still image yang membekukan waktu hingga video yang menceritakan kisah utuh, ini adalah tempat di mana saya merangkai cahaya dan emosi menjadi warisan visual.', 'gallery'],
            ['services_intro', 'Kami menyediakan berbagai paket dokumentasi mulai dari satuan hingga bundling lengkap (Foto + Video) yang bisa Anda sesuaikan dengan momen spesial Anda.', 'services'],
            ['contact_address', 'Dasan Montong, Desa Sintung, Kec. Pringgarata, Lombok Tengah', 'contact'],
            ['contact_phone', '087764426909', 'contact'],
            ['contact_email', 'sopianlaluphotography@gmail.com', 'contact'],
            ['social_facebook', 'https://www.facebook.com/share/17UoFUX8gq/', 'social'],
            ['social_instagram', 'https://www.instagram.com/sopianlaluphotography', 'social'],
            ['social_tiktok', 'https://www.tiktok.com/@sopianlaluphotography', 'social'],
            ['social_whatsapp', 'https://wa.me/6287764426909', 'social'],
            ['site_tagline', 'Photography & Videography profesional di Lombok.', 'branding'],
            ['site_description', 'Mengabadikan momen berharga Anda menjadi warisan visual yang dikenang selamanya.', 'branding'],
            ['about_history', 'Perjalanan kami dimulai dari kecintaan pada cahaya dan cerita. Dari dokumentasi sederhana, kami tumbuh menjadi tim yang melayani berbagai momen spesial dengan standar profesional.', 'about'],
            ['about_timeline', json_encode([
                ['year' => '2019', 'text' => 'Awal berkiprah di dunia fotografi dokumentasi.'],
                ['year' => '2021', 'text' => 'Berkembang ke layanan videografi dan videografer.'],
                ['year' => '2023', 'text' => 'Menjadi tim dengan layanan fotografi & videografi lengkap.'],
            ]), 'about'],
        ];

        foreach ($defaults as [$key, $value, $group]) {
            LandingContent::firstOrCreate(
                ['key' => $key],
                ['value' => $value, 'group' => $group]
            );
        }

        $this->seedTeamMembers($owner, $admin);

        $this->seedSampleReviews();

        if ($this->command?->confirm('Seed data dummy (portofolio, paket, artikel blog)?', true)) {
            $this->call(DummyDataSeeder::class);
            $this->call(BlogSeeder::class);
        }

        $this->call(BookingAndProjectSeeder::class);

        $this->command->info('Seeded: roles, permissions, owner, admin, landing contents, team, reviews, bookings');
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
