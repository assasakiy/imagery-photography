# AGENTS.md — Sopian Lalu Imagery (imagery.my.id)

Instruksi kerja untuk AI agent/coding agent pada proyek ini. Baca penuh sebelum mulai.

## 1. Tujuan (Goal)
Membangun ulang website portofolio fotografi/videografi "Sopian Lalu Imagery" menjadi modern:
- **Publik (Blade SSR)** untuk SEO: landing, gallery, detail gallery, layanan, kontak.
- **Dashboard admin & klien (React SPA)**: kelola portfolio, media, layanan, klien, proyek, pembayaran, pesan, landing, pengaturan.
- **Asset default dari WordPress** (sopianlaluimagery.wordpress.com), bisa diganti di dashboard — sekali diganti = tersimpan, tidak bisa balik otomatis; kembali ke default = tempel URL WordPress manual.
- **Keamanan**: RBAC via Spatie Permission. **Media** via Spatie MediaLibrary.
- **Notifikasi**: in-app (API), email SMTP opsional, WhatsApp (driver pluggable schema-driven), webhook outgoing.
- Desain dark & elegan, responsif, dark/light toggle, ikon SVG, struktur berlapis.

## 2. Arsitektur & Lokasi
- Monolith Laravel 13 di `/var/www/imagery`, nginx host port **8081** (80/443 milik Traefik Coolify), domain `imagery.my.id`.
- **Layers (struktur berlapis):**
  Routes (`routes/web.php`, `routes/api.php`) → Controllers → **Services (`app/Services`)** → Models → Views.
  - `app/Services/`: `AssetResolver`, `WhatsApp/` (interface `WhatsAppDriver`, `WhatsAppManager`, `WhatsAppDriverRegistry` schema-driven, `WhatsAppSendResult`, driver `GoWA/EvolutionApi/Waha/Fonnte/Twilio/CustomApi/Meta`), `NotificationService`, `WebhookDispatcher`, `RuntimeSettings`.
- **Publik**: Blade SSR di `resources/views/` (dark elegant).
- **Dashboard**: React SPA (react-router + axios + Tailwind v4) dimount di `/dashboard`, konsumsi `/api/*` (Sanctum cookie auth). Build via Vite multi-entry.

## 3. Stack & Versi
- PHP 8.3, Laravel 13, MySQL, Tailwind v4, Vite 8, React 18, Node 22.
- Wajib: `spatie/laravel-permission`, `spatie/laravel-medialibrary`, `laravel/sanctum`.
- Ekstensi PHP tersedia: gd, exif, fileinfo, mbstring (konversi gambar via GD).

## 4. Design System (berlapis)
- **CSS Layers** Tailwind v4: `@theme` design tokens → `@layer base/components/utilities`.
- Tokens: font Instrument Sans; palet dark (zinc/neutral) + aksen brand; radius besar; spacing konsisten.
- **Dark/Light**: toggle simpan `localStorage`, default `prefers-color-scheme`, kelas `dark` di `<html>`, transisi `transition-colors`.
- **Responsive**: mobile-first, hamburger menu, grid adaptif, tabel bisa discroll (overflow-x).
- **Komponen Blade**: `button`, `card`, `icon` (SVG Lucide inline), `section-heading`, `navbar`, `footer`, `input`.
- **Komponen React**: layout → ui → feature berhirarki.

## 5. Konvensi Form & Auth
- Login: checkbox **"Jangan lupakan saya"** (perpanjang session) + **show/hide password**.
- Semua form: field **wajib `*` / opsional** ditandai, validasi client-side + server-side (Laravel Validator), error inline.
- Bahasa UI: **Indonesia**. Mata uang: IDR.

## 6. Aturan Asset
- `portfolios.image_url` / `blogs.image_url` = URL default (di-seed dari WordPress) atau tempel manual.
- Upload / impor URL → simpan via Spatie Media (koleksi `cover`), kosongkan `image_url`. URL eksternal hanya sumber import 1×.
- Prioritas tampil: **Spatie media (original/thumbnail conversion) → `image_url` → null**. Card publik pakai `thumbnail_url`; hero/detail/lightbox publik pakai `watermark_url(cover_url)`; admin/editor pakai `cover_url` (original). Blog tanpa watermark.
- Command backfill: `php artisan media:import-covers` (media Spatie dari `image_url` lama); jika storage tak writable oleh CLI, pakai `sudo -u apache ...`.
- Hero/logo/about: `landing_contents` bernilai `media:{id}` / URL / kosong (→ default WP atau placeholder).

