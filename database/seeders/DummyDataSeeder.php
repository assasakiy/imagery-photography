<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Package;
use App\Models\Portfolio;
use App\Models\Service;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DummyDataSeeder extends Seeder
{
    private const WP_BASE = 'https://sopianlaluimagery.wordpress.com/wp-content/uploads/2026/05/';

    private const IMAGES = [
        'dsc00048_1.jpg', 'dsc04026.jpg', 'img_8225.jpg', 'dsc00641.jpg',
        'img_4924.jpg', 'img_9810.jpg', 'img_9567.jpg', 'img_9589.jpg',
        'img_9762.jpg', 'img_2523.jpg', 'img_9822.jpg', 'img_2511.jpg',
        'img_2316.jpg', 'img_2398.jpg', 'img_2452.jpg', 'img_9430.jpg',
        'img_9404.jpg', 'img_1221.jpg', 'img_0282.jpg', 'img_2137.jpg',
        'img_2137-1.jpg', 'img_9377.jpg', 'img_0080.jpg', 'img_0093.jpg',
        'img_8034.jpg', 'img_8072.jpg', 'img_9678.jpg', 'img_7854.jpg',
        'img_7838.jpg', 'img_9998-1.jpg', 'img_0038-1.jpg', 'img_9999-1.jpg',
        'img_9997-1.jpg', 'dsc08818.jpg', 'dsc08832-1.jpg',
    ];

    private const PORTFOLIO_CATEGORIES = [
        'Wedding', 'Akad', 'Nyongkolan', 'Prewedding', 'Event', 'Wisuda',
    ];

    public function run(): void
    {
        $this->seedDummyUsers();
        $this->seedTeamMembers();
        $this->seedSampleReviews();
        $this->seedSampleStats();
        $this->seedSampleFaqs();

        $this->seedCategoriesAndPortfolios();
        $this->seedPackages();
    }

    private function seedDummyUsers(): void
    {
        $admin = \App\Models\User::firstOrCreate(
            ['email' => 'admin@imagery.my.id'],
            [
                'username' => 'admin',
                'status' => 'active',
                'activated_at' => now(),
                'password' => \Illuminate\Support\Facades\Hash::make('admin123'),
            ]
        );
        $admin->profile()->firstOrCreate([], ['full_name' => 'Admin Sopian Lalu Imagery']);
        $admin->syncRoles('admin');

        $client = \App\Models\User::firstOrCreate(
            ['email' => 'client@imagery.my.id'],
            [
                'username' => 'client',
                'status' => 'active',
                'activated_at' => now(),
                'password' => \Illuminate\Support\Facades\Hash::make('client123'),
            ]
        );
        $client->profile()->firstOrCreate([], ['full_name' => 'Ayu Maharani']);
        $client->syncRoles('client');
    }

    private function seedTeamMembers(): void
    {
        $owner = \App\Models\User::role('owner')->first();
        $admin = \App\Models\User::role('admin')->first();

        if ($owner && $admin) {
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

    private function seedCategoriesAndPortfolios(): void
    {
        $categoryIds = [];
        foreach (self::PORTFOLIO_CATEGORIES as $i => $name) {
            $category = Category::where('name', $name)->first();
            if (! $category) {
                $category = Category::create([
                    'name' => $name,
                    'slug' => Category::uniqueSlug($name),
                    'description' => "Portofolio dokumentasi {$name} oleh Sopian Lalu Imagery.",
                ]);
            }
            $categoryIds[$name] = $category->id;
        }

        $categoryNames = array_keys($categoryIds);
        $intro = 'Sebagian dari kumpulan karya yang merefleksikan dedikasi dalam mengabadikan setiap momen dengan detail, kualitas, dan jiwa.';

        foreach (self::IMAGES as $index => $filename) {
            $number = str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT);
            $catName = $categoryNames[$index % count($categoryNames)];

            $portfolio = Portfolio::updateOrCreate(
                ['slug' => 'portofolio-' . $number],
                [
                    'title' => "Dokumentasi {$catName} - {$number}",
                    'description' => $intro,
                    'image_url' => self::WP_BASE . $filename,
                    'is_featured' => $index < 6,
                    'order' => $index + 1,
                ]
            );

            $portfolio->categories()->sync([$categoryIds[$catName]]);
        }

        $this->command->info('Portofolio: ' . count(self::IMAGES) . ' item dengan kategori tersinkron.');
    }

    private function seedPackages(): void
    {
        Service::query()->delete();
        Package::query()->delete();

        // Paket satuan (dari halaman Layanan WordPress).
        $satuan = [
            ['Akad', 'photo', null, 'Edit + Softfile', 400000],
            ['Wedding', 'photo', null, 'Edit + Softfile', 450000],
            ['Nyongkolan', 'photo', null, 'Edit + Softfile', 500000],
            ['Ulang Tahun', 'photo', null, 'Edit + Softfile', 350000],
            ['Hunting', 'photo', '3 Jam', 'Edit + Softfile', 300000],
            ['Wisuda', 'photo', '1 Jam', 'Edit + Softfile', 450000],
            ['Akad', 'video', '3-4 Menit', null, 500000],
            ['Wedding', 'video', '3-4 Menit', null, 550000],
            ['Nyongkolan', 'video', '3-4 Menit', null, 600000],
            ['Ulang Tahun', 'video', '3-4 Menit', null, 450000],
            ['Hunting', 'video', '1-2 Menit', null, 300000],
            ['Wisuda', 'video', '1-2 Menit', null, 450000],
        ];

        $services = [];
        foreach ($satuan as $i => [$event, $media, $duration, $terms, $price]) {
            $services[sprintf('%s|%s', $event, $media)] = Service::create([
                'event' => $event,
                'media' => $media,
                'duration' => $duration,
                'terms' => $terms,
                'price' => $price,
                'order' => $i + 1,
                'active' => true,
            ]);
        }

        $s = fn ($event, $media) => $services[sprintf('%s|%s', $event, $media)] ?? null;

        // Paket premium (single medium) — harga foto & video per baris.
        $discount = fn ($satuanTotal, $bundlingPrice) => max(0, $satuanTotal - $bundlingPrice);

        $premium = [
            ['Akad + Wedding', 'photo', 'Akad + Wedding Foto', $discount(400000 + 450000, 800000)],
            ['Akad + Nyongkolan', 'photo', 'Akad + Nyongkolan Foto', $discount(400000 + 500000, 850000)],
            ['Akad + Wedding + Nyongkolan', 'photo', 'Akad + Wedding + Nyongkolan Foto', $discount(400000 + 450000 + 500000, 1200000)],
            ['Akad + Wedding', 'video', 'Akad + Wedding Video', $discount(500000 + 550000, 900000)],
            ['Akad + Nyongkolan', 'video', 'Akad + Nyongkolan Video', $discount(500000 + 600000, 950000)],
            ['Akad + Wedding + Nyongkolan', 'video', 'Akad + Wedding + Nyongkolan Video', $discount(500000 + 550000 + 600000, 1500000)],
        ];

        foreach ($premium as $i => [$comboName, $media, $label, $discountValue]) {
            $eventA = explode(' + ', $comboName);
            $items = [];
            $isTriple = count($eventA) === 3;

            $segments = $isTriple
                ? ['Akad', 'Wedding', 'Nyongkolan']
                : $eventA;

            foreach ($segments as $ev) {
                $svc = $s($ev, $media);
                if ($svc) {
                    $items[] = ['service' => $svc, 'qty' => 1];
                }
            }

            if (empty($items)) {
                continue;
            }

            Package::updateOrCreate(
                ['slug' => Str::slug($label)],
                [
                    'name' => $label,
                    'type' => 'bundling',
                    'price_mode' => 'auto',
                    'promo_type' => 'nominal',
                    'promo_value' => $discountValue,
                    'description' => "Paket premium dokumentasi {$comboName} (media " . ($media === 'photo' ? 'Foto' : 'Video') . '). Harga sudah termasuk pengerjaan dan pengiriman file.',
                    'display_order' => $i + 1,
                    'is_active' => true,
                ]
            )->services()->sync(collect($items)->mapWithKeys(fn ($it) => [$it['service']->id => ['qty' => $it['qty']]])->all());
        }

        // Paket ultimate (combo foto + video).
        $ultimate = [
            ['Akad', 900000, false],
            ['Wedding', 950000, true],
            ['Nyongkolan', 950000, false],
            ['Akad + Wedding', 1600000, false],
            ['Akad + Nyongkolan', 1700000, false],
            ['Akad + Wedding + Nyongkolan', 2700000, false],
            ['Ulang Tahun', 800000, false],
            ['Hunting', 500000, false],
            ['Wisuda', 750000, false],
        ];

        foreach ($ultimate as $i => [$comboName, $price, $isPopular]) {
            $single = !str_contains($comboName, ' + ');
            $segments = $single ? [$comboName] : explode(' + ', $comboName);
            if ($single && in_array($comboName, ['Ulang Tahun', 'Hunting', 'Wisuda'])) {
                // events satuan dengan nama khusus
            }

            $items = [];
            foreach ($segments as $ev) {
                foreach (['photo', 'video'] as $media) {
                    $svc = $s($ev, $media);
                    if ($svc) {
                        $items[] = ['service' => $svc, 'qty' => 1];
                    }
                }
            }

            $base = collect($items)->sum(fn ($it) => (float) $it['service']->price);

            Package::updateOrCreate(
                ['slug' => Str::slug('Combo ' . $comboName . ' Foto Video')],
                [
                    'name' => 'Combo ' . $comboName . ' (Foto + Video)',
                    'type' => 'combo',
                    'price_mode' => 'manual',
                    'manual_price' => $price,
                    'promo_type' => 'none',
                    'promo_value' => null,
                    'is_featured' => $isPopular,
                    'description' => "Paket ultimate foto + video {$comboName}. Harga sudah termasuk penggunaan drone untuk pengambilan gambar udara.",
                    'display_order' => 10 + $i,
                    'is_active' => true,
                ]
            )->services()->sync(collect($items)->mapWithKeys(fn ($it) => [$it['service']->id => ['qty' => $it['qty']]])->all());
        }

        $this->command->info('Paket: ' . Package::count() . ' paket (premium + ultimate) dari ' . Service::count() . ' layanan satuan.');
    }
}