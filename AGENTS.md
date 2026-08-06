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
9. **Dokumentasi (wajib, anti-bengkak)**: setiap penambahan/perubahan fitur WAJIB dicatat di AGENTS.md SEBELUM commit — tapi TIDAK menumpuk. Aturannya: **replace, bukan append**. Detail perubahan terbaru ditulis menggantikan isi section "Sesi Terbaru"; gotcha/bug yang masih berlaku dipindah ke "Arsip". Riwayat lengkap tersimpan di git history.

## 10. Perintah Penting
```bash
composer require laravel/sanctum spatie/laravel-permission spatie/laravel-medialibrary
npm i react react-dom react-router-dom axios @vitejs/plugin-react
npm run build        # produksi
php artisan migrate --force
php artisan db:seed --class=WordPressContentSeeder
composer test        # phpunit
```

## 11. Catatan & Alur Git
- **Dokumentasi: replace, bukan append**: setiap perubahan fitur dicatat di section **"Sesi Terbaru"** — GANTI isinya (jangan tambah bullet baru terus-menerus). Gotcha/bug permanen yang masih relevan dipindahkan ke **"Arsip"**. Kalau AGENTS.md mulai bengkak, ringkas/musnahkan yang lama (riwayat tetap ada di git).
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
- **Kredensial**: owner `owner@imagery.my.id` / `owner123` (password diubah 2026-08-04).
- **SELinux**: php-fpm host jalan di domain `httpd_t` → outbound diblokir oleh `httpd_can_network_connect` (gejala "after 0 ms"). Sudah fix persisten: `sudo setsebool -P httpd_can_network_connect on`.
- **VM tanpa IPv6**: semua outbound (WhatsApp driver, download watermark) wajib `CURLOPT_IPRESOLVE_V4`. GoWA `base_url` tanpa `:3000` (port internal).
- **`RuntimeSettings` cache 1 jam**: ubah setting via tinker → wajib `app(RuntimeSettings::class)->forget()`.
- **`Portfolio::getCoverUrlAttribute` & aksesor lain TIDAK otomatis masuk JSON** — list API yang pakai `paginate()` mentah harus di-serialize (lihat `->through(fn => $this->serialize(...))`).
- **Media Library**: model butuh `$fillable=['id']`; `LandingContent::setValue` pertahankan `group`; reset landing images meninggalkan media orphan (TODO).
- **Test**: skrip di `/home/opc` (`spa_test.py`, `final_test.py`, `access_test.py`); `/etc/hosts` berisi `127.0.0.1 imagery.assasakiy.my.id`; `/tmp/opencode` TIDAK writable.

## 13. Sesi Terbaru (2026-08-05)
- **OTP login dinamis & hapus override per-akun (terbaru)**: halaman login hanya menampilkan opsi "Masuk dengan OTP" jika **setting global OTP aktif (`login_methods_global.otp`) DAN ada kanal terkonfigurasi** (WA/email). `APP_CONFIG.otp = {enabled, whatsapp, email}` dari `RuntimeSettings::loginMethodEnabled()` & `otpChannelsAvailable()`. Label input OTP dinamis: keduanya→"Email / No. WhatsApp", WA saja→"No. WhatsApp", email saja→"Email". `sendOtp`/`verifyOtp` terima `identifier` (email/WA) via `resolveUser()`. **Override per-akun DIHAPUS**: migration `2026_08_05_230100_drop_login_method_override_from_users` drop `users.allowed_methods`/`login_method`; `ClientController` hapus handling; `User::allowedLoginMethods()` fallback global. Admin cukup pilih channel saat kirim kredensial (Invite/Recovery di halaman Klien).
- **Magic Link & Recovery + Notifikasi routing**: `client_access_tokens` multi-purpose (`invite`|`recovery`|`project`), `project_id` nullable, `created_by_type/id`, masa berlaku per purpose. `accessViaToken` by purpose. API forgot/set/reset + clients credentials/token. OTP mekanisme existing. `NotificationService::send(NotificationType, ...)` routing oleh kategori. UI kredensial di halaman Klien; ProjectDetail info kontak read-only + "Lihat Detail Klien". Halaman SPA guest `/forgot`, `/set-password`, `/reset-password`. Sync `user.phone` dari `client.phone` saat issueToken.