## 7. RBAC (Spatie Permission)
- Roles: `owner` (tertinggi), `admin`, `client`.
- Permissions: `manage-portfolio`, `manage-media`, `manage-services`, `manage-clients`, `manage-messages`, `manage-payments`, `manage-landing`, `manage-settings`, `view-projects`, `manage-reviews`, `submit-reviews`, `manage-blog`, `manage-faq`, `manage-pages`.
- Gate via middleware `role:`/`permission:` (gantikan `CheckRole` & kolom `users.role`).
- Route `route:list` menganggap `admin|owner` = grup owner (sintaks Spatie memaknai `|` sebagai "atau" antar role).

## 8. Notifikasi
- **In-app**: badge/feed di React via API (polling ringan, tanpa WebSocket).
- **Email SMTP**: prioritas konfigurasi `settings` DB → `.env` → jika tak ada, **skip aman (log, bukan error)**.
- **WhatsApp**: `WhatsAppDriverRegistry` schema-driven (key,name,description,fields[]). Daftar driver: GoWA, Evolution API, WAHA, Fonnte, Twilio, Custom REST, Meta Cloud API. Config tersimpan sebagai satu JSON `whatsapp_config` = `{driver, config:{...}}` (legacy `whatsapp_token`/`whatsapp_webhook_url`/`whatsapp_driver`/env otomatis dimigrasikan saat dibaca). Semua driver mengembalikan `WhatsAppSendResult` ter-normalisasi (`success, provider, message, provider_message_id, raw`) — frontend tidak bergantung format provider. Field password di-mask `••••••••` dan dipertahankan saat PUT (tidak ditimpa nilai asli). Paksa IPv4 (`CURLOPT_IPRESOLVE_V4`) untuk semua outbound karena VM tanpa IPv6.
- **Webhook outgoing**: event penting (pesan baru, pembayaran dikonfirmasi, proyek update) → POST JSON ke URL terkonfigurasi via queue (`QUEUE_CONNECTION=database`).

## 9. Alur Kerja (Plan → Design → Build)
1. **Plan**: baca AGENTS.md, eksplorasi kode & DB, ambil konten dari WordPress, susun rencana, konfirmasi ke user.
2. **Design**: siapkan design tokens & komponen dasar sebelum fitur.
3. **Backend**: composer deps, migrations, seeders (`DummyDataSeeder`, `BlogSeeder`), services.
4. **Dashboard React**: auth + layout + halaman CRUD + pengaturan.
5. **Publik Blade**: redesign dark, gallery masonry+lightbox+filter, tabel harga layanan, `gallery/show` baru.
6. **Notifikasi**: in-app, email, WhatsApp, webhook.
7. **Build & verifikasi**: build asset, migrate, seed, tes route.
8. **Git (wajib)**: setiap penambahan/perubahan fitur yang selesai & terverifikasi WAJIB di-commit lalu di-push.
9. **Dokumentasi (wajib)**: 
   - **Update Sesi Terakhir**: Setiap selesai sesi, **GANTI (replace)** isi section "Sesi Terbaru" di `AGENTS.md` dengan rangkuman ringkas apa yang baru saja Anda kerjakan. Jangan sekadar *append* / menumpuk peluru baru.
   - **Update Detail Dokumentasi Resmi**: Semua penjabaran teknis mendalam mengenai fitur (misal: bagaimana arsitektur RBAC bekerja, bagaimana alur QRIS, bagaimana media diatur) **TIDAK BOLEH ditumpuk di AGENTS.md**. Anda WAJIB memperbarui file markdown terkait di dalam folder **`docs/`** (contoh: `docs/architecture_and_rbac.md`, `docs/payments_and_qris.md`). `AGENTS.md` hanya menjadi pintu gerbang (indeks).

## 10. Perintah Penting
```bash
composer require laravel/sanctum spatie/laravel-permission spatie/laravel-medialibrary
npm i react react-dom react-router-dom axios @vitejs/plugin-react
npm run build        # produksi
php artisan migrate --force
php artisan db:seed --force
php artisan media:watermark --fresh                  # generate watermark cache utk portfolio
php artisan media:import-covers                      # backfill image_url -> media Spatie (jalankan sudo -u apache)
composer test        # phpunit
```

