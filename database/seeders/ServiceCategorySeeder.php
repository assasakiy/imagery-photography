<?php

namespace Database\Seeders;

use App\Models\ServiceCategory;
use Illuminate\Database\Seeder;

class ServiceCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'label' => 'I. Satuan',
                'title' => 'Paket Stand-Alone',
                'description' => 'Layanan satuan, bisa dipilih Foto atau Video saja.',
                'layout' => 'table',
                'columns' => ['Layanan', 'Foto (Edit + Soft File)', 'Video (3-4 Menit)'],
                'items' => [
                    ['Akad', '400k', '500k'],
                    ['Wedding', '450k', '550k'],
                    ['Nyongkolan', '500k', '600k'],
                    ['Ulang Tahun', '350k', '450k'],
                    ['Hunting', '300k / 3 jam', '300k / 1-2 menit'],
                    ['Wisuda', '450k / 1 jam', '450k / 1-2 menit'],
                ],
            ],
            [
                'label' => 'II. Premium',
                'title' => 'Paket Single Medium',
                'description' => 'Bundling satu medium untuk rangkaian acara.',
                'layout' => 'table',
                'columns' => ['Paket', 'Foto (Bundling)', 'Video (Bundling)'],
                'items' => [
                    ['Akad + Wedding', '800k', '900k'],
                    ['Akad + Nyongkolan', '850k', '950k'],
                    ['Akad + Wedding + Nyongkolan', '1.200k', '1.500k'],
                ],
            ],
            [
                'label' => 'III. Ultimate',
                'title' => 'Paket Combo Foto + Video',
                'description' => '',
                'layout' => 'grid',
                'columns' => [],
                'items' => [
                    ['Akad', '900k'],
                    ['Wedding', '950k'],
                    ['Nyongkolan', '950k'],
                    ['Akad + Wedding', '1.600k'],
                    ['Akad + Nyongkolan', '1.700k'],
                    ['Akad + Wedding + Nyongkolan', '2.700k'],
                ],
            ],
        ];

        foreach ($categories as $i => $cat) {
            $items = $cat['items'];
            unset($cat['items']);

            $category = ServiceCategory::firstOrCreate(
                ['title' => $cat['title']],
                ['order' => $i + 1] + $cat
            );

            $category->items()->delete();
            foreach (array_values($items) as $j => $row) {
                $category->items()->create([
                    'name' => $row[0],
                    'values' => array_slice($row, 1),
                    'order' => $j,
                ]);
            }
        }
    }
}