- **Fix: owner tak lihat project di dashboard** — `ProjectController::index` & `DashboardController` pakai `isStaff()` (bukan `isAdmin()`); frontend `['admin','owner'].includes(role)`. Gejala: project ada di DB & URL `/dashboard/projects/{id}` bisa dibuka tapi kosong di list dashboard. Akar: owner role `owner` ditolak `isAdmin()` → jatuh ke cabang client.
- **Portal Klien & Role Subscriber (terbaru)**: role `subscriber` baru (permission `read-blog`,`manage-bookmarks`,`view-history`); role `client` kini punya `read-blog`,`manage-bookmarks`,`view-history` juga. Client otomatis diassign 2 role (`client`+`subscriber`) di `ClientController@store` & `ProjectController@ensureClientUser`. Helper baru `User::primaryRole()` (owner>admin>client>subscriber) — dipakai di payload `/api/user` & profile (`role` + `roles[]`); `User::isStaff()` cek hasRole owner/admin. Dashboard klien jadi **portal**: menu Dashboard, Pesanan (label klien; admin tetap "Proyek", route tetap `/projects`), Booking, Tagihan, Galeri Saya, Pesan, Review, Bookmark, Riwayat. Menu subscriber murni (tanpa client): Dashboard, Bookmark, Riwayat.
- **Login dinamis**: setting global `login_methods_global` (JSON password/otp/google/token) di tab Keamanan Pengaturan + override per user via `users.login_method`/`allowed_methods` (UI di Edit Klien). `User::allowedLoginMethods()` & `canUseLoginMethod()`; `AuthController` blokir password/otp non-aktif, GoogleAuth blokir google non-aktif. **Tanpa public register** (client dibuat otomatis dari alur bisnis atau admin).
- **Bookmark & History polymorphic**: tabel `bookmarks` (user, bookmarkable_type/id, unique trio) + trait `Bookmarkable` (di Blog, Portfolio, Package) + API `GET/POST /api/bookmarks`, `DELETE /api/bookmarks/{type}/{id}`. Tabel `history_events` (user, action viewed/read/downloaded, target_type/id, meta, ip) + `HistoryService` — direkam otomatis di `BlogController@show` (read), `GalleryController@show` (viewed), `ProjectController@downloadFile` (downloaded). API `GET /api/history`.
- **Retensi & arsip (fondasi)**: `projects` + `retention_days` (override), `archived_at`, `deleted_at`(soft); `project_files` + `expires_at`. Upload set `expires_at` sesuai `retentionDays()` (global setting `file_retention_days` di tab Keamanan: 0/30/90/180/365). `downloadFile` blokir file `expires_at` lewat & project `archived_at` (klien). Admin route `PATCH /projects/{project}/archive` & `/restore`. **Membership/Client+ & payment berulang ditunda** — cukup set `retention_until=null`/`+365` tanpa ubah struktur.
- **Customer API baru**: `GET /api/customer/dashboard|bookings|invoices|payments|gallery|messages`, `POST /api/customer/messages` (`ContactMessage` + kolom `project_id`, `status`). Filter pesan/booking via email/phone user. `clientProjects()` fallback query kosong utk user tanpa client.
- **Layanan — kolom `terms`**: "Edit + Softfile" dipindah dari `duration` ke kolom baru `terms` (ketentuan); `duration` hanya durasi nyata. Seeder `DatabaseSeeder` tak lagi seed `services` (skema lama title/starting_price dihapus); pakai `ServiceSeeder`. Gotcha: cache file Spatie permission dimiliki `apache` — setelah ubah role/permission wajib `sudo rm -rf storage/framework/cache/data/*` (kalau tak, `PermissionDoesNotExist` samar).
- **Layanan — summary isi paket (terbaru)**: paket dgn item duplikat event (Combo punya Akad photo & video) sebelumnya tampil "Akad, Akad, Wedding, Wedding..." karena `pluck('name')` (name = event). Fix: method baru `Package::summary()` — kelompokkan services per event, tampilkan `Event (Media1 + Media2)` → "Akad (Photo + Video), Wedding (Photo + Video), Nyongkolan (Photo + Video)". Dipakai di landing home, kartu featured & kartu/daftar kategori di `/services`.
- **Layanan — nama satuan & tabel landing (terbaru)**: master satuan pakai `name = event` saja (mis. `Akad`, `Wedding`) — TIDAK lagi `Wedding Photo` — karena media sudah kolom terpisah. Tabel satuan di `/services` dikelompokkan per event: 1 baris per event, kolom per media (Foto/Video/dll dari `category.columns`, dideteksi via substring `foto`/`video`/`drone`), harga ditaruh di kolom media yang tepat + durasi sebagai sub-label. Grid satuan juga dikelompokkan per event (kartu event + daftar media/harga). Nama service diubah via tinker (bukan re-seed penuh agar FK project/package aman).
- **Layanan — bersih-bersih file & layout (terbaru)**: drop tabel `service_items` (sisa sistem kategori lama, dibuat di migration `create_service_categories` lalu dihapus via `2026_08_05_200000_drop_service_items_table`), hapus model `ServiceItem.php` yang tak terpakai, bersihkan ref `ServiceItem` di `ServiceSeeder`. Layout halaman `/services` dirombak: hero center, kartu utama widget (Photography min foto / Videography min video / kartu paket featured ⇾ amber), daftar kategori dinamis (tabel/grid sesuai `layout`), `container-site` terpisah untuk Catatan Penting & CTA.
- **Layanan — rombak total ke master satuan + paket (terbaru)**: sistem layanan dirombak dari "kartu + tabel hard-coded" menjadi arsitektur tanpa duplikasi harga. **`services` = master layanan satuan** (1 baris = 1 layanan: `name`, `event`, `media` (photo/video/drone/photobooth/livestream), `duration`, `price`, `active`, `order`). **`packages`** = paket (type `satuan|bundling|combo`, `price_mode` auto/manual, `promo_type` none/nominal/percent, `promo_value`, `manual_price`, `is_popular`, `is_featured`, `is_active`, `display_order`) + **`package_items`** (pivot package↔service + `qty`). **Harga paket TIDAK disimpan** saat `price_mode=auto` — dihitung server tiap read via `Package::computedPrice()` = Σ(satuan×qty) − diskon; `price_mode=manual` pakai `manual_price`. **`service_categories`** jadi kategori tampilan landing saja (label/title/**type** satuan|bundling|combo/layout/columns/order/published). Seeder `ServiceSeeder` pecah data lama jadi 12 satuan (event×media) + 4 paket contoh + 3 kategori (Satuan/Bundling/Combo).
- **Landing kartu atas = widget otomatis** (bukan entitas DB): Photography = min harga satuan `media=photo`; Videography = min `media=video`; kartu ketiga = paket `is_featured` (fallback popular/first) dengan badge ⭐. Home preview (`landing/index.blade.php`) & booking dropdown sekarang pakai `$packages` (computed price), bukan `$services`.
- **Project = snapshot**: `projects` + `package_id` (nullable FK nullOnDelete) + `pricing_snapshot` (JSON: package, items[], discount, total) — terisi otomatis saat pilih paket di form project; `price` auto-fill (bisa diedit manual = negosiasi). Snapshot tidak ikut berubah walau master berubah. ProjectController store & update menyusun snapshot dari `Package::computedPrice()`.
- **Backend baru**: `PackageController` (CRUD + serialize dgn base_price/discount/price/items line_total). `ServiceController` = CRUD master satuan. `ServiceCategoryController` tanpa sync items. Routes: `apiResource('packages')`.
- **Dashboard `Services.jsx` — 3 tab**: Master Layanan (tabel CRUD), Paket (checklist satuan + qty, harga otomatis realtime, promo nominal/persen, manual, label, urutan), Kategori. `Projects.jsx`: dropdown paket → isi + harga auto-fill.
- **Alur Git & dokumentasi**: tiap fitur wajib dicatat di "Sesi Terbaru" (replace, bukan append) lalu commit + push `main`. Repo `origin` PRIVAT. Commit terkait: `d447305` (init) → `1e9cb73` (login link + alur git) → `e320b11` (portfolio serialize) → `d04fa7c` (media lihat/edit nama) → `43cef85` (watermark + popup reusable) → `60a906d`/`2084e5e`/`60ed27a` (info popup) → `a1a1e1f`/`cac6658` (fullscreen + tombol bawah) → `4db1a34`/`f5193ec`/`1706ef9`/`2264878` (menu mobile) → `a826669` (docs).
- **Media dashboard — view semua + filter + hapus massal (terbaru)**: tab filter tipe di atas grid (Semua/Foto/Video/Dokumen) → `GET /api/media?type=image|video|audio|document` (`MediaController::index` match mime). Mode **Pilih** di baris filter (kanan, `ml-auto`, sejajar tab): tombol Pilih (ikon `check-square`, label desktop) → mode seleksi; saat seleksi tampil **Pilih semua** (ikon `square`/`check-square` bergantung semua terpilih, label desktop), **Hapus** (ikon trash + `(n)` saja, tanpa label), dan **Batal** (ikon `x` saja). Ketiganya (Pilih/Hapus/Batal) **tanpa kotak/border** — hanya ikon + `p-1.5` (hover ringan `hover:bg-*`). Route bulk HARUS dideklarasikan SEBELUM `apiResource('media')` agar tidak tertangkap `{media}`. Tombol aksi card (hover overlay & tiga titik) disembunyikan saat mode pilih. Tombol **Upload Media** di header. **Mobile: semua kontrol baris filter hanya ikon** (label `hidden sm:inline`). Batas 24 item/halaman.
- **Media dashboard — pratinjau video & dokumen**: card video kini pakai `<video muted preload="metadata">` (thumbnail frame pertama asli, bukan ikon) + overlay play. `MediaViewModal`: video = `<video controls autoPlay>`; PDF = `<iframe>`; dokumen lain = ikon + tombol "Buka File" (link download). Prasyarat: file harus dilayani dengan support Range (nginx → `Accept-Ranges`/206) agar `preload="metadata"` menghasilkan thumbnail.
- **MediaViewModal — tata letak (terbaru)**: popup kini struktur **header/body/footer** di SEMUA modal dashboard. `Modal` (ui.jsx) punya prop `footer`; di fullscreen: header `shrink-0` (atas) + body `overflow-y-auto` (scroll) + footer `shrink-0 border-t` (bawah), header & footer SELALU sticky, hanya body yang scroll. Untuk modal normal (non-fullscreen): shell `max-h-[90vh] flex flex-col overflow-hidden rounded-2xl` (overflow-hidden penting agar footer ikut radius sudut popup), body scroll, footer `border-t bg-surface px-4 py-3 [&_.btn]:px-4 [&_.btn]:py-2` (footer kecil, tombol dikompresi; scoping non-fullscreen agar tidak mengganggu tombol kompak MediaViewModal). Semua tombol aksi (Batal/Simpan/Selesai/Konfirmasi) dipindah dari body form ke prop `footer`; submit button pakai `form="<form-id>"` (HTML form attribute) agar tetap submit form yang ada di body. Diterapkan di: Services, Clients, BlogCategories, BlogTags, Faq, Pages, Reviews, Portfolio, Blog, Projects (2), ProjectDetail, Team (3), ProfileSettings (5), MediaEditModal, Confirm. MediaPicker/IconPicker (picker konten, tanpa tombol aksi tetap) & upload modal Media dibiarkan. Footer MediaViewModal: tombol Info / Salin URL / Edit — **desktop ikon+nama, mobile ikon saja** (span `hidden sm:inline`).
- **Bug login**: "Kembali ke beranda" pakai `<Link to="/">` → di-route-balik ke `/dashboard` → balik ke login. Fix `<a href="/">` di `Login.jsx`.
- **Portofolio gambar dashboard**: `PortfolioController::index()` me-`through(serialize)` agar `cover_url`/`has_local_media` ada di JSON (gambar dari link WordPress tampil).
- **Media dashboard**: `MediaController::update()` (PUT `/api/media/{media}`, ganti `name`, log audit). Popup reusable `MediaViewModal` (fullscreen, gambar penuh, tombol aksi menempel bawah: Salin URL + Edit — tombol Buka DIHAPUS) & `MediaEditModal`. Info detail = overlay full-width (toggle ikon tiga titik). Card media: desktop = hover overlay (eye/link/trash); mobile = ikon tiga titik → **bottom sheet** slide-up (style sama dgn `data-notif-sheet` publik: backdrop `bg-zinc-950/40 blur`, `max-h-[80vh] rounded-t-2xl bg-white dark:bg-zinc-900`, item `px-4 py-3 border-b`; animasi `animate-sheet-up`/`animate-fade-in` di `app.css`).
- **Watermark foto publik (GD bake + cache)**: `WatermarkService` + route `GET /watermark/{hash}` + helper `watermark_url()`. Hash = `sha1(source)`, tabel `watermarked_assets`, file cache `storage/app/watermarked/{hash}.{ext}` (owner apache). Teks dinamis dari `siteName()` (miring -22°, alpha 105, font NotoSans variable). Dipakai di `gallery/index`, `gallery/show`, `landing/index`, `about/index`. Pre-generate: `php artisan media:watermark` (35/35 OK). Ganti teks watermark → hapus cache + `--fresh`. Skip placeholder/`.svg`. Tidak 100% anti-unduh (screenshot/hotlink asli WP).
- **Perubahan visual lain**: blog search (input `type=text inputmode=search` + `pl-12`, ikon 18px), CTA slot kosong grid unggulan (`route('services')`/`route('booking')`), header publik (`@guest` tombol Pesan/Pesan Sekarang, FAQ dihapus dari menu mobile), notifikasi (bottom sheet mobile + dropdown desktop, filter `?category=`, `clearAll`, ikon pesan dihapus dari header dashboard), IP detection `ResolveClientIp` (CF-Connecting-IP → X-Forwarded-For → X-Real-IP, prepend di `bootstrap/app.php`).

