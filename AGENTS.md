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
9. **Dokumentasi (wajib)**: setiap penambahan/perubahan fitur WAJIB dicatat di AGENTS.md (section "Hasil Sesi") — tulis apa yang diubah, file kunci, konvensi baru, bug yang ditemukan, dan cara verifikasi — SEBELUM commit.

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
- **Dokumentasi WAJIB sebelum commit**: setiap penambahan/perubahan fitur WAJIB menambah/memperbarui catatan sesi di AGENTS.md (bagian "Hasil Sesi"): ringkasan perubahan, file yang disentuh, konvensi/bug yang ditemukan, cara verifikasi. Commit dokumentasi ikut dalam commit fitur.
- **Git WAJIB untuk setiap fitur**: setiap penambahan/perubahan fitur yang selesai & sudah build+verifikasi sukses, agent HARUS `git add -A`, `git commit` (pesan ringkas sesuai perubahan), lalu `git push origin main`. Jangan menunggu diminta.
- Remote: `origin` = `https://github.com/assasakiy/imagery-photography.git` (repo PRIVAT).
- Periksa `git status` sebelum commit; jangan commit `.env`, dump SQL (`storage/backups/`), file storage, atau credential (sudah di-ignore).
- Jangan ubah file tanpa instruksi; ikuti konvensi yang ada.
- Produksi (APP_DEBUG=false) — backup DB & storage sebelum migrate/seed besar.

## 12. Hasil Sesi 2026-08-02 (verifikasi & perbaikan)
- **Media delete diperbaiki**: `Route::apiResource('media', ...)` meng-generate param `{medium}` (singularisasi Laravel) yang TIDAK cocok dengan parameter `$media` di controller → model binding gagal (instance kosong, delete diam-diam tidak jalan). Solusi: `->parameters(['media' => 'media'])`. Jika menambah resource `media` lagi, wajib ulangi ini.
- **`LandingContent::setValue`** sekarang mempertahankan `group` saat update (sebelumnya update `updateOrCreate` menimpa group → `hero_subtitle` pindah ke `general`).
- **`MediaLibrary`** butuh `protected $fillable = ['id'];` agar `firstOrCreate(['id' => 1], ...)` tidak memicu MassAssignmentException.
- **Landing images** disimpan di koleksi `library` bersama pada `MediaLibrary` (media id), ref di `landing_contents` = `media:{id}`. `reset_images` hanya mengosongkan key — **media jadi orphan** (baris & file tidak ikut terhapus). TODO: hapus media saat reset.
- **Client access token single-use by design**: scope `valid()` = `used_at IS NULL` + belum expire; `used_at` di-set pada klik pertama. Klik kedua → redirect `/login` (burned). Pertimbangkan multi-use jika klien perlu login ulang.
- **Semua flow diverifikasi via curl** (`--resolve imagery.assasakiy.my.id:8081:127.0.0.1`, cookie jar `-b/-c`, header `X-XSRF-TOKEN` dari cookie decrypt): media upload/list/delete, portfolio upload→media & paste-URL→reset media, landing content/upload/reset, client create + project create + token access → dashboard klien (role `client`, perms `view-projects`), admin `/api/user` (9 perms).
- DB saat ini dalam keadaan seed bersih: 35 portfolio, 2 roles, 9 perms, 0 project/client/message/payment, media table kosong.

## 13. Sesi 2026-08-02 (lanjutan: blog/FAQ/halaman/booking, kredensial klien, CSRF Laravel 13)
- **CSRF Laravel 13 (`PreventRequestForgery`)**: `getTokenFromRequest` TIDAK lagi fallback ke `session()->token()` saat header `X-XSRF-TOKEN` absen (beda dgn `ValidateCsrfToken` lama). Browser lolos via `Sec-Fetch-Site: same-origin` (`hasValidOrigin`) dan/atau header token. Untuk test curl/Python: WAJIB kirim header `X-XSRF-TOKEN` (nilai = cookie `XSRF-TOKEN` yang di-URL-decode) pada SEMUA POST/PUT/PATCH/DELETE, termasuk yang tanpa body, plus opsional `Sec-Fetch-Site: same-origin`. Tanpa header → 419 walaupun token benar.
- **`Store::regenerate()` di Laravel 13 = migrate + `regenerateToken()`** (token CSRF ikut dirotasi). `Auth::login()` memanggil `session->regenerate(true)` internal → token berubah SETELAH `PreventRequestForgery` menangkap token lama → cookie `XSRF-TOKEN` pada response login SELALU stale untuk session baru. SPA menyinkronkan ulang otomatis lewat GET berikutnya (AuthProvider `refresh()` GET `/user` re-set cookie) + interceptor 419 di `resources/js/admin/api.js` (refresh csrf-cookie lalu retry sekali).
- **Hapus `$request->session()->regenerate()` redundan** di `AuthController@login` & `verifyOtp` (duplikat dari regenerate internal `Auth::login`).
- **`ensureClientUser` sekarang reset password** user klien yang sudah ada saat proyek baru dibuat (sebelumnya early-return → password di creds tidak pernah terpasang untuk klien existing). Desain: satu akun klien untuk semua proyeknya.
- **Content pages & blog**: routes web `tentang|faq|privacy|terms|booking|blog` + controller `AboutPageController` (pakai `route('gallery')`, bukan `gallery.index`), `FaqController`, `PageController` (by slug), `BookingController` (simpan `contact_messages` type `booking`), `BlogController` (web). `resources/views/{about,faq,page,booking,blog}/`.
- **API blog/faq/pages/settings**: routes di `routes/api.php` di bawah `permission:manage-*`. `Route::apiResource('blog',...)->names('api.blog')` — WAJIB `names()` agar tak bentrok dgn route web `blog.show`. Blog tags dikirim sebagai JSON-encoded string (`["a","b"]`), di-decode `decodeTags()`. Publikasi via `applyPublishing()` (set `published_at` saat publish baru).
- **`POST /api/projects`**: terima `client_mode=existing|new`, inline `client_name/phone/email/notes` (nullable, `required_without:client_id`), field `type` (event/wedding/…) & `event_date`, `status` WAJIB (`pending` default dari SPA). Response `{project, credentials}` berisi `login_url`, `email`, `password`, `access_url`. `POST /api/projects/{project}/regenerate-credentials` untuk reset token (opsional reset password) — dipakai juga saat create untuk klien existing.
- **`/access/{token}`**: klien terotentikasi → redirect `/dashboard`; belum login → `/login`.
- **Skrip test di `/home/opc`**: `spa_test.py` (siklus login/logout penuh), `final_test.py`, `access_test.py` — Python CookieJar meniru browser (harus unquote nilai cookie `XSRF-TOKEN`). `/etc/hosts` sudah berisi `127.0.0.1 imagery.assasakiy.my.id`. `/tmp/opencode` TIDAK writable (Permission denied) — gunakan `/home/opc`.
- **F2 Settings**: `GET/PUT /api/settings` → `brand_color`, `google_auth_enabled`, `google_client_id/secret` (masked •, skip save), `google_redirect_url` di UI `Settings.jsx`. Seeder `StaticContentSeeder` (pages 2, faqs 5, blog-cats 3) sudah jalan.

## 14. Sesi 2026-08-02 (role owner, landing/settings owner-only, team & review, media refactor)
- **Role `owner`** ditambahkan (tertinggi, satu-satunya pengelola branding/landing/settings & pengundang admin). `User::isOwner()/isStaff()`; `role:owner` middleware untuk `/api/team*`, `/api/landing`, `/api/settings`; owner dianggap admin untuk `route:list`.
- **Migrasi/seeder**: `create_team_members_table`, `create_reviews_table`, `add_phone_to_users_table`, seeder role+permissions+owner (`owner@imagery.my.id`), landing contents, team members, reviews.
- **API tim**: `TeamController::store` membuat `User` role `admin` + kirim `AdminInvitationMail`/WhatsApp; `TeamMemberController` (owner-only) + `import` dari akun admin. `TeamMember` punya `photo_url`, `bio`, `social_*`, `resolvePhotoUrl()` (menerima `media:{id}` atau URL).
- **API review**: klien (permission `submit-reviews`) kirim `POST /api/reviews` (status `pending`); admin/owner setujui/tolak via `PATCH /api/reviews/{id}/status`; muncul di landing bila approved.
- **Media refactor**: `Portfolio.jsx`, `Blog.jsx`, `Landing.jsx` memakai `MediaPicker.jsx` (library/upload/URL), submit `media_id`/`media:{id}`; backend `PortfolioController`, `BlogController::attachMedia()`, `LandingController` simpan nilai mentah. `AssetResolver::landingImage()` me-resolve `media:{id}`.
- **`NotificationService::toAdmins`** = role `admin|owner` (in-app).
- **Blade publik baru**: `layouts/app.blade.php` ditulis ulang (header sticky + nav underline + login/bell/dropdown + mobile menu + favicon dinamis + footer), `partials/social-icon.blade.php`, konten landing (artikel, review, FAQ, tombol Selengkapnya), halaman about (timeline, grid tim, sosmed).
- **Kredensial pemilik**: `owner@imagery.my.id` / `owner123` (password diubah 2026-08-04). Backup DB lama `storage/backups/pre-owner-20260802-202238.sql`.

## 15. Sesi 2026-08-02 (perbaikan UI header, halaman profil modern, preferensi notifikasi, hapus akun)
- **Bug "Lihat Situs"**: `Link to="/"` di dalam SPA di-route-balik ke `/dashboard` (route `*`). Ganti jadi `<a href="/">` (sidebar & logo mobile di `Layout.jsx`). Hati-hati: jangan pakai `Link`/`<Route path="/">` untuk keluar SPA.
- **StrictMode crash `l is not a function`**: `useEffect(load, [])` dengan `load` arrow-**expression** (return Promise) memicu React memanggil hasil effect sebagai cleanup → `TypeError`. Pola aman: `const load = () => { ... }; useEffect(() => { load(); }, deps);`. Sudah diperbaiki di `Team.jsx` & `Reviews.jsx` (4 tempat). Semua `load` lain sudah blok-body.
- **Header dashboard** (`Layout.jsx`): tombol dark dipindah ke dekat lonceng; dropdown profil disederhanakan (hanya **Profil Saya + Keluar** saat di dashboard); ikon chevron berputar 180° saat dropdown terbuka; avatar user ditampilkan bila ada.
- **Header publik** (`app.blade.php` + `app.js` + `app.css`): tombol dark dipindah dekat notifikasi (urutan bell → dark → profil); dropdown pintar (saat di landing tampil **Dashboard + Keluar**, tidak ada lagi "Lihat Situs"/"Profil Saya"); chevron-down (sembunyi di mobile, hanya avatar); dropdown animasi turun pakai `.dropdown-panel`/`.is-open` di `app.css`.
- **Kolom `users` baru** (migrasi `..._211000_add_profile_columns_to_users_table`): `bio`, `avatar_url`, `social_facebook`, `social_instagram`, `social_tiktok`, `social_whatsapp`, `notif_inapp`, `notif_email`, `notif_whatsapp` (bool default true). `User::resolveAvatarUrl()` (dukung `media:{id}`).
- **`ProfileController`** diperluas: `show`/`update` menangani bio, avatar, media sosial, preferensi notifikasi + kata sandi; **`DELETE /api/profile`** = hapus akun (wajib password, role owner diblokir, session di-logout, `teamMember`/`client` ikut terhapus).
- **`NotificationService`** menghormati preferensi user: `inApp()` skip `notif_inapp=false`; `email()` menerima `User` dan skip `notif_email=false`; `whatsapp(..., ?User $forUser)` skip `notif_whatsapp=false`. Caller diupdate (`PaymentController::confirm`, `ProjectController::update`, `TeamController::store`).
- **`ProfileSettings.jsx`** ditulis ulang jadi halaman profil modern: hero card (cover + foto profil via `MediaPicker`, tombol hapus foto), tab **Profil / Media Sosial / Kata Sandi / Preferensi**, ringkasan akun, dan **Zona Berbahaya** (hapus akun dengan konfirmasi password). Simpan memanggil `AuthContext.refresh()` agar avatar/nama di topbar ikut ter-update.
- **`AuthController::userPayload`** kini menyertakan `avatar` & `bio`; `TeamMemberController::import` menyalin `bio`/`photo_url`/`social_*` dari user.
- **Verifikasi curl**: login owner, GET/PUT profile (bio/sosmed/pref/avatar `media:{id}`), filter notif (notif_inapp=false → notifikasi in-app tidak terkirim), hapus akun (password salah 422, benar `{ok:true}`), owner tidak bisa dihapus. Test data dibersihkan.

## 16. Sesi 2026-08-03/04 (WhatsApp schema-driven + adapter, swift-button, SELinux/GoWA, Tiptap, favicon)
- **`WhatsAppDriverRegistry`** = sumber kebenaran schema & driver (`CLASSES`, `SCHEMAS`): key, name, description, fields[] (key/label/type/required/default/placeholder/help). Daftar driver: GoWA (base_url, username+password basic auth, device_id, endpoint_send `/send/message`, endpoint_status `/app/devices`), Evolution API (base_url, api_key header `apikey`, instance), WAHA (base_url, api_key header `X-Api-Key`, chatId `@c.us`), Fonnte (api_token, `Authorization`, asForm), Twilio (account_sid+auth_token+from, `whatsapp:+`+digits), Custom REST (method/base_url/endpoint/auth_type none|bearer|basic|api_key/header_key/header_value/body_template JSON `{{phone}}`/`{{message}}`), Meta Cloud API (access_token, phone_number_id, api_version v21.0).
- **`WhatsAppSendResult`** (hasil ter-normalisasi): `{success, provider, message, provider_message_id, raw}`. Semua driver memetakan respons provider ke bentuk ini; `WhatsAppManager::send()` return result; `NotificationService::whatsapp()` tetap `bool` (`.success`). **`testWhatsapp`** di `SettingsController` kini melaporkan `result->message` (ramah, bukan raw `cURL error`). Driver TIDAK melempar exception transport — `WhatsAppSendResult::fromException()` menghasilkan pesan ramah.
- **Bug swift-button persist**: `set()` asinkron membuat `save()` membaca nilai lama (stale). Fix: `save(keys, overrides={})` memakai `overrides[k] ?? form[k]`; toggle channel email/WA mengirim nilai eksplisit. `Settings.jsx`: card SMTP & WA pakai swift Toggle (`notif_email_enabled`/`notif_wa_enabled`) yang auto-save; form hanya tampil saat on; card Notifikasi (email/WA) toggle auto-save + event list & tombol Simpan hanya saat enabled.
- **VM tanpa IPv6** → `https://gowa.assasakiy.my.id` resolve ke IPv6 Cloudflare (`2606:4700:...`) → koneksi IPv6 gagal instan. Solusi: paksa IPv4 `->withOptions(['curl' => [CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4]])` di semua driver WhatsApp.
- **ROOT CAUSA koneksi speak php-fpm gagal "after 0 ms"**: SELinux **Enforcing** dan host php-fpm (systemd) berjalan di domain **`httpd_t`** dengan boolean **`httpd_can_network_connect` = off** → `connect()` ditolak instan. CLI (`unconfined_t`) dan php-fpm container (`spc_t`) tidak kena. **Fix: `sudo setsebool -P httpd_can_network_connect on`** (persisten). Gejala pembeda: curl/CLI bisa, web/php-fpm tidak, selalu "after 0 ms".
- **GoWA base_url JANGAN diberi `:3000`**: port 3000 = internal GoWA; `gowa.assasakiy.my.id` di belakang Cloudflare yang hanya mem-proxy 80/443. Reverse-proxy sudah memetakan :443 → GoWA :3000, jadi `base_url` cukup `https://gowa.assasakiy.my.id`. Respons sukses GoWA: `{"code":"SUCCESS",...,"results":{"message_id":...}}`; `ERROR`/`UNAUTHORIZED` → gagal.
- **Tiptap v3 duplikat extension**: `StarterKit` versi 3 sudah menyertakan `link` & `underline`. Menambahkan `Link`/`Underline` eksplisit → warning "Duplicate extension names". Fix `RichEditor.jsx`: `StarterKit.configure({ link: false, underline: false })`, tetap pakai ekstensi eksplisit agar opsi `Link.configure({...})` berlaku.
- **Mixed-content http:// favicon**: `AssetResolver::resolveImageValue()` kini menaikkan `http://` → `https://` pada semua asset URL (aman untuk situs HTTPS). `APP_URL` sudah https (asset() otomatis https untuk default).
- **Model `Setting` TIDAK clear cache `runtime_settings` (1 jam)**; hanya `SettingsController::update` yang memanggil `RuntimeSettings::forget()`. Saat mengubah setting via tinker langsung, WAJIB panggil `app(RuntimeSettings::class)->forget()` lalu verifikasi; kalau tidak, `get()` masih membaca nilai cached lama.

## 17. Sesi 2026-08-05 (alur Git + dokumentasi wajib)
- **§9 & §11 diperbarui**: setiap penambahan/perubahan fitur WAJIB (a) memperbarui dokumentasi di AGENTS.md (bagian "Hasil Sesi", ditulis SEBELUM commit) dan (b) `git add -A` → `git commit` → `git push origin main` tanpa menunggu diminta. Repo `origin` bersifat PRIVAT (diubah 2026-08-05 via Settings → Change visibility).
- **Perubahan visual**: blog search (input `type="text" inputmode="search"` + `pl-12`, ikon 18px `pointer-events-none`), CTA slot kosong grid unggulan (`@for` `max(0,5-count)` → `route('services')`/`route('booking')`), header publik (`@guest` pada tombol Pesan/Pesan Sekarang, FAQ dihapus dari menu mobile, profil pindah ke menu mobile @auth, dropdown profil `hidden md:block`), notifikasi (bottom sheet mobile + dropdown desktop, `?category=` filter, `clearAll`, ikon pesan dihapus dari header dashboard), IP detection (`ResolveClientIp` middleware: CF-Connecting-IP → X-Forwarded-For → X-Real-IP, timpa REMOTE_ADDR, di-prepend di `bootstrap/app.php`).
- **Bug tombol "Kembali ke beranda" di `/login`**: dipakai `<Link to="/">` → di-intercept react-router → route catch-all `*` → `<Navigate to="/dashboard">` → belum login → kembali ke `/login` (tampak "tidak bisa" ke home). Fix `Login.jsx`: ganti ke `<a href="/">` (full page load, keluar SPA) + hapus import `Link`. Verifikasi: bundle berisi `children:...('a',{href:'/',...})`. Pola sama dengan bug "Lihat Situs" di §15.
- **Bug gambar portofolio tidak tampil di dashboard**: `PortfolioController::index()` pakai `paginate()` mentah → JSON TIDAK memuat `cover_url`/`has_local_media`/`media_id` (hanya di `serialize()`), sehingga `item.cover_url` = `undefined` → `<img src={undefined}>` rusak (terutama item bersumber `image_url`/WordPress). Fix: index() me-`transform()` koleksi lewat `serialize()` (pagination structure tetap). Terverifikasi via tinker: `cover_url` kini ada = URL WordPress. Pola yang sama perlu diperiksa pada controller API lain yang memakai paginate mentah saat memerlukan field aksesor.
- **Halaman Media dashboard: lihat + edit nama**: `MediaController` kini punya `update()` (`PUT/PATCH /api/media/{media}`, validate `name` required, log audit `media.updated`, route `->only([...,'update',...])`). `Media.jsx`: hover card kini 3 aksi (Lihat → `openView`, Salin URL, Hapus); modal "Pratinjau Media" (wide) menampilkan pratinjau besar (max-h-[45vh] object-contain / ikon utk non-gambar), form **Nama** yang bisa diedit (simpan via PUT, tombol disabled saat sama), info Nama File/Tipe/Ukuran/Diunggah, tombol **Buka** (new tab), **Salin URL**, **Simpan** (ikon `check` — Icon `save` tidak ada di set!). Rename mengubah field `name` (label/alt), BUKAN `file_name` fisik di disk. Terverifikasi via tinker (rename id 14 lalu restore). `formatSize()` helper lokal (B/KB/MB).
- **Popup media reusable**: `MediaViewModal.jsx` (view-only: pratinjau + info + Buka/Salin URL/Edit) dan `MediaEditModal.jsx` (edit-only: ganti nama via PUT, sinkron `name` saat item berubah via `useEffect([item?.id])`) di `resources/js/admin/components/`. `Media.jsx` kini hanya memakai dua komponen ini (tidak ada modal inline). Komponen bisa dipakai ulang di halaman dashboard lain.
- **MediaViewModal: info tersembunyi**: detail (Nama, Nama File, Tipe, Ukuran, Diunggah) kini tersembunyi; hanya tampil saat tombol **Info** ditekan (toggle `showInfo`, reset per item via `useEffect([item?.id])`). Tombol Info ada dua: overlay bulat di pojok kanan-atas pratinjau (aktif berwarna brand saat terbuka) dan tombol "Info" di baris aksi.
- **MediaViewModal: info jadi dropdown**: tombol "Info" di baris aksi DIHAPUS — cukup ikon tiga titik di pojok kanan-atas pratinjau. Detail ditampilkan sebagai **dropdown** ("Detail File") di bawah ikon, bukan di bawah gambar; tertutup saat klik di luar (`useEffect` + listener `mousedown`, guard `infoRef.contains`) atau ganti item. Baris aksi kini hanya Buka/Salin URL/Edit.
- **MediaViewModal: info full-width overlay**: dropdown w-64 yang mengarah ke bawah ternyata TERPOTONG oleh `overflow-hidden` kontainer pratinjau (terlihat "tertutup"). Fix: info kini **overlay full-width** `absolute inset-0` menutupi seluruh gambar (bg-black/85 + backdrop-blur, `max-w-xl mx-auto`), di-toggle ikon tiga titik (z-20 di atas overlay). Tidak lagi mengarah ke bawah di luar gambar → tidak terpotong. Listener klik-di-luar & `infoRef` dihapus.
- **Modal fullscreen + MediaViewModal full layar**: komponen `Modal` di `ui.jsx` mendapat prop `fullscreen` (kontainer `h-full w-full` tanpa rounded/border, header berbatas bawah, body `min-h-0 p-4 sm:p-6`; non-fullscreen tidak berubah). `MediaViewModal` kini pakai `fullscreen` — popup view membuka **full layar** di mobile & desktop, gambar `max-h-[65vh]`.
- **MediaViewModal tombol di bawah**: layout fullscreen diubah jadi flex-column — shell modal `flex flex-col`, body `flex min-h-0 flex-1 flex-col overflow-y-auto`; konten view: kontainer gambar `flex-1 min-h-0` (img `h-full w-full object-contain`) dan baris tombol Buka/Salin URL/Edit **menempel di bawah** (`shrink-0`). Header tetap di atas.
- **Media card: menu tiga titik (mobile)**: aksi hover (eye/link/trash) hanya muncul di desktop. Di mobile kini ada tombol **tiga titik** di pojok kanan-atas setiap card (selalu terlihat) yang membuka dropdown aksi **Lihat / Salin URL / Hapus**. Dropdown diposisikan `fixed` dari `getBoundingClientRect` tombol (`x=rect.right-176` clamp 12, `y=rect.bottom+6` clamp bawah layar) karena card punya `overflow-hidden` (menu di dalam card pasti terpotong); ditutup saat klik di luar (`menuRef` + mousedown) atau toggle ulang. Hover overlay desktop tetap dipertahankan.
- **Media card: tiga titik HANYA mobile + droptop**: tombol tiga titik kini `md:hidden` (hanya mobile); overlay hover jadi `hidden md:flex` (hanya desktop, mencegah tap tidak sengaja di mobile). Menu di mobile dibuka **ke atas (droptop)**: `y = max(12, rect.top - 138)`, tetap right-aligned (`x = rect.right - 176`).
- **Media card: droptop = bottom sheet**: maksud "droptop" diklarifikasi = menu **keluar dari bawah layar ke atas** (bottom sheet). Menu dropdown fixed dihapus; kini tombol tiga titik (mobile) membuka **bottom sheet** (`fixed inset-x-0 bottom-0 rounded-t-2xl`, backdrop `bg-black/50`) berisi header (nama + nama file + X), aksi **Lihat / Salin URL / Hapus** (ikon besar), dan tombol **Batal**. Animasi slide-up ditambah di `app.css` (`@keyframes sheet-up`, class `animate-sheet-up`) + `animate-fade-in` untuk backdrop.
- **MediaViewModal: tombol Buka dihapus** — view sudah full layar, baris aksi kini hanya Salin URL + Edit.
- **Watermark foto publik (GD bake + cache)**: untuk melindungi file asli, bukan hanya tampilan. `app/Services/WatermarkService.php`:
  - `publicUrl($source)` → `sha1($source)` sebagai `hash`, upsert tabel `watermarked_assets` (hash unique, source, mime_type, generated), return `url('/watermark/{hash}')`. Non-raster/skip: placeholder (`/storage/placeholders/`) & `.svg` → balikan URL asli.
  - `serve($hash)` → `WatermarkController@show` (route web `GET /watermark/{hash}`): lock `Cache::lock('watermark:'.$hash,120)` (driver cache = database), pakai file cache `storage/app/watermarked/{hash}.{ext}` (permission apache), bila belum ada → generate. Respons `response()->file` + `Cache-Control: public, max-age=2592000, immutable`. Gagal/unsupported → redirect 302 ke `source`.
  - `generate()`: sumber = path lokal (resolve `/storage/` → `storage_path('app/public/')`, atau public_path bila host cocok APP_URL/request) atau download curl (IPv4, timeout 30, UA ImageryBot/1.0) untuk URL eksternal WordPress; `imagecreatefromstring`; watermark teks miring **-22°** semi-transparan (alpha 105, ukuran font `max(24, min(w,h)*5.5%)`) via overlay truecolor+alpha + `imagettftext` + `imagecopy`; font `/usr/share/fonts/google-noto-vf/NotoSans[wght].ttf` (variable font, terbukti jalan dgn imagettftext; fallback RedHatText). Output jpeg(92)/png/webp(90). Teks = `RuntimeSettings::siteName()`.
  - **Perubahan di halaman publik**: `watermark_url($x->cover_url)` dipakai di `gallery/index`, `gallery/show` (utama + related), `landing/index`, `about/index`. `$categoryImages` di show.blade UNUSED (lightbox lama, dibiarkan). Verifikasi: command `php artisan media:watermark` → 35/35 OK; pixel-check GD banding asli vs watermark (mean diff band tengah 7.25, max 144); `/gallery`, `/gallery/{slug}`, `/`, `/tentang` memuat URL `/watermark/{hash}`; curl serve 200 image/jpeg. Cache dir `storage/app/watermarked` di-chown `apache:apache 775` agar generate via web (php-fpm httpd_t) bisa menulis. Catatan: tidak 100% anti-unduh (screenshot/hotlink URL asli WP tetap mungkin).