## 10b. Konvensi Halaman Bertab (folder per halaman)
Halaman dashboard yang punya beberapa tab **WAJIB** dipisah ke folder `pages/<nama>/`: `index.jsx` (state global + tab bar + render tab aktif), file per tab (`<Tab>Tab.jsx`), dan `constants.js` (konstanta/helper bersama). `pages/<Nama>.jsx` cukup re-export `export { default } from './<nama>';`. Kontrak antar-tab: index menyusun objek `ctx` (semua state & handler) lalu render `{tab === 'x' && <XTab {...ctx} />}`; tiap tab destructure props yang dipakai dari `ctx`. Berlaku utk halaman baru & refactor bertahap halaman lama (Settings sudah, AuditLog/Services/Notifications/Media menyusul).

## 11. Catatan & Alur Git
- **Dokumentasi Terpisah**: File `AGENTS.md` ini hanya untuk *Rule of Thumb* operasional, Gotcha yang sering menjebak, dan log "Sesi Terbaru". Jika Anda membuat/mengubah fitur besar (seperti Booking, Pembayaran, Media, Blog), Anda **DIWAJIBKAN untuk menganalisis dan memperbarui** dokumentasi resminya yang berada di direktori `docs/` (`docs/*.md`).
- **Update Sesi Terbaru**: GANTI isi section "Sesi Terbaru" dengan apa yang baru saja dikerjakan. Riwayat kerjaan yang lama dihapus dari sini (riwayat sesungguhnya ada di Git history).
- **Git WAJIB untuk setiap fitur**: setiap penambahan/perubahan fitur yang selesai & sudah build+verifikasi sukses, agent HARUS `git add -A`, `git commit` (pesan ringkas sesuai perubahan), lalu `git push origin main`. Jangan menunggu diminta.
- Remote: `origin` = `https://github.com/assasakiy/imagery-photography.git` (repo PRIVAT).
- Periksa `git status` sebelum commit; jangan commit `.env`, dump SQL (`storage/backups/`), file storage, atau credential (sudah di-ignore).
- Jangan ubah file tanpa instruksi; ikuti konvensi yang ada.
- Produksi (APP_DEBUG=false) — backup DB & storage sebelum migrate/seed besar.

## 12. Arsip Catatan (2026-08-02 → 08-05) — gotcha yang masih berlaku
- **CSRF Laravel 13**: test curl/Python WAJIB kirim header `X-XSRF-TOKEN` (= cookie `XSRF-TOKEN` yang di-URL-decode) pada SEMUA POST/PUT/PATCH/DELETE. Cookie `XSRF-TOKEN` pada response login SELALU stale (token dirotasi saat login) — SPA re-sync via GET `/user` + interceptor 419 di `api.js`.
- **apiResource `media`**: wajib `->parameters(['media' => 'media'])` (tanpa itu, Laravel generate `{medium}` → model binding gagal). API `blog` wajib `->names('api.blog')` agar tak bentrok route web.
- **Laravel implicit model binding**: parameter controller HARUS nama variabel camelCase yang cocok dgn route param. Route `{service_category}` → param wajib `ServiceCategory $serviceCategory` (bukan `$category`), atau binding gagal → objek kosong/id null (gejala: Integrity constraint saat relasi create).
- **Keluar SPA**: jangan pakai `<Link to="/">` / `<Route path="/">` untuk ke situs publik — gunakan `<a href="/">` (route `*` mengembalikan ke `/dashboard`). React StrictMode: `useEffect(load, [])` dengan `load` arrow-expression (return Promise) memicu `l is not a function` — pakai blok-body.
- **RBAC**: role `owner` tertinggi; middleware `role:owner` untuk `/api/team*`, `/api/landing`, `/api/settings`. `NotificationService::toAdmins` = role `admin|owner`.
- **Kredensial**: owner `owner@imagery.my.id` / `owner123`; admin `admin@imagery.my.id` / `admin123` (owner password di-reset menjadi `owner123` pada 2026-08-13).
- **SELinux**: php-fpm host jalan di domain `httpd_t` → outbound diblokir oleh `httpd_can_network_connect` (gejala "after 0 ms"). Sudah fix persisten: `sudo setsebool -P httpd_can_network_connect on`.
- **VM tanpa IPv6**: semua outbound (WhatsApp driver, download watermark) wajib `CURLOPT_IPRESOLVE_V4`. GoWA `base_url` tanpa `:3000` (port internal).
- **`RuntimeSettings` cache 1 jam**: ubah setting via tinker → wajib `app(RuntimeSettings::class)->forget()`.
- **`Portfolio::getCoverUrlAttribute` & aksesor lain TIDAK otomatis masuk JSON** — list API yang pakai `paginate()` mentah harus di-serialize (lihat `->through(fn => $this->serialize(...))`).
- **Media Library**: model butuh `$fillable=['id']`; `LandingContent::setValue` pertahankan `group`; reset landing images meninggalkan media orphan (TODO).
- **Test**: skrip di `/home/opc` (`spa_test.py`, `final_test.py`, `access_test.py`); `/etc/hosts` berisi `127.0.0.1 imagery.my.id`; `/tmp/opencode` TIDAK writable.

