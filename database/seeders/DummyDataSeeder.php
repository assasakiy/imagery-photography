<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Package;
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
        $this->seedCategoriesAndPortfolios();
        $this->seedPackages();
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
                    'is_popular' => $comboName === 'Akad + Wedding',
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
                    'is_popular' => $isPopular,
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