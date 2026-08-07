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

## 10b. Konvensi Halaman Bertab (folder per halaman)
Halaman dashboard yang punya beberapa tab **WAJIB** dipisah ke folder `pages/<nama>/`: `index.jsx` (state global + tab bar + render tab aktif), file per tab (`<Tab>Tab.jsx`), dan `constants.js` (konstanta/helper bersama). `pages/<Nama>.jsx` cukup re-export `export { default } from './<nama>';`. Kontrak antar-tab: index menyusun objek `ctx` (semua state & handler) lalu render `{tab === 'x' && <XTab {...ctx} />}`; tiap tab destructure props yang dipakai dari `ctx`. Berlaku utk halaman baru & refactor bertahap halaman lama (Settings sudah, AuditLog/Services/Notifications/Media menyusul).

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

## 13. Sesi Terbaru (2026-08-07) — Alur Pesanan: Booking → Selesai
- **Booking jadi entitas sendiri** (`bookings`): booking_no otomatis `BK-{ABBR}-{YYMMDD}-{0001}` (ABBR = inisial nama situs, dinamis dari `RuntimeSettings::siteName()`, daily reset; `Invoice::nextNumber()` sama `INV-{ABBR}-...`). Status: `pending|confirmed|rejected|cancelled|expired|converted`. **`cancelled` = dibatalkan klien, `rejected` = ditolak admin** (dipisah; `CustomerController@cancelBooking` set `cancelled`, `BookingApiController@reject` set `rejected`). Alur admin: pending → **Konfirmasi** (`POST /bookings/{id}/confirm` → `confirmed`) → lalu **Buat Proyek** (`/accept` → `converted` + project `scheduled` + system update). GOTCHA: `Booking::nextNumber()` SEMPAT pakai `withTrashed()` padahal model TANPA SoftDeletes → `BadMethodCallException` (sudah dihapus).
- **Project status 6**: `scheduled|shooting|editing|awaiting_payment|completed|archived` + `STEP_ORDER` (alur stepper). **`awaiting_confirmation` diganti `awaiting_payment`** (migration konversi data). Label tampil: **Preview Tersedia** (di `Project.php` STATUS_LABELS, `Projects.jsx` statusOptions, `Dashboard.jsx` map, `ProjectDetail.jsx` STEPS).
- **Waktu acara (presisi transisi)**: `event_start` & `event_end` (datetime) di **bookings** & **projects**; kolom `start_date`/`end_date` project DROP. `event_date` dipertahankan (turunan). Auto transisi (`Project::processDueTransitions(?Project $only)`):
  - scheduled→shooting saat `event_start + 10 mnt` (`Project::graceMinutes()` = setting `event_grace_minutes`, default 10).
  - shooting→editing saat `event_end + 10 mnt`.
  - awaiting_payment→completed saat `isPaid()`.
  - Dipanggil **lazy** di `ProjectController@index`(staff) & `@show` (tanpa cron wajib) + **command `projects:process-status`** (scheduler tiap 5 mnt, cron optional). `PaymentController@confirm` → langsung `advanceStep('completed')` saat lunas.