## 13. Sesi Terbaru (2026-08-18) — Landing sections menyeluruh + Contact = Single Source of Truth
- **Halaman Tentang**: editor lengkap 8 section — Cerita (judul kecil+judul+content RichEditor+image), Perjalanan (judul+deskripsi+timeline), Tim (anggota AUTO dari akun admin/owner via `User`, override per-anggota di `sections.tim.members`, foto/nama/posisi/bio/sosmed), Karya (mode unggulan/latest/kategori+limit), Stats. `AboutPageController` resolve dari `sections`.
- **Dashboard Tim & Admin**: tab "Tim" dihapus → murni CRUD akun admin. TeamMember di-cabut dari landing (sumber = `User` berperan admin/owner + profil mereka).
- **Card tim format baru**: grid 2 kolom desktop / 1 mobile, kiri = avatar+nama+jabatan, kanan = "Follow on" (sosmed berjejer + nama; mobile tanpa nama). Fallback: sosmed → bio(+tanggal bergabung `joined_at`) → badge → compact. Foto profil fallback `AssetResolver::DEFAULT_AVATAR` (data-URI SVG siluet, tanpa dependensi eksternal).
- **Halaman Kontak = Single Source of Truth** untuk SEMUA info kontak: telepon, email, alamat, map, sosmed → tersimpan di `sections.kontak` halaman contact. Helper `contact_info()` (`app/Support/helpers.php`) dipakai footer & halaman kontak (& halaman lain). Tabel `settings` (key `contact_*`, `social_*`, `map_url`) dibersihkan dari data kontak; `SettingsController` tak lagi validasi/index key itu; tab Branding hanya visual (nama, tagline, logo, favicon, warna, timezone).
- **Sosmed dinamis + dropdown brand**: di KONTAK (dulu Branding) + pengaturan — satu daftar sosial yang semua bisa dihapus, tombol "Tambah"; dropdown `SocialSelect` menampilkan logo brand filled (Instagram/FB/TikTok/WA/YouTube/X/Telegram/Threads/LinkedIn/Pinterest). Path logo di `resources/views/partials/social-icon.blade.php` + `pages/admin/landing/sections/socialPlatforms.jsx`. Frontend Branding tak lagi menampilkan sosmed (padahal backend endpoint masih menyimpan legacy — TODO bersihkan bila dihapus total).
- **Halaman Layanan**: editor 8 section (`LayananSections.jsx`) — Populer/Unggulan (toggle `use_popular`/`use_featured` + limit 3/6 tiap), Satuan (subtitle+title+multi-select service, kosong=all), Premium (pilih paket bundling), Ultimate (pilih paket combo), Judul & Catatan (RichEditor, kosong=hidden), FAQ (mode all/ids/kategori), CTA. `ContactController::services()` resolve; blade `landing_pages/services` ditulis ulang. Grid pub paket 3 kolom.
- **Halaman Home**: Section Karya (mode unggulan/latest/kategori + limit 3/6/9 grid 3 kolom), Section Layanan (judul kecil+judul+deskripsi fallback description halaman Layanan + mode/limit paket), "Selengkapnya" tentang → langsung `/tentang` (bukan `<details>`); judul About auto dari `cerita.title`.
- **Editor landing**: `Editor.jsx` orkestrator tipis; `sections/` memuat `normalize.js`, `shared.jsx`, `HeroSection`, `HomeSections`, `TentangSections`, `TeamSection`, `FaqSections`, `BlogGallerySections`, `LayananSections`, `KontakSections`, `SocialSelect`. Branch slug: home/tentang/faq-page/blog/gallery/kontak/legal; content editor utama disembunyikan utk halaman ber-section.
- **Maps embed otomatis**: form tempel URL Google Maps biasa/link bagikan → helper `maps_embed_url()` (`helpers.php`) ubah ke `output=embed` (ambil koordinat `@lat,lng` atau `?q=`).
- **Rich Editor konsisten**: strip HTML kosong (`<p></p>` dll) — frontend `isEmptyRich` di Hero/Home/Tentang; backend `ContentSanitizer::clean()` return '' bila tak ada teks; data lama yg tersimpan `<p></p>` dibersihkan. List halaman (`Index.jsx`) menampilkan deskripsi dengan tag di-strip.
- **Bug fix**: model `Faq` aksesor `categories` memakai `getRelation()` (hindari rekursi → `options`/`faqs` API 500). Header landing: hamburger utk mobile + tablet (breakpoint `lg:`), nav penuh desktop saja. Stats about: grid 1→2→4 kolom, border "+" di tablet/mobile.
- **Data nyata**: FAQ=0, Reviews=3, Stats=1. Package: 15 (bundling+combo), Service satuan: 12. Kategorisasi layanan di landing oleh `ServiceCategory.type` (satuan/bundling/combo) — SUDAH TIDAK AKTIF: tabel `service_categories` dihapus, kategori dibedakan via `Package.type` (bundling/combo) & Service.tipe (`event`/`media`).
- **Migrasi disquash jadi 5 file** `database/migrations/` (`*_squash_auth_platform`, `*_squash_media_content`, `*_squash_services_pages`, `*_squash_projects_orders`, `*_squash_reviews_security`) — stats & permission `manage-stats` sekarang dimebebaskan langsung di `squash_reviews_security`; faqs/reviews tak lagi punya kolom `published`; tabel `service_categories` tidak dibuat. **DB sudah di-`migrate:fresh` + re-seed** → konfigurasi dashboard (isi sections home/tentang/layanan/kontak, stats, flag featured/popular) HILANG dan perlu diatur ulang via dashboard; halaman publik tetap 200. Seeder `DatabaseSeeder` (seedSampleReviews) & `DummyDataSeeder` (import `Portfolio`) sudah diperbaiki setelah squash. Backup pra-wipe: `storage/backups/pre_squash_20260819_034038.sql`.
- **Seeder demo diperbarui**: akun klien `client@imagery.my.id`/`client123` (role `client`, profil "Ayu Maharani") punya tepat 1 booking (`BK-00001`, converted) + 1 project (order_no + invoice). `BookingAndProjectSeeder` idempotent (forcesDelete project lama user null/klien sebelum create; Project soft-delete perlu `forceDelete()` agar tidak tabrakan unique `order_no`). `seedSampleStats()` buat 4 stats manual (500+, 5 tahun, 350+, 95%); `seedSampleFaqs()` buat 10 FAQ terbagi 3 kategori `Category` (Pemesanan/Pembayaran/Proses & Hasil) via morph `categorizables`. Tambah 1 booking pending terpisah = tidak lagi.
- **Kategori sistem disembunyikan dari dropdown pilihan**: 3 kategori `is_system=true` (Artikel Unggulan/`featured`, Artikel Populer/`populer`, Artikel Terbaru/`latest`) TIDAK muncul di dropdown pilih kategori — dipakai hanya internal blog/landing (histori + resolusi UI). Filter `where('is_system', false)` di `Api\PageController::options()` (kategori editor landing: FAQ/karya/home/tentang/layanan) dan param `?exclude_system=1` di `Api\CategoryController::index` (dipakai `Portfolio.jsx` & `content/FaqTab.jsx`). `CreateEditBlog.jsx` filter `!is_system` di frontend; `Categories.jsx` (kelola) & `Blog.jsx` (list artikel) tetap menampilkan kategori sistem.

## 14. Perintah Verifikasi
```bash
php -l <file>.php              # lint PHP (seluruh file yang diubah)
CI=1 npx vite build            # build frontend (public/build di-gitignore)
php artisan test               # phpunit (composer test)
```
Lihat `docs/timezone_and_scheduling.md` untuk desain lengkap sistem timezone.

*Untuk rincian arsitektural teknis (lifecycle Media, mekanisme RBAC, dan khususnya sistem **progressive loading dashboard**), silakan baca file-file spesifik di direktori `/docs/`.*
