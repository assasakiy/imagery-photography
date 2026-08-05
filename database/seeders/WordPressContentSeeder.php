<?php

namespace Database\Seeders;

use App\Models\LandingContent;
use App\Models\Portfolio;
use Illuminate\Database\Seeder;

class WordPressContentSeeder extends Seeder
{
    /**
     * Portfolio image URLs harvested from the WordPress portfolio page.
     */
    private const WORDPRESS_BASE = 'https://sopianlaluimagery.wordpress.com/wp-content/uploads/2026/05/';

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

    public function run(): void
    {
        $intro = 'Sebagian dari kumpulan karya yang merefleksikan dedikasi dalam mengabadikan setiap momen dengan detail, kualitas, dan jiwa.';

        foreach (self::IMAGES as $index => $filename) {
            $number = str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT);

            Portfolio::updateOrCreate(
                ['slug' => 'portofolio-' . $number],
                [
                    'title' => 'Portofolio ' . $number,
                    'description' => $intro,
                    'category' => 'Wedding & Event',
                    'image_url' => self::WORDPRESS_BASE . $filename,
                    'is_featured' => $index < 6,
                    'order' => $index + 1,
                ]
            );
        }

        $galleryIntro = 'Dari Still Image yang membekukan waktu hingga Video yang menceritakan kisah utuh, ini adalah tempat di mana saya merangkai cahaya dan emosi menjadi warisan visual.';

        LandingContent::setValue('gallery_intro', $galleryIntro, 'gallery');

        $this->command->info('Seeded: ' . count(self::IMAGES) . ' portfolio items from WordPress.');
    }
}