- **Stepper alur (ProjectDetail.jsx)**: pengganti dropdown status. Forward-only (`Project::advanceStep($target)`; backend tolak selain step berikutnya; completed wajib `isPaid`). Tombol "Lanjut ke tahap berikutnya" via `POST /projects/{id}/advance`. Tab Timeline + **Progres Editing** (total & sudah dikerjakan → note) utk klien.
- **Form konversi Booking→Proyek**: popup di `Bookings.jsx` (Tombol "Buat Proyek") kini MENCerminkan form project (tanpa bagian pilih klien — client sudah dari booking): Nama Project full, Paket dropdown (`custom` = Layanan Satuan + checklist), Tanggal Acara|Waktu Mulai|Waktu Selesai, Deskripsi, Harga|Status, DP full. `startAccept` prefill dari booking (event_start/end `replace('Z','').slice(0,16)`). `handleAccept` kirim `package_id` null bila custom; `BookingApiController@accept` sekarang terima `package_id`, `dp_amount`, `status`; paket prioritas form → fallback paket booking; invoice+dibuat saat DP diisi (status `awaiting_dp`).
- **Invoice & DP**: kolom `dp_amount`, status `awaiting_dp|unpaid|partial|paid` (`Invoice::refreshStatus()` = paid→isPaid, awaiting_dp→dp required & belum lunas, partial→sudah bayar). Create project: isi **DP/uang muka** opsional → invoice dibuat saat create (`awaiting_dp`); kosong → invoice ditunda, dibuat saat step "Preview Tersedia" (`ProjectController` + `createInvoice`). **Preview selalu terbuka utk klien; download HD hanya saat lunas** (`downloadFile` gate `isPaid`). Upload file kini `gallery_status` default `preview_ready` (tanpa tombol manual Set Preview/Rilis).
- **Booking form: paket & layanan satuan**: dropdown paket + opsi **"Layanan Satuan"** (value `custom`) → checklist multi layanan satuan → backend jumlah harga (`BookingController@store` & `CustomerController@storeBooking`). `package_id` required kecuali custom+`service_ids[]`. Endpoint paket utk klien: `GET /customer/packages` (bukan `/packages` yg role admin) + `GET /customer/services`.
- **Layanan satuan: kolom `name` DROP** — cukup `event` (label form "Event / Nama"). Update: `Service.php` (fillable/slug), `ServiceController` (`event` required), `PackageController` & `BookingApiController::snapshot` (`$svc->event`), `Package::summary` grouping `event`, `Services.jsx`, `ServiceSeeder`. Migration `drop_name_from_services_table`.
- **Project: kolom `type` DROP** (metadata mati): migration `drop_type_from_projects_table`, `ProjectController` (rule+assign), `BookingApiController@accept`, `Projects.jsx`, `ProjectDetail.jsx` (ganti blok Jenis → tampil nama Paket). `submitReview` jangan kirim `project.type` (sudah `project.package?.name`).
- **Halaman Media & Booking toolbar**: pola konsisten = kiri tab filter (pill minimalis, ikon saja di mobile `hidden sm:inline`), kanan search `flex-1` (tinggi samakan `py-1.5`), pembatas `border-b border-line pb-4 mb-4`. Media tetap "kiri tab / kanan tombol Pilih" (bukan search).
- **GOTCHA React**: semua `useState`/hooks SEBELUM early return (`if (loading) return`) — pernah crash `Minified React error #310`. Import utilitas UI wajib lengkap (`formatRupiah`/`formatDate`/`EmptyState` pernah terlewat → `ReferenceError`). Input `type=date`/`datetime-local` butuh format bersih (API ISO `...T00:00:00Z` → `.split('T')[0]`/`.replace('Z','').slice(0,16)`).
- **GOTCHA backend**: accessor `User::name` tidak otomatis masuk JSON → `$appends` + eager `profile`; relasi user di audit/token pakai `withTrashed()`. Eager load relasi wajib terpisah (`user.profile`), jangan `user:columns` yg menabrak kolom dihapus.
- **Redesign ProjectDetail.jsx (filmstrip)**: stepper jadi bar gelap (`bg-zinc-900`) dengan node bulat per tahap — done = `bg-emerald-500`+centang, active/current = `bg-brand-600`, upcoming = `bg-zinc-700`, terpilih (klik lihat panel lama) = outline `ring` putih. Panel per tahap (bukan tab) dengan **tombol aksi admin di KANAN BAWAH** (`PanelFooter` `justify-end`): Dijadwalkan → "Mulai Pemotretan"; Pemotretan → upload bukti + "Tandai Pemotretan Selesai"; Editing → progress bar (parsing `Proses editing: x/y` → `%`) + "Lanjut ke Preview Tersedia"; Preview Tersedia → kartu invoice ringkas + "Bayar di Halaman Tagihan" (klien, ke `/dashboard/client-invoices`); Selesai → checklist "Pembayaran Lunas" + "Buka Halaman Unduh" (→ `/dashboard/preview/{order_no}`) + "Arsipkan"; Arsip → "Pulihkan" (hanya saat `status==='archived'`). Form pembayaran dihapus dari ProjectDetail.
- **Archive/restore konsisten dengan stepper**: `ProjectController@archive` kini set `archived_at` + `status='archived'` + system update; `restore` set `archived_at=null` + `status='completed'`. `Project::advanceStep` tambah case `archived` (set `archived_at`).
- **ClientInvoices.jsx (modal tagihan)**: tombol "Lihat Tagihan" buka `Modal` (wide) berisi kartu detail (Pesanan/Diterbitkan/Total/Sisa), status badge, link "Buka Detail Pesanan", **form pembayaran manual** (`POST /projects/{id}/payments`, amount prefilled sisa, upload bukti, catatan) + riwayat pembayaran (diambil via `GET /projects/{id}` → `payments`). Semua tombol aksi panel ProjectDetail rata kanan bawah (bukan kiri).
- **Panel Editing ("Progres Editing")**: progres foto & video dipisah — bar + form `Total foto/Foto sudah diedit/Total video/Video sudah diedit` hanya tampil utk media yg ada di paket (deteksi dari `pricing_snapshot.items[].media`; item tanpa media → tampil keduanya). Kolom DB baru `projects`: `photo_total|photo_done|video_total|video_done` (unsignedInteger default 0) — migration `add_edit_progress_to_projects_table`; disimpan via `PUT /projects/{id}` (validation + fillable). Riwayat pembaruan = update `message` berawalan `Proses editing:` (fmtLog `18 Agu, 09:12`); tombol tambah catatan memakai prefix itu. Tombol footer "Unggah file & lanjutkan ke Preview" disabled sampai semua media yg ada `done >= total` (footnote "saat ini X/Y"). Snapshot `items` kini menyimpan `media` (ProjectController store/update + BookingApiController::snapshot); snapshot lama di-backfill via tinker dari `package.services` (urut sama dgn item).
- **Panel Pemotretan ("Sesi Berlangsung") & Dijadwalkan**: Dijadwalkan tombol aksi = **"Konfirmasi"** (konfirmasi mulai & pindah ke Pemotretan); panel gunakan grid ala popup booking (`grid grid-cols-2 gap-4`, label `text-xs text-ink-muted`), item **No. Pesanan** = `PSN-{order_no}` dari DB, upload bukti mulai sesi. Pemotretan: kartu "Bukti mulai sesi" (check + `Diunggah {date}` dari `files[0]`), upload box "Unggah bukti selesai sesi", textarea "Catatan dari lapangan" (opsional, di-log sbg update), tombol **"Konfirmasi selesai & lanjut ke Editing"** disabled sampai bukti selesai diunggah (session `endProof`).
- **Panel Preview & Invoice (awaiting_payment)**: per referensi — link-row (link pratinjau `accessTokens[0].url` = `/access/{token}` + tombol **Salin** via `navigator.clipboard` & **Buka** new-tab), switch **"Tampilkan & kirim link ke klien"** (kolom baru `projects.preview_released` boolean, migration `add_preview_released_to_projects_table`, toggle via `PATCH /projects/{id}/preview-release` + system update & audit), kartu **Invoice Terkirim · {number}** (amount `base_amount` + "Jatuh tempo {due_at}", hijau emerald), footnote alur Selesai. Riwayat pembayaran & `invMeta` dihapus dari panel (sudah ada di ClientInvoices/Invoices). Footer: "Lihat Preview Media" + klien "Bayar di Halaman Tagihan" + admin "Tandai Selesai" (disabled sampai `isPaid`).
- **Panel Proyek Selesai (completed)**: per referensi — checklist 2 item **"Preview telah dilihat klien"** (dari `accessTokens[].used_at` ada yg terisi → `previewSeen`) & **"Pembayaran invoice lunas"** (`isPaid`), badge `TERPENUHI`/`BELUM`; kartu emerald **"Dibayar Lunas · {tanggal}"** (tanggal = pembayaran confirmed terakhir / `completed_at`) + amount `price`; tombol "Unduh File Asli (Tanpa Watermark)" (→ previewHref) + admin "Arsipkan Proyek"; blok review klien dipertahankan di body.
- **Form disabled per tahap (ProjectDetail)**: konstanta `formLocked = isAdmin && !isCurrentStep` & `clientLocked = !isAdmin && activeIdx > currentIdx`. **Admin**: semua panel & form SELALU tampil, input/textarea/tombol di-`disabled` bila `formLocked` (belum sampai tahap itu). **Klien**: step yg belum tercapai (`activeIdx > currentIdx`) hanya menampilkan kartu pesan "Tahap ini belum dimulai..." (semua panel dibungkus `{clientLocked ? pesan : <fragmen panel>}`); subtitle panel Scheduled/Shooting/Editing kini `isAdmin ? teks-admin : teks-klien`; reminder "Ingatkan fotografer..." di panel Dijadwalkan khusus admin; Catatan Riwayat tetap admin-only. Route `/dashboard/projects/:id` tidak `adminOnly` → komponen harus aman utk klien.
- **Catatan Riwayat (timeline)**: form input manual log **DIBUANG** (state `updateText` & fn `addUpdate` ikut dihapus — tidak dipakai); kartu kini tampil utk **admin DAN klien** (tanpa gate `isAdmin`).
- **Kolom `location` pada projects**: lokasi & catatan kini terpisah. Migration `add_location_to_projects_table` (string nullable); fillable + rule `PUT`/`POST /projects` + sanitize `ContentSanitizer`; `BookingApiController@accept` copy `location` (prioritas form → `$booking->location`); backfill tinker utk proyek lama (dari `bookings.location` via `project_id`). Frontend: panel Dijadwalkan menampilkan **Lokasi** dan **Catatan** terpisah (Catatan `col-span-2` + `whitespace-pre-line`); form create/edit Project (`Projects.jsx`) & form konversi Booking (`Bookings.jsx`) kini punya field Lokasi.

### Sesi 2026-08-06 (ringkas, riwayat lengkap di git)
- Log Tautan → tab "Riwayat Tautan" di Audit Log (`GET /audit/links`); popup Detail User reusable (Clients & Team) + edit popup luas (foto/username/bio/status); form user minimal (name + email/WA); Booking publik auto-create akun + invite (`registerWithInvite`); ClientController = role client; ProfileController + `checkUsername`; invite expiry global (tab Keamanan); `auth:process-invites` cron 03:00; rate limit booking/forgot; `SoftDeletesWithWho` + Recycle Bin; notifikasi/OTP cek kanal AKTIF; magic link & recovery token multi-purpose; portal klien + role `subscriber`; bookmark & history polymorphic; retensi & arsip fondasi; Customer API; layanan master satuan + paket (`computedPrice`, snapshot) + kategori; media view-all + filter + hapus massal + pratinjau; watermark GD (bake+cache); konvensi modal header/body/footer (`footer` prop, submit `form=` attribute).

