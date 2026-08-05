<?php

namespace Database\Seeders;

use App\Models\BlogCategory;
use App\Models\Faq;
use App\Models\Page;
use Illuminate\Database\Seeder;

class StaticContentSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedPages();
        $this->seedFaqs();
        $this->seedBlogCategories();
    }

    private function seedPages(): void
    {
        $pages = [
            'privacy' => [
                'title' => 'Kebijakan Privasi',
                'content' => <<<'HTML'
<p>Sopian Lalu Imagery menghargai privasi Anda. Halaman ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda saat menggunakan situs ini.</p>

<h2>Data yang Kami Kumpulkan</h2>
<p>Kami mengumpulkan informasi yang Anda berikan secara langsung, seperti nama, nomor WhatsApp, alamat email, dan detail acara saat Anda mengisi formulir kontak, melakukan booking, atau berkomunikasi dengan kami.</p>

<h2>Penggunaan Data</h2>
<p>Data yang kami kumpulkan digunakan untuk: merespons pertanyaan dan permintaan Anda, memproses pemesanan dokumentasi, mengelola proyek dan komunikasi klien, serta meningkatkan kualitas layanan kami.</p>

<h2>Perlindungan Data</h2>
<p>Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi data Anda dari akses yang tidak sah, perubahan, atau pengungkapan yang tidak sah.</p>

<h2>Hak Anda</h2>
<p>Anda berhak untuk meminta akses, koreksi, atau penghapusan data pribadi Anda. Silakan hubungi kami melalui halaman kontak untuk menggunakan hak tersebut.</p>

<h2>Perubahan Kebijakan</h2>
<p>Kami dapat memperbarui kebijakan privasi ini sewaktu-waktu. Perubahan akan diumumkan melalui halaman ini.</p>
HTML,
            ],
            'terms' => [
                'title' => 'Syarat dan Ketentuan',
                'content' => <<<'HTML'
<p>Dengan menggunakan situs web dan layanan Sopian Lalu Imagery, Anda dianggap telah menyetujui syarat dan ketentuan berikut.</p>

<h2>Layanan Dokumentasi</h2>
<p>Seluruh layanan fotografi dan videografi tunduk pada kesepakatan yang dibuat antara klien dan Sopian Lalu Imagery, termasuk jadwal acara, durasi, paket, dan harga yang disepakati.</p>

<h2>Pembayaran</h2>
<p>Pembayaran dapat dilakukan melalui metode yang disepakati. Pembatalan layanan tunduk pada ketentuan yang diatur dalam kontrak masing-masing proyek.</p>

<h2>Hak Cipta</h2>
<p>Seluruh hasil karya (foto dan video) milik Sopian Lalu Imagery dan tidak boleh digunakan untuk kepentingan komersial tanpa izin tertulis. Klien berhak menggunakan hasil karya untuk keperluan pribadi.</p>

<h2>Penggunaan Konten Situs</h2>
<p>Konten di situs ini, termasuk teks, gambar, dan desain, dilindungi hak cipta dan tidak boleh disalin tanpa izin.</p>

<h2>Batasan Tanggung Jawab</h2>
<p>Sopian Lalu Imagery tidak bertanggung jawab atas kerugian yang timbul dari penggunaan situs ini di luar kendali kami.</p>
HTML,
            ],
        ];

        foreach ($pages as $slug => $data) {
            Page::updateOrCreate(
                ['slug' => $slug],
                ['title' => $data['title'], 'content' => $data['content'], 'published' => true]
            );
        }
    }

    private function seedFaqs(): void
    {
        $faqs = [
            ['Bagaimana cara memesan jasa fotografi/videografi?', 'Anda dapat mengisi formulir booking di halaman Booking atau menghubungi kami melalui WhatsApp. Kami akan membalas untuk mendiskusikan kebutuhan dan paket yang sesuai.'],
            ['Paket apa saja yang tersedia?', 'Kami menyediakan paket satuan (foto atau video saja) hingga paket bundling lengkap (foto + video) untuk akad, wedding, nyongkolan, dan berbagai acara lainnya.'],
            ['Berapa lama hasil foto/video selesai?', 'Waktu pengerjaan bervariasi tergantung paket. Biasanya foto preview dikirim dalam 1-2 hari, sedangkan hasil lengkap mengikuti kesepakatan kontrak.'],
            ['Apakah tersedia transportasi ke luar area?', 'Untuk lokasi di luar Lombok Tengah, tersedia penyesuaian biaya transportasi. Silakan diskusikan detail lokasi dengan kami.'],
            ['Bagaimana klien mengakses hasil dokumentasi?', 'Setiap proyek memiliki link akses yang dikirim melalui WhatsApp. Melalui link tersebut klien dapat melihat progres, mengunduh file, dan melakukan pembayaran.'],
        ];

        foreach ($faqs as $i => [$question, $answer]) {
            Faq::updateOrCreate(
                ['question' => $question],
                ['answer' => $answer, 'order' => $i + 1, 'published' => true]
            );
        }
    }

    private function seedBlogCategories(): void
    {
        $categories = [
            ['Tips Fotografi', 'Kumpulan tips seputar fotografi dan videografi.'],
            ['Cerita di Balik Lensa', 'Kisah dan pengalaman di balik setiap sesi pemotretan.'],
            ['Behind the Scene', 'Proses di balik layar produksi foto dan video.'],
        ];

        foreach ($categories as $i => [$name, $desc]) {
            BlogCategory::updateOrCreate(
                ['name' => $name],
                ['slug' => BlogCategory::uniqueSlug($name), 'description' => $desc]
            );
        }
    }
}
