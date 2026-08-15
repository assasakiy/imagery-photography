<?php

namespace Database\Seeders;

use App\Models\Blog;
use App\Models\BlogTag;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BlogSeeder extends Seeder
{
    private const WP = 'https://sopianlaluimagery.wordpress.com/wp-content/uploads/2026/05/';

    public function run(): void
    {
        $author = User::where('username', 'owner')->firstOrFail();

        $categories = [
            ['name' => 'Tips & Tutorial', 'description' => 'Panduan praktis fotografi dan videografi.'],
            ['name' => 'Pernikahan', 'description' => 'Kisah dan persiapan dokumentasi pernikahan.'],
            ['name' => 'Videografi', 'description' => 'Dunia videografi dan sinematografi.'],
            ['name' => 'Di Balik Layar', 'description' => 'Cerita proses di balik setiap sesi pemotretan.'],
        ];

        $categoryIds = [];
        foreach ($categories as $cat) {
            $category = Category::where('name', $cat['name'])->first();
            if (! $category) {
                $category = Category::create([
                    'name' => $cat['name'],
                    'slug' => Category::uniqueSlug($cat['name']),
                    'description' => $cat['description'],
                ]);
            }
            $categoryIds[Str::slug($cat['name'])] = $category->id;
        }

        $tagNames = [
            'fotografi', 'videografi', 'pernikahan', 'akad', 'nyongkolan',
            'wedding', 'wisuda', 'drone', 'tips', 'prewedding',
        ];
        $tagIds = BlogTag::findOrCreateByNames($tagNames);
        $tagIdByName = array_combine($tagNames, $tagIds);

        $articles = [
            [
                'title' => 'Cara Memilih Paket Dokumentasi Pernikahan yang Tepat',
                'category' => 'pernikahan',
                'tags' => ['pernikahan', 'wedding', 'akad'],
                'excerpt' => 'Foto saja, video saja, atau keduanya? Simak panduan memilih paket dokumentasi pernikahan agar sesuai kebutuhan dan anggaran Anda.',
                'content' => '<p>Memilih paket dokumentasi pernikahan sering kali membingungkan. Foto dan video keduanya berharga, tetapi tidak semua pasangan membutuhkan keduanya sekaligus.</p><p>Jika Anda mengutamakan momen sakral seperti akad dan seserahan, paket foto dengan soft file sudah cukup untuk mengabadikan detail-detail penting. Namun, untuk merasakan kembali suasana, suara, dan gerakan, video adalah pilihan yang lebih hidup.</p><p>Mulailah dengan menyusun prioritas: momen apa yang paling ingin dikenang? Setelah itu sesuaikan dengan anggaran dan durasi acara.</p>',
                'image' => 'dsc00048_1.jpg',
                'views' => 348,
                'featured' => true,
                'published_at' => now(),
            ],
            [
                'title' => 'Akad Nikah: Momen Sakral yang Wajib Diabadikan',
                'category' => 'pernikahan',
                'tags' => ['pernikahan', 'akad'],
                'excerpt' => 'Akad adalah momen paling sakral dalam pernikahan. Inilah alasan kenapa ia selalu menjadi bagian utama dari setiap paket dokumentasi.',
                'content' => '<p>Akad nikah hanya berlangsung beberapa menit, tetapi dampaknya menjadi fondasi kehidupan baru bagi sepasang pengantin. Tidak heran jika momen ini selalu menjadi prioritas utama dokumentasi.</p><p>Ekspresi kedua mempelai, air mata orang tua, hingga denting cincin di jemari adalah detail yang hanya bisa diabadikan oleh lensa yang siap dan berada di posisi tepat.</p><p>Pastikan fotografer Anda memahami alur akad, mulai dari kedatangan mempelai pria, ijab kabul, hingga prosesi tanda tangan. Kepekaan terhadap waktu dan emosi adalah segalanya di momen ini.</p>',
                'image' => 'dsc04026.jpg',
                'views' => 512,
                'featured' => true,
                'published_at' => now()->subDays(1),
            ],
            [
                'title' => 'Mengenal Tradisi Nyongkolan Lombok dalam Bingkai Kamera',
                'category' => 'pernikahan',
                'tags' => ['pernikahan', 'nyongkolan'],
                'excerpt' => 'Arak-arakan nyongkolan adalah warisan budaya Lombok yang penuh warna. Inilah cara mengabadikannya secara maksimal.',
                'content' => '<p>Nyongkolan adalah prosesi arak-arakan mempelai yang menjadi ciri khas suku Sasak di Lombok. Ribuan tamu dengan pakaian tradisional serta kemeriahan musik gendang menjadikannya momen yang spektakuler untuk didokumentasikan.</p><p>Sebagai fotografer, posisi terbaik adalah di titik awal arak-arakan untuk mengabadikan keberangkatan, lalu berpindah untuk mengunci detail ornamen dan ekspresi penari gandrung.</p><p>Jangan lupa memanfaatkan ketinggian — baik tangga maupun drone — untuk menangkap skala besar barisan nyongkolan dari sudut yang dramatis.</p>',
                'image' => 'img_8225.jpg',
                'views' => 421,
                'featured' => false,
                'published_at' => now()->subDays(3),
            ],
            [
                'title' => 'Tips Berpose Natural di Depan Kamera untuk Pasangan',
                'category' => 'tips-tutorial',
                'tags' => ['fotografi', 'tips', 'prewedding'],
                'excerpt' => 'Tidak perlu menjadi model untuk tampil memukau. Berikut tips berpose natural yang dipakai fotografer profesional.',
                'content' => '<p>Banyak pasangan merasa kaku saat menghadap kamera. Padahal, hasil foto yang indah justru datang dari bahasa tubuh yang rileks dan alami.</p><p>Alih-alih memikirkan pose, fokuslah pada pasangan Anda — saling menatap, tertawa kecil, dan berjalan sambil bercerita. Fotografer hanya akan membimbing arah dan pencahayaan.</p><p>Kenakan pakaian yang nyaman dan telah dicoba sebelumnya. Rasa nyaman akan terpancar dari postur tubuh dan membuat hasil jepretan terasa lebih hidup.</p>',
                'image' => 'dsc00641.jpg',
                'views' => 287,
                'featured' => false,
                'published_at' => now()->subDays(5),
            ],
            [
                'title' => 'Golden Hour: Waktu Terbaik untuk Foto Outdoor',
                'category' => 'tips-tutorial',
                'tags' => ['fotografi', 'tips'],
                'excerpt' => 'Dua jam setelah matahari terbit dan sebelum terbenam adalah saat cahaya paling lembut. Manfaatkan golden hour untuk hasil maksimal.',
                'content' => '<p>Golden hour merujuk pada periode sesaat setelah matahari terbit dan menjelang matahari terbenam. Cahaya pada waktu ini berwarna hangat, lembut, dan menghasilkan bayangan yang panjang serta dramatis.</p><p>Untuk sesi di luar ruangan, jadwalkan pemotretan pada rentang tersebut. Hasilnya, kulit tampak lebih merata dan latar langit berubah menjadi gradasi keemasan yang sulit ditiru filter.</p><p>Namun, cahaya bergerak cepat. Siapkan konsep, lokasi, dan pencahayaan tambahan sebelum golden hour dimulai agar waktu yang singkat tidak terbuang percuma.</p>',
                'image' => 'img_4924.jpg',
                'views' => 198,
                'featured' => false,
                'published_at' => now()->subDays(7),
            ],
            [
                'title' => 'Foto vs Video: Mana yang Tepat untuk Acara Anda?',
                'category' => 'videografi',
                'tags' => ['videografi', 'fotografi'],
                'excerpt' => 'Keduanya sama berharga, tetapi masing-masing punya keunggulan. Pahami perbedaan mendasar sebelum memesan paket dokumentasi.',
                'content' => '<p>Foto membekukan satu momen dalam sepersekian detik dan memungkinkan detail direnungkan berulang kali. Video, di sisi lain, merangkai waktu: suara, gerak, dan suasana disatukan menjadi cerita utuh.</p><p>Untuk acara dengan banyak prosesi ritual, seperti akad dan nyongkolan, kombinasi keduanya adalah pilihan ideal. Foto menangkap detail dokumentasi, sementara video mengabadikan rangkaian dan suasananya.</p><p>Pertimbangkan juga bagaimana Anda akan menyimpannya. Foto mudah dicetak dan dipajang; video sempurna untuk dikenang kembali beberapa tahun kemudian.</p>',
                'image' => 'img_9810.jpg',
                'views' => 256,
                'featured' => false,
                'published_at' => now()->subDays(9),
            ],
            [
                'title' => 'Persiapan Visual untuk Sesi Wisuda yang Berkesan',
                'category' => 'tips-tutorial',
                'tags' => ['wisuda', 'tips', 'fotografi'],
                'excerpt' => 'Wisuda adalah puncak perjuangan panjang. Berikut panduan persiapan agar foto wisuda Anda tampil maksimal.',
                'content' => '<p>Wisuda adalah salah satu momen paling membanggakan yang layak diabadikan dalam kualitas terbaik. Tata rias sebaiknya dibuat sedikit lebih tegas dari sehari-hari agar tetap terlihat sempurna di kamera.</p><p>Tentukan lokasi syuting yang mewakili perjalanan Anda: kampus, perpustakaan, atau tempat favorit di bangku kuliah. Golden hour tetap menjadi pilihan waktu yang paling aman.</p><p>Terakhir, siapkan pose yang mengekspresikan kegembiraan. Angkat toga, lempar, atau tertawa lebar — semua itu adalah perayaan atas kerja keras bertahun-tahun.</p>',
                'image' => 'img_9567.jpg',
                'views' => 174,
                'featured' => false,
                'published_at' => now()->subDays(12),
            ],
            [
                'title' => 'Mengabadikan Momen Ulang Tahun Anak dengan Kreatif',
                'category' => 'di-balik-layar',
                'tags' => ['tips', 'fotografi'],
                'excerpt' => 'Anak adalah subjek paling jujur di depan kamera. Inilah kiat mengabadikan ulang tahun si kecil tanpa paksaan.',
                'content' => '<p>Anak-anak tidak bisa dipaksa berpose. Kuncinya adalah membiarkan mereka menjadi diri sendiri dan bersiap menangkap momen secara spontan.</p><p>Fokuslah pada aktivitas: meniup lilin, membuka kado, bermain bersama saudara. Ekspresi tulus yang melintas sesaat justru menjadi foto paling berharga.</p><p>Gunakan kamera dengan kecepatan rana tinggi dan mode burst untuk memastikan momen tak terduga tidak terlewat. Dekorasi yang rapi juga akan mempercantik latar tangkapan Anda.</p>',
                'image' => 'img_9589.jpg',
                'views' => 143,
                'featured' => false,
                'published_at' => now()->subDays(15),
            ],
            [
                'title' => 'Drone dalam Dokumentasi: Perspektif Baru dari Udara',
                'category' => 'videografi',
                'tags' => ['videografi', 'drone'],
                'excerpt' => 'Pengambilan gambar udara mengubah cara kita bercerita. Tantangan dan keunggulan memakai drone dalam dokumentasi.',
                'content' => '<p>Drone membuka kemungkinan sudut pandang yang mustahil dijangkau kamera di darat. Dalam layanan kami, penggunaan drone sudah termasuk dalam setiap paket video.</p><p>Untuk pesta megah atau nyongkolan yang panjang, sudut udara memberikan konteks: betapa besar acara, betapa ramai para tamu, dan betapa indah lokasinya.</p><p>Namun, penggunaan drone menuntut keahlian. Manuver harus stabil, dan penerbangan harus mematuhi regulasi serta keselamatan orang di sekitar. Kehati-hatian inilah yang membuat hasil akhir tetap mulus.</p>',
                'image' => 'img_9762.jpg',
                'views' => 332,
                'featured' => false,
                'published_at' => now()->subDays(18),
            ],
            [
                'title' => 'Dari Fotografer ke Fotografer: Membangun Portofolio yang Menjual',
                'category' => 'di-balik-layar',
                'tags' => ['fotografi', 'tips'],
                'excerpt' => 'Portofolio adalah kartu nama seorang fotografer. Pelajaran membangun galeri karya yang dipercaya calon klien.',
                'content' => '<p>Sebagai fotografer, portofolio adalah segalanya. Calon klien tidak melihat ijazah, mereka melihat karya. Kualitas dan keragaman portofolio menentukan kepercayaan.</p><p>Pilih karya yang mencerminkan gaya kerja Anda dan tampilkan berbagai jenis momen: akad, wedding, nyongkolan, wisuda, hingga acara komersial. Konsistensi lebih penting daripada kuantitas.</p><p>Terakhir, biarkan karya berbicara tanpa terlalu banyak teks. Sertakan lokasi dan tema acara singkat — informasi tersebut justru membantu klien membayangkan kerja sama bersama Anda.</p>',
                'image' => 'img_2523.jpg',
                'views' => 209,
                'featured' => true,
                'published_at' => now()->subDays(21),
            ],
        ];

        $i = 0;
        foreach ($articles as $a) {
            $i++;
            $blog = Blog::updateOrCreate(
                ['slug' => Str::slug($a['title'])],
                [
                    'author_id' => $author->id,
                    'title' => $a['title'],
                    'excerpt' => $a['excerpt'],
                    'content' => $a['content'],
                    'status' => 'published',
                    'published_at' => $a['published_at'],
                    'views_count' => $a['views'],
                    'is_featured' => $a['featured'],
                ]
            );

            $blog->categories()->sync([$categoryIds[$a['category']]]);

            $this->importCover($blog, self::WP . $a['image']);

            $blog->tags()->sync(collect($a['tags'])
                ->map(fn ($t) => $tagIdByName[$t])->all());
        }

        $this->command->info('Seeded: ' . $i . ' blog articles.');
    }

    private function importCover(Blog $blog, string $url): void
    {
        if ($blog->coverMedia()) {
            return;
        }

        try {
            $blog->addMediaFromUrl($url)
                ->toMediaCollection('cover');
        } catch (\Throwable $e) {
            $blog->update(['image_url' => $url]);
            $this->command->warn('Gagal impor media: ' . $url . ' (' . $e->getMessage() . ')');

            return;
        }

        $blog->update(['image_url' => null]);
    }
}