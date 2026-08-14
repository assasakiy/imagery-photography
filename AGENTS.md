# AGENTS.md — Sopian Lalu Imagery (imagery.assasakiy.my.id)

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
- Monolith Laravel 13 di `/var/www/imagery`, nginx host port **8081** (80/443 milik Traefik Coolify), domain `imagery.assasakiy.my.id`.
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
- `portfolios.image_url` = URL default (di-seed dari WordPress).
- Upload → simpan via Spatie Media (koleksi `cover`), kosongkan `image_url`.
- Tempel URL manual → set `image_url`, kosongkan media.
- Prioritas tampil: **Spatie media → `image_url` → placeholder**. Tanpa tombol reset otomatis.
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
3. **Backend**: composer deps, migrations, seeders (`WordPressContentSeeder`), services.
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
php artisan db:seed --class=WordPressContentSeeder
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
- **Test**: skrip di `/home/opc` (`spa_test.py`, `final_test.py`, `access_test.py`); `/etc/hosts` berisi `127.0.0.1 imagery.assasakiy.my.id`; `/tmp/opencode` TIDAK writable.

## 13. Sesi Terbaru (2026-08-13) — Timezone Bisnis Global
- **Notifikasi Status Proyek Otomatis**: Logika notifikasi (Email/WA/In-App) dipusatkan di `NotificationService::notifyProjectStatusChanged` yang terpicu via Controller saat status berubah ke tahap utama. Tidak lagi manual di controller. Redudansi notifikasi dihilangkan; notifikasi hanya muncul pada perubahan status yang valid.
- **Sistem Redelivery Tanpa Token**: Menghapus sistem `ClientAccessToken` untuk akses proyek (kini akses unduh sepenuhnya berbasis login klien). Fitur Redelivery (unduh arsip) kini menggunakan tabel `redeliveries` (status `approved` + `expires_at`) untuk verifikasi akses download, menghapus ketergantungan pada tabel `client_access_tokens` dan kolom proyek yang tidak perlu.
- **Pembersihan**: Kolom `can_download_archive` di `projects` dihapus. Logika notifikasi dibersihkan dari Controller.
- **Backend**: jadwal acara (`event_start`/`event_end`) selalu disimpan UTC (config `app.timezone` tak berubah). Input wall-clock lokal (timezone bisnis) dikonversi ke UTC di `BookingController::store`, `Api\ProjectController` (store+update), `Api\BookingApiController` (confirm/accept), dan `Api\CustomerController`. Helper `App\Support\BusinessTime` (`toUtc`/`parseToUtc`/`fromUtc`) dengan tiang-3 lapis timezone: DB setting `timezone` → `.env APP_BUSINESS_TIMEZONE` → `Asia/Makassar`. `Api\SettingsController` mengekspor & memvalidasi `timezone`.
- **Frontend**: utilitas `resources/js/dashboard/utils/date.js` berbasis `Intl.DateTimeFormat` (timezone business, date-only diperlakukan UTC). Semua `.slice(11,16)` dan `new Date(event_start)` diganti `formatTime`/`formatTimeInput`/`isEventPassed`; `formatLongDate` dipusatkan. `window.APP_CONFIG.businessTimezone` di-set di layout Blade agar apply langsung setelah ganti timezone.
- **Settings UI**: dropdown timezone di tab **Regional** (BrandingTab).

## 14. Perintah Verifikasi
```bash
php -l <file>.php              # lint PHP (seluruh file yang diubah)
CI=1 npx vite build            # build frontend (public/build di-gitignore)
php artisan test               # phpunit (composer test)
```
Lihat `docs/timezone_and_scheduling.md` untuk desain lengkap sistem timezone.

*Untuk rincian arsitektural teknis (lifecycle Media, mekanisme RBAC, dan khususnya sistem **progressive loading dashboard**), silakan baca file-file spesifik di direktori `/docs/`.*
