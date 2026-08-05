<?php

namespace Database\Seeders;

use App\Models\LandingContent;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedRolesAndPermissions();

        $ownerPassword = Str::random(16);

        $owner = User::firstOrCreate(
            ['email' => 'owner@imagery.my.id'],
            [
                'name' => 'Lalu Sopian Hamdani',
                'password' => Hash::make($ownerPassword),
                'role' => 'owner',
            ]
        );

        if ($owner->wasRecentlyCreated) {
            $this->command->info("Owner baru dibuat: owner@imagery.my.id / {$ownerPassword}");
        }

        $owner->syncRoles('owner');

        $admin = User::firstOrCreate(
            ['email' => 'admin@imagery.my.id'],
            [
                'name' => 'Admin Sopian Lalu Imagery',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
            ]
        );
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

        $services = [
            ['Photography', 'Dokumentasi foto profesional untuk berbagai acara seperti wedding, prewedding, event, dan portrait.', 'camera', 500000],
            ['Videography', 'Rekaman video berkualitas tinggi dengan editing profesional untuk momen spesial Anda.', 'video', 1000000],
            ['Wedding Package', 'Paket lengkap foto dan video untuk hari pernikahan Anda.', 'heart', 3000000],
        ];

        foreach ($services as $i => [$title, $desc, $icon, $price]) {
            Service::firstOrCreate(
                ['title' => $title],
                [
                    'slug' => Str::slug($title),
                    'description' => $desc,
                    'icon' => $icon,
                    'starting_price' => $price,
                    'order' => $i + 1,
                ]
            );
        }

        $this->seedTeamMembers($owner, $admin);

        $this->seedSampleReviews();

        $this->command->info('Seeded: roles, permissions, owner, admin, landing contents, services, team, reviews');
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
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $ownerRole = Role::firstOrCreate(['name' => 'owner', 'guard_name' => 'web']);
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $clientRole = Role::firstOrCreate(['name' => 'client', 'guard_name' => 'web']);

        $ownerRole->syncPermissions($permissions);

        $adminPermissions = array_diff($permissions, ['manage-landing', 'manage-settings', 'manage-team']);
        $adminRole->syncPermissions($adminPermissions);

        $clientRole->syncPermissions(['view-projects', 'submit-reviews']);
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
            ['name' => 'Ayu & Rian', 'service' => 'Wedding Package', 'rating' => 5, 'content' => 'Hasil foto dan video pernikahan kami luar biasa. Tim yang sabar dan profesional sepanjang acara.', 'status' => 'approved'],
            ['name' => 'Sinta Maharani', 'service' => 'PreWedding', 'rating' => 5, 'content' => 'Prewedding kami jadi momen paling menyenangkan, hasilnya estetik dan sesuai ekspektasi.', 'status' => 'approved'],
            ['name' => 'Budi Santoso', 'service' => 'Event', 'rating' => 4, 'content' => 'Dokumentasi acara kantor berjalan lancar, foto yang dihasilkan berkualitas.', 'status' => 'approved'],
        ];

        foreach ($reviews as $i => $review) {
            \App\Models\Review::firstOrCreate(
                ['name' => $review['name'], 'content' => $review['content']],
                [
                    'service' => $review['service'],
                    'rating' => $review['rating'],
                    'status' => $review['status'],
                    'order' => $i + 1,
                ]
            );
        }
    }
}
