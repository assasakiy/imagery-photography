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

### 🐳 Docker Compose (Rekomendasi Utama)

Repo ini sudah dilengkapi dengan konfigurasi Docker siap-produksi (`Dockerfile`, `docker-compose.yml`, dan `docker/start.sh`) yang mencakup Nginx, PHP-FPM, dan Queue Worker dalam satu container efisien, serta layanan MySQL terpisah. Konfigurasi ini cocok untuk VPS standar maupun platform PaaS seperti **Coolify**.

**Cara Menjalankan (VPS Biasa):**
```bash
# 1. Sesuaikan .env jika perlu (secara default docker-compose.yml sudah mengaturnya)
cp .env.example .env

# 2. Build & jalankan (berjalan di port 8081)
docker compose up -d --build
```

**Cara Menjalankan (Coolify):**
1. Buat **Project** baru, pilih sumber Git repository ini.
2. Pada pengaturan Build, pilih **Nixpacks** atau biarkan otomatis mendeteksi **Dockerfile** yang ada di repo.
3. Set Environment Variables (`APP_KEY`, `DB_DATABASE`, `DB_USERNAME`, dll). Jika `APP_KEY` kosong, sistem otomatis men-generate key baru saat startup.
4. Klik **Deploy**.

**Langkah WAJIB Setelah Instalasi Pertama Kali (Docker & Coolify):**
Database akan otomatis di-migrate saat container menyala, namun datanya masih kosong (tidak ada akun Admin/Owner). Anda **wajib** menjalankan seeder *satu kali saja* dari dalam container untuk membuat akun default.

Jika menggunakan VPS:
```bash
docker exec -it imagery_app php artisan db:seed --force
```
Jika menggunakan Coolify, jalankan perintah ini di tab **Command / Terminal** milik layanan aplikasi Anda:
```bash
php artisan db:seed --force
```

Akun default yang terbuat:
- Owner: `owner@imagery.my.id` / `owner123`
- Admin: `admin@imagery.my.id` / `admin123`
- Klien: `client@imagery.my.id` / `client123`

*(Segera ganti password Anda setelah berhasil login di dashboard).*

### Shared Hosting / cPanel (Minimalis)

Deployment paling ringan tanpa Nginx, Docker, maupun VPS — cukup file yang sudah ada di repo:

- Letakkan semua file repo di docroot domain/subdomain (mis. `~/imagery`).
- `.htaccess` (root) otomatis me-*rewrite* semua request ke `public/` **dan** memblokir akses file sensitif (`.env`, `vendor/`, `config/`, `composer.json`, `artisan`, dll → `403`).
- `.user.ini` / `php.ini` mengatur error log cPanel.
- `public/.htaccess` menaikkan limit PHP untuk upload media & image processing (`upload_max_filesize=64M`, `post_max_size=70M`, `memory_limit=512M`) via `lsapi_module`/`php8_module`.

> **Penting:** docroot cPanel boleh menunjuk ke root repo (tidak harus `public/`) karena rewrite ditangani `.htaccess` root.

Langkah sekali pakai setelah clone/deploy:

```bash
# 1. Dependensi
composer install --no-dev --optimize-autoloader
npm ci && npm run build

# 2. Konfigurasi
cp .env.example .env
php artisan key:generate
# isi kredensial DB cPanel di .env lalu:

# 3. Database & media
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
php artisan media:import-covers     # impor cover default (perlu akses internet)
php artisan media:watermark --fresh

# 4. Scheduler & queue (cron cPanel, setiap menit)
* * * * * cd /home/USER/DIR && /usr/local/bin/php artisan schedule:run >> /dev/null 2>&1
* * * * * cd /home/USER/DIR && /usr/local/bin/php artisan queue:work --stop-when-empty --tries=3 --timeout=90 >> /home/USER/logs/queue.log 2>&1
```

Catatan untuk shared hosting:

- `APP_DEBUG=false`, `APP_ENV=production`, `APP_URL=https://domain`.
- Cache/session/queue: `database` (tidak butuh Redis) — sudah default di `.env.example`.
- PHP CLI di cPanel biasanya `/usr/local/bin/php` (cek `which php`).

## Keamanan

- `.env`, file storage, dan dump SQL di-ignore (jangan commit).
- Login menggunakan password (bcrypt) + OTP WhatsApp opsional.
- Audit log & deteksi IP klien via `CF-Connecting-IP`/`X-Forwarded-For`.

## Lisensi

**Open Source** — didistribusikan sebagai perangkat lunak sumber terbuka.

Powered by [Assasakiy Media](https://github.com/assasakiy).
