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

        $client = User::firstOrCreate(
            ['email' => 'client@imagery.my.id'],
            [
                'username' => 'client',
                'status' => 'active',
                'activated_at' => now(),
                'password' => Hash::make('client123'),
            ]
        );
        $client->profile()->updateOrCreate([], ['full_name' => 'Ayu Maharani']);
        $client->syncRoles('client');

        $this->seedTeamMembers($owner, $admin);

        $this->seedSampleReviews();
        $this->seedSampleStats();
        $this->seedSampleFaqs();

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
            ['name' => 'Ayu & Rian', 'service' => 'Wedding Package', 'rating' => 5, 'content' => 'Hasil foto dan video pernikahan kami luar biasa. Tim yang sabar dan profesional sepanjang acara.'],
            ['name' => 'Sinta Maharani', 'service' => 'PreWedding', 'rating' => 5, 'content' => 'Prewedding kami jadi momen paling menyenangkan, hasilnya estetik dan sesuai ekspektasi.'],
            ['name' => 'Budi Santoso', 'service' => 'Event', 'rating' => 4, 'content' => 'Dokumentasi acara kantor berjalan lancar, foto yang dihasilkan berkualitas.'],
        ];

        foreach ($reviews as $i => $review) {
            \App\Models\Review::firstOrCreate(
                ['name' => $review['name'], 'content' => $review['content']],
                [
                    'service' => $review['service'],
                    'rating' => $review['rating'],
                    'order' => $i + 1,
                ]
            );
        }
    }

    private function seedSampleStats(): void
    {
        $stats = [
            ['label' => 'Momen Terabadikan', 'value' => '500', 'suffix' => '+', 'order' => 1],
            ['label' => 'Pengalaman', 'value' => '5', 'suffix' => 'tahun', 'order' => 2],
            ['label' => 'Pernikahan Diapresiasi', 'value' => '350', 'suffix' => '+', 'order' => 3],
            ['label' => 'Klien Puas', 'value' => '95', 'suffix' => '%', 'order' => 4],
        ];

        foreach ($stats as $stat) {
            \App\Models\Stat::updateOrCreate(
                ['label' => $stat['label']],
                [
                    'value' => $stat['value'],
                    'suffix' => $stat['suffix'],
                    'order' => $stat['order'],
                    'source' => 'manual',
                ]
            );
        }
    }

    private function seedSampleFaqs(): void
    {
        $categories = [
            ['name' => 'Pemesanan', 'slug' => 'pemesanan'],
            ['name' => 'Pembayaran', 'slug' => 'pembayaran'],
            ['name' => 'Proses & Hasil', 'slug' => 'proses-hasil'],
        ];

        $catIds = [];
        foreach ($categories as $cat) {
            $category = \App\Models\Category::firstOrCreate(
                ['slug' => $cat['slug']],
                [
                    'name' => $cat['name'],
                    'slug' => $cat['slug'],
                    'description' => "FAQ kategori {$cat['name']}.",
                ]
            );
            $catIds[$cat['slug']] = $category->id;
        }

        $faqs = [
            ['question' => 'Bagaimana cara memesan layanan fotografi atau videografi?', 'answer' => 'Kunjungi halaman Layanan untuk melihat paket yang tersedia, lalu klik tombol Pesan pada paket pilihan Anda. Lengkapi formulir booking dengan tanggal acara dan lokasi, tim kami akan menghubungi Anda untuk konfirmasi.', 'cat' => 'pemesanan'],
            ['question' => 'Apakah email konfirmasi dikirim setelah booking?', 'answer' => 'Ya, kami mengirim email konfirmasi otomatis setelah Anda menyelesaikan formulir booking. Periksa folder spam bila email tidak ditemukan di inbox.', 'cat' => 'pemesanan'],
            ['question' => 'Sampai kapan batas waktu mengubah tanggal acara?', 'answer' => 'Perubahan tanggal acara dapat dilakukan selambat-lambatnya 14 hari sebelum hari H, dengan konfirmasi ulang ketersediaan jadwal tim.', 'cat' => 'pemesanan'],
            ['question' => 'Perlengkapan apa saja yang wajib disiapkan saat pemotretan?', 'answer' => 'Cukup datang sesuai rundown. Tim kami membawa peralatan lengkap. Untuk kebutuhan rias dan busana, mohon disiapkan sesuai rundown masing-masing.', 'cat' => 'proses-hasil'],
            ['question' => 'Berapa lama proses editing foto dan video?', 'answer' => 'Editing foto memakan waktu sekitar 2-4 minggu, sedangkan video 3-6 minggu tergantung jumlah materi dan kompleksitas.', 'cat' => 'proses-hasil'],
            ['question' => 'Apakah hasil foto bisa dipilih sendiri oleh klien?', 'answer' => 'Untuk paket tertentu, klien dapat memilih foto favorit yang masuk ke album utama. Detail ketentuannya tercantum di deskripsi paket.', 'cat' => 'proses-hasil'],
            ['question' => 'Bagaimana format pengiriman hasil akhir?', 'answer' => 'Hasil akhir dikirim dalam bentuk file digital resolusi penuh melalui link unduh yang berlaku dalam jangka waktu tertentu, serta diberikan salinan fisik sesuai paket.', 'cat' => 'proses-hasil'],
            ['question' => 'Metode pembayaran apa saja yang tersedia?', 'answer' => 'Pembayaran dapat dilakukan melalui transfer bank, e-wallet, dan metode pembayaran lain yang kami dukung. Rincian ditampilkan saat proses checkout.', 'cat' => 'pembayaran'],
            ['question' => 'Apakah tersedia skema cicilan atau DP?', 'answer' => 'Ya, pembayaran dapat diatur dengan uang muka (DP) dan pelunasan sesuai kesepakatan yang tercantum pada invoice proyek.', 'cat' => 'pembayaran'],
            ['question' => 'Kapan pelunasan harus diselesaikan?', 'answer' => 'Pelunasan diselesaikan paling lambat pada hari acara atau sesuai jadwal yang tercantum pada invoice. Jadwal pasti akan dikonfirmasi tim kami.', 'cat' => 'pembayaran'],
        ];

        \App\Models\Faq::query()->delete();
        foreach ($faqs as $i => $faq) {
            $model = \App\Models\Faq::create([
                'question' => $faq['question'],
                'answer' => $faq['answer'],
                'order' => $i + 1,
            ]);

            $model->categories()->sync([$catIds[$faq['cat']]]);
        }
    }
}
