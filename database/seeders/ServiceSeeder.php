<?php

namespace Database\Seeders;

use App\Models\Package;
use App\Models\Service;
use App\Models\ServiceCategory;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        ServiceCategory::query()->delete();
        Package::query()->delete();
        Service::query()->delete();

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
                'name' => $event,
                'event' => $event,
                'media' => strtolower($media),
                'duration' => $duration,
                'terms' => $terms,
                'price' => $price,
                'order' => $i + 1,
                'active' => true,
            ]);
        }

        $s = function ($event, $media) use ($services) {
            $mediaKey = strtolower($media) === 'foto' ? 'photo' : strtolower($media);

            return $services[sprintf('%s|%s', $event, $mediaKey)] ?? null;
        };

        $cats = [
            ['label' => 'Satuan', 'title' => 'Paket Satuan', 'type' => 'satuan', 'layout' => 'table', 'columns' => ['Layanan', 'Foto (Edit + Softfile)', 'Video (3-4 Menit)'], 'order' => 1],
            ['label' => 'Bundling', 'title' => 'Paket Bundling', 'type' => 'bundling', 'layout' => 'table', 'columns' => ['Paket', 'Harga'], 'order' => 2],
            ['label' => 'Combo', 'title' => 'Paket Combo Foto + Video', 'type' => 'combo', 'layout' => 'grid', 'columns' => [], 'order' => 3],
        ];
        foreach ($cats as $cat) {
            ServiceCategory::create($cat);
        }

        $packages = [
            [
                'name' => 'Wedding Premium',
                'type' => 'bundling',
                'promo_type' => 'nominal',
                'promo_value' => 50000,
                'is_popular' => true,
                'description' => 'Akad Foto + Wedding Foto dalam satu paket.',
                'items' => [['service' => $s('Akad', 'Foto'), 'qty' => 1], ['service' => $s('Wedding', 'Foto'), 'qty' => 1]],
            ],
            [
                'name' => 'Akad + Nyongkolan (Foto)',
                'type' => 'bundling',
                'promo_type' => 'none',
                'promo_value' => null,
                'description' => 'Dokumentasi foto Akad dan Nyongkolan.',
                'items' => [['service' => $s('Akad', 'Foto'), 'qty' => 1], ['service' => $s('Nyongkolan', 'Foto'), 'qty' => 1]],
            ],
            [
                'name' => 'Wedding Combo',
                'type' => 'combo',
                'promo_type' => 'nominal',
                'promo_value' => 50000,
                'is_featured' => true,
                'description' => 'Wedding Foto + Video dalam satu paket.',
                'items' => [['service' => $s('Wedding', 'Foto'), 'qty' => 1], ['service' => $s('Wedding', 'Video'), 'qty' => 1]],
            ],
            [
                'name' => 'Akad + Wedding + Nyongkolan Combo',
                'type' => 'combo',
                'promo_type' => 'nominal',
                'promo_value' => 400000,
                'description' => 'Paket lengkap Foto + Video untuk Akad, Wedding, dan Nyongkolan.',
                'items' => [
                    ['service' => $s('Akad', 'Foto'), 'qty' => 1], ['service' => $s('Akad', 'Video'), 'qty' => 1],
                    ['service' => $s('Wedding', 'Foto'), 'qty' => 1], ['service' => $s('Wedding', 'Video'), 'qty' => 1],
                    ['service' => $s('Nyongkolan', 'Foto'), 'qty' => 1], ['service' => $s('Nyongkolan', 'Video'), 'qty' => 1],
                ],
            ],
        ];

        foreach ($packages as $i => $p) {
            $items = $p['items'];
            unset($p['items']);
            $package = Package::create(['display_order' => $i + 1] + $p);
            foreach ($items as $it) {
                $package->services()->attach($it['service']->id, ['qty' => $it['qty']]);
            }
        }
    }
}