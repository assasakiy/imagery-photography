# Imagery Photography

Website **Imagery Photography** — jasa *photography & videography* profesional. Mengabadikan momen pernikahan, prewedding, hingga acara Anda.

Repo ini berisi monolith Laravel dengan dua sisi:

- **Situs publik** (Blade SSR, SEO-friendly): Beranda, Galeri, Layanan, Tentang, Blog (kategori & tag), Kontak, Booking, FAQ, Kebijakan Privasi & Term.
- **Dashboard admin / portal klien** (React SPA): kelola portofolio, media, layanan, klien, proyek, pembayaran, pesan, review, blog, FAQ, halaman, tim, pengaturan landing, notifikasi, dan audit log.

## Tech Stack

- **Laravel 13** (PHP 8.3) — backend & API
- **React + Vite + Tailwind CSS v4** — admin SPA
- **MySQL** — database
- **Spatie Permission & Media Library** — role/permission & manajemen file
- **TipTap** — rich text editor blog
- **WhatsApp OTP login** + login Google (opsional)
- **Cloudflare (cloudflared)** + **Nginx** — deployment saat ini

## Fitur Utama

- Multi-role: **Owner**, **Admin**, **Klien**
- Portofolio & galeri karya, layanan (paket fotografi)
- Blog lengkap: Full-page Tiptap editor dengan integrasi media, auto-generate Excerpt/SEO, penjadwalan terbit, dan taksonomi (Kategori & Tag)
- Form Kontak & Booking → masuk sebagai **Pesan** dan **Notifikasi** (dengan filter kategori: Pesan / Booking / Review / Sistem)
- Pesan (Universal Chat): Komunikasi interaktif *real-time* dua arah antara Admin dan Klien dengan format *bubble chat*, emoji, attachment file, & fitur *reply* (balas). Terintegrasi dengan metadata referensi pesanan/proyek.
- Notifikasi in-app: unread badge, tandai dibaca, lihat semua, hapus semua, link langsung ke item terkait
- Proyek klien + unggah file (termasuk fitur Arsip untuk meminta ulang file yang kadaluwarsa)
- Modul Pembayaran Lengkap: Transfer manual (bank, dompet digital), pembuatan & validasi QRIS Statis menjadi **QRIS Dinamis** via *raw string* EMVCo, serta integrasi **Payment Gateway (TriPay)** yang dikendalikan melalui UI fleksibel.
- Review & rating otomatis (publish saat >3 bintang) dengan revisi.
- Media library (upload, picker, reuse)
- Audit log & riwayat login, deteksi login mencurigakan
- Landing page & pengaturan situs via UI
- Mode pemeliharaan (`maintenance`)

## Persyaratan

- PHP ^8.3 (ekstensi: `pdo_mysql`, `gd`, `fileinfo`, `intl`, `bcmath`, `ctype`, `curl`, `mbstring`, `openssl`, `xml`, `zip`)
- Composer 2
- Node.js 20+ & npm
- MySQL 8+

## Setup Lokal

```bash
# 1. Clone
git clone git@github.com:assasakiy/imagery-photography.git
cd imagery-photography

# 2. Dependensi
composer install
npm install

# 3. Konfigurasi
cp .env.example .env
php artisan key:generate
# isi kredensial DB di .env lalu:

# 4. Database
php artisan migrate --seed

# 5. Storage link (untuk file upload)
php artisan storage:link

# 6. Jalankan
npm run build        # build aset produksi
php artisan serve    # atau php -S localhost:8000 -t public
```

Untuk pengembangan:

```bash
npm run dev
php artisan serve
```

## Role & Akses

| Role | Akses |
|------|-------|
| Owner | Semua fitur + Tim & Admin, Landing, Pengaturan |
| Admin | Kelola konten & operasional (tanpa pengaturan sistem) |
| Klien | Portal proyek, status pembayaran, submit review |

Akses utama didefinisikan lewat **Spatie Permission** (lihat `database/seeders`).

## Struktur Singkat

```
app/
  Http/Controllers/       # Web (Blade) + Api (dashboard)
  Services/               # NotificationService, AuditLogger, LoginTracker, dll.
  Notifications/          # InAppNotification
  Models/
database/
  migrations/ seeders/
resources/
  js/admin/               # React SPA (dashboard)
  js/app.js               # JS publik
  views/                  # Blade (situs publik)
routes/
  web.php  api.php        # Route publik + API dashboard
public/build/             # Aset ter-build (gitignored)
```

## Deployment

### Nginx (saat ini)

Serve dari `public/`, forward PHP ke `php-fpm` (unix socket). Konfigurasi contoh: `/etc/nginx/conf.d/imagery.conf` (port 8081), diakses publik via Cloudflare Tunnel.

```bash
php artisan config:cache && php artisan route:cache && php artisan view:cache
npm run build
```

### Docker / Coolify

Repo siap untuk **Nixpacks** (auto-detect Laravel) atau Dockerfile. Catatan penting:

- Aset Vite harus dibuild di dalam image (`npm ci && npm run build`).
- `composer install --no-dev --optimize-autoloader`.
- `php artisan storage:link` + migrasi saat deploy.
- Gunakan volume untuk `storage/app/public` (upload media).
- `.env` diisi via UI Coolify (jangan commit `.env`).

## Keamanan

- `.env`, file storage, dan dump SQL di-ignore (jangan commit).
- Login menggunakan password (bcrypt) + OTP WhatsApp opsional.
- Audit log & deteksi IP klien via `CF-Connecting-IP`/`X-Forwarded-For`.

## Lisensi

**Open Source** — didistribusikan sebagai perangkat lunak sumber terbuka.

Powered by [Assasakiy Media](https://github.com/assasakiy).
