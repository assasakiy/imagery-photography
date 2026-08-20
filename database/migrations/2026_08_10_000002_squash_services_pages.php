<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('icon')->nullable();
            $table->decimal('price', 15, 2)->nullable();
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();
            $table->string('media')->default('photo');
            $table->string('event')->nullable();
            $table->string('duration')->nullable();
            $table->string('terms')->nullable();
            $table->boolean('active')->default(true);
        });

        Schema::create('packages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('type')->default('bundling');
            $table->string('price_mode')->default('auto');
            $table->string('promo_type')->default('none');
            $table->decimal('promo_value', 15, 2)->nullable();
            $table->decimal('manual_price', 15, 2)->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();
        });

        Schema::create('package_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('package_id');
            $table->unsignedBigInteger('service_id');
            $table->unsignedInteger('qty')->default(1);
            $table->timestamps();

            $table->unique(['package_id', 'service_id']);
            $table->foreign('package_id')->references('id')->on('packages')->onDelete('cascade');
            $table->foreign('service_id')->references('id')->on('services')->onDelete('cascade');
        });

        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('description', 500)->nullable();
            $table->string('hero_title')->nullable();
            $table->string('hero_subtitle')->nullable();
            $table->string('badge', 100)->nullable();
            $table->string('button_text', 100)->nullable();
            $table->string('button_link', 255)->nullable();
            $table->string('button2_text', 100)->nullable();
            $table->string('button2_link', 255)->nullable();
            $table->json('sections')->nullable();
            $table->json('images')->nullable();
            $table->longText('content');
            $table->boolean('published')->default(true);
            $table->timestamps();
        });

        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->unique();
            $table->string('full_name')->nullable();
            $table->string('avatar')->nullable();
            $table->string('cover')->nullable();
            $table->text('bio')->nullable();
            $table->string('company')->nullable();
            $table->string('occupation')->nullable();
            $table->string('website')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('gender')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::create('social_platforms', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('icon')->nullable();
            $table->string('color')->nullable();
            $table->string('base_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('user_socials', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('social_platform_id');
            $table->string('username')->nullable();
            $table->string('url')->nullable();
            $table->boolean('is_public')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('social_platform_id')->references('id')->on('social_platforms')->onDelete('cascade');
        });

        Schema::create('team_members', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('name');
            $table->string('position')->nullable();
            $table->text('bio')->nullable();
            $table->string('photo_url')->nullable();
            $table->string('social_facebook')->nullable();
            $table->string('social_instagram')->nullable();
            $table->string('social_tiktok')->nullable();
            $table->string('social_whatsapp')->nullable();
            $table->boolean('is_owner')->default(false);
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });

        Schema::create('bookmarks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->morphs('bookmarkable');
            $table->timestamps();

            $table->unique(['user_id', 'bookmarkable_type', 'bookmarkable_id'], 'bookmarks_unique');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::create('history_events', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('action');
            $table->string('target_type')->nullable();
            $table->unsignedBigInteger('target_id')->nullable();
            $table->json('meta')->nullable();
            $table->string('ip')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        $this->seedPages();
        $this->seedSettings();
    }

    private function seedPages(): void
    {
        $timestamp = now();

        $homeSections = json_encode([
            ['type' => 'hero', 'title' => 'Sopian Lalu Imagery', 'subtitle' => 'Mengabadikan momen berharga Anda menjadi warisan visual.', 'button_text' => 'Lihat Galeri', 'button_link' => '/gallery'],
            ['type' => 'about', 'subtitle' => 'Tentang Kami', 'title' => 'Tentang Kami', 'description' => '', 'content' => '', 'stats' => [['label' => 'Momen Terabadikan', 'value' => '500+'], ['label' => 'Hasil Profesional', 'value' => '100%'], ['label' => 'Siap Dibooking', 'value' => '24/7']], 'button_text' => 'Selengkapnya', 'button_link' => '/tentang'],
            ['type' => 'reviews', 'subtitle' => 'Testimonial', 'title' => 'Kata Klien Kami', 'mode' => '5star', 'limit' => 6],
            ['type' => 'blog', 'subtitle' => 'Blog', 'title' => 'Artikel Terbaru', 'limit' => 3],
            ['type' => 'cta', 'title' => 'Siap Dokumentasikan Momen?', 'description' => 'Hubungi kami untuk konsultasi gratis.', 'button_text' => 'Booking Sekarang', 'button_link' => '/booking'],
        ]);

        $aboutContent = 'Perkenalkan, saya adalah Lalu Sopian Hamdani, berfokus pada pekerjaan sebagai Photographer dan Videographer. Keahlian saya adalah mendokumentasikan momen dan narasi, baik melalui gambar diam maupun rekaman bergerak. Sebagai seorang fotografer, saya berupaya memastikan setiap frame memiliki komposisi dan pencahayaan yang tepat untuk mengabadikan cerita. Sementara dalam videografi, fokus saya adalah merangkai footage menjadi sebuah cerita yang kohesif dan mudah dipahami.';

        $aboutTimeline = json_encode([
            ['type' => 'timeline', 'data' => [
                ['year' => '2019', 'text' => 'Awal berkiprah di dunia fotografi dokumentasi.'],
                ['year' => '2021', 'text' => 'Berkembang ke layanan videografi dan videografer.'],
                ['year' => '2023', 'text' => 'Menjadi tim dengan layanan fotografi & videografi lengkap.'],
            ]],
            ['type' => 'history', 'text' => 'Perjalanan kami dimulai dari kecintaan pada cahaya dan cerita. Dari dokumentasi sederhana, kami tumbuh menjadi tim yang melayani berbagai momen spesial dengan standar profesional.'],
        ]);

        $blogSections = json_encode([
            'featured' => ['type' => 'featured', 'label' => 'Pilihan', 'title' => 'Artikel Unggulan', 'subtitle' => 'Pilihan Redaksi kami.', 'count' => 4, 'fallback' => 'services'],
            'latest' => ['type' => 'latest', 'label' => 'Terbaru', 'title' => 'Artikel Terbaru', 'subtitle' => 'Update terbaru dari kami.', 'count' => 6],
            'popular' => ['type' => 'popular', 'label' => 'Terpopuler', 'title' => 'Artikel Populer', 'subtitle' => 'Paling banyak dibaca.', 'count' => 6, 'fallback' => 'services'],
            'tags' => ['type' => 'tags', 'label' => 'Topik', 'title' => 'Topik Populer', 'count' => 12],
        ]);

        $gallerySections = json_encode([
            'featured' => ['type' => 'featured', 'label' => 'Karya', 'title' => 'Karya Unggulan', 'subtitle' => 'Pilihan kami.', 'count' => 6, 'fallback' => 'services'],
            'latest' => ['type' => 'latest', 'label' => 'Galeri', 'title' => 'Galeri Lengkap', 'count' => 9],
            'tags' => ['type' => 'tags', 'label' => 'Kategori', 'title' => 'Kategori', 'count' => 6],
        ]);

        $pages = [
            [
                'slug' => 'home',
                'title' => 'Beranda',
                'description' => 'Sopian Lalu Imagery - Photography & Videography profesional. Mengabadikan momen berharga Anda di Lombok.',
                'hero_title' => 'Sopian Lalu Imagery',
                'hero_subtitle' => 'Mengabadikan momen berharga Anda menjadi warisan visual.',
                'badge' => 'Photography & Videography',
                'button_text' => 'Lihat Galeri',
                'button_link' => '/gallery',
                'button2_text' => 'Lihat Layanan',
                'button2_link' => '/services',
                'content' => '',
                'sections' => $homeSections,
                'images' => json_encode([
                    'hero_image' => 'https://sopianlaluimagery.wordpress.com/wp-content/uploads/2025/11/desain-tanpa-judul-1.png',
                    'about_image' => 'https://sopianlaluimagery.wordpress.com/wp-content/uploads/2026/07/wp-1783272926403.jpg',
                ]),
            ],
            [
                'slug' => 'tentang',
                'title' => 'Tentang Kami',
                'description' => 'Sopian Lalu Imagery - Photography & Videography profesional. Mengabadikan momen berharga Anda di Lombok.',
                'hero_title' => null,
                'hero_subtitle' => null,
                'content' => $aboutContent,
                'sections' => $aboutTimeline,
                'images' => null,
            ],
            [
                'slug' => 'services',
                'title' => 'Layanan',
                'description' => 'Kami menyediakan berbagai paket dokumentasi mulai dari satuan hingga bundling lengkap (Foto + Video) yang bisa Anda sesuaikan dengan momen spesial Anda.',
                'hero_title' => null,
                'hero_subtitle' => null,
                'content' => '',
                'sections' => null,
                'images' => null,
            ],
            [
                'slug' => 'contact',
                'title' => 'Kontak',
                'description' => null,
                'hero_title' => null,
                'hero_subtitle' => null,
                'content' => '',
                'sections' => null,
                'images' => null,
            ],
            [
                'slug' => 'faq-page',
                'title' => 'FAQ',
                'description' => null,
                'hero_title' => null,
                'hero_subtitle' => null,
                'content' => '',
                'sections' => null,
                'images' => null,
            ],
            [
                'slug' => 'booking',
                'title' => 'Booking',
                'description' => null,
                'hero_title' => null,
                'hero_subtitle' => null,
                'content' => '',
                'sections' => null,
                'images' => null,
            ],
            [
                'slug' => 'gallery',
                'title' => 'Karya Kami',
                'description' => 'Dari still image yang membekukan waktu hingga video yang menceritakan kisah utuh, temukan karya visual yang pernah kami ciptakan. Pilih kategori untuk menjelajahi lebih lanjut.',
                'hero_title' => null,
                'hero_subtitle' => null,
                'content' => '',
                'sections' => $gallerySections,
                'images' => json_encode([]),
            ],
            [
                'slug' => 'blog',
                'title' => 'Blog',
                'description' => 'Cerita di balik setiap frame, tips dokumentasi, dan pengalaman kami di balik kamera.',
                'hero_title' => null,
                'hero_subtitle' => null,
                'content' => '',
                'sections' => $blogSections,
                'images' => json_encode([]),
            ],
        ];

        $privacyContent = '<p>Sopian Lalu Imagery menghargai privasi Anda. Halaman ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda saat menggunakan situs ini.</p>

<h2>Data yang Kami Kumpulkan</h2>
<p>Kami mengumpulkan informasi yang Anda berikan secara langsung, seperti nama, nomor WhatsApp, alamat email, dan detail acara saat Anda mengisi formulir kontak, melakukan booking, atau berkomunikasi dengan kami.</p>

<h2>Penggunaan Data</h2>
<p>Data yang kami kumpulkan digunakan untuk: merespons pertanyaan dan permintaan Anda, memproses pemesanan dokumentasi, mengelola proyek dan komunikasi klien, serta meningkatkan kualitas layanan kami.</p>

<h2>Perlindungan Data</h2>
<p>Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi data Anda dari akses yang tidak sah, perubahan, atau pengungkapan yang tidak sah.</p>

<h2>Hak Anda</h2>
<p>Anda berhak untuk meminta akses, koreksi, atau penghapusan data pribadi Anda. Silakan hubungi kami melalui halaman kontak untuk menggunakan hak tersebut.</p>

<h2>Perubahan Kebijakan</h2>
<p>Kami dapat memperbarui kebijakan privasi ini sewaktu-waktu. Perubahan akan diumumkan melalui halaman ini.</p>';

        $termsContent = '<p>Dengan menggunakan situs web dan layanan Sopian Lalu Imagery, Anda dianggap telah menyetujui syarat dan ketentuan berikut.</p>

<h2>Layanan Dokumentasi</h2>
<p>Seluruh layanan fotografi dan videografi tunduk pada kesepakatan yang dibuat antara klien dan Sopian Lalu Imagery, termasuk jadwal acara, durasi, paket, dan harga yang disepakati.</p>

<h2>Pembayaran</h2>
<p>Pembayaran dapat dilakukan melalui metode yang disepakati. Pembatalan layanan tunduk pada ketentuan yang diatur dalam kontrak masing-masing proyek.</p>

<h2>Hak Cipta</h2>
<p>Seluruh hasil karya (foto dan video) milik Sopian Lalu Imagery dan tidak boleh digunakan untuk kepentingan komersial tanpa izin tertulis. Klien berhak menggunakan hasil karya untuk keperluan pribadi.</p>

<h2>Penggunaan Konten Situs</h2>
<p>Konten di situs ini, termasuk teks, gambar, dan desain, dilindungi hak cipta dan tidak boleh disalin tanpa izin.</p>

<h2>Batasan Tanggung Jawab</h2>
<p>Sopian Lalu Imagery tidak bertanggung jawab atas kerugian yang timbul dari penggunaan situs ini di luar kendali kami.</p>';

        $pages = array_merge($pages, [
            [
                'slug' => 'privacy',
                'title' => 'Kebijakan Privasi',
                'description' => null,
                'hero_title' => null,
                'hero_subtitle' => null,
                'content' => $privacyContent,
                'sections' => null,
                'images' => null,
            ],
            [
                'slug' => 'terms',
                'title' => 'Syarat dan Ketentuan',
                'description' => null,
                'hero_title' => null,
                'hero_subtitle' => null,
                'content' => $termsContent,
                'sections' => null,
                'images' => null,
            ],
        ]);

        foreach ($pages as $page) {
            DB::table('pages')->insertOrIgnore($page + [
                'published' => true,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);
        }
    }

    private function seedSettings(): void
    {
        $settings = [
            'site_name' => 'Sopian Lalu Imagery',
            'site_tagline' => 'Photography & Videography',
            'site_description' => 'Mengabadikan momen berharga Anda menjadi warisan visual yang dikenang selamanya.',
            'site_logo' => '',
            'site_favicon' => '',
            'timezone' => 'Asia/Makassar',
            'contact_address' => 'Dasan Montong, Desa Sintung, Kec. Pringgarata, Lombok Tengah',
            'contact_phone' => '087764426909',
            'contact_email' => 'sopianlaluphotography@gmail.com',
            'social_facebook' => 'https://www.facebook.com/share/17UoFUX8gq/',
            'social_instagram' => 'https://www.instagram.com/sopianlaluphotography',
            'social_tiktok' => 'https://www.tiktok.com/@sopianlaluphotography',
            'social_whatsapp' => 'https://wa.me/6287764426909',
        ];

        foreach ($settings as $key => $value) {
            DB::table('settings')->updateOrInsert(
                ['key' => $key],
                ['value' => $value, 'created_at' => now(), 'updated_at' => now()]
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('history_events');
        Schema::dropIfExists('bookmarks');
        Schema::dropIfExists('team_members');
        Schema::dropIfExists('user_socials');
        Schema::dropIfExists('social_platforms');
        Schema::dropIfExists('user_profiles');
        Schema::dropIfExists('pages');
        Schema::dropIfExists('package_items');
        Schema::dropIfExists('packages');
        Schema::dropIfExists('service_categories');
        Schema::dropIfExists('services');
    }
};