# Analytics & Cookie Consent

Desain lengkap sistem analisis pengunjung + kepatuhan cookie (UU PDP) yang ditambahkan pada sesi 2026-08-20.

## Ringkasan

- Tracking **self-hosted** di Laravel (tanpa pihak ketiga): akun pengguna, perilaku (history events), dan kunjungan (page views).
- **Cookie consent** 3 opsi: Terima Semua / Tolak / Kustom, dengan penyimpanan preferensi.
- Tracking HANYA aktif jika cookie `cookie_consent` bernilai `all` (kepatuhan UU PDP).
- Data diagregasi harian (rollup) untuk performa & query chart.

## Skema Database

Migrasi: tabel `page_views`, `page_view_daily`, `cookie_consents` dibuat di squash `database/migrations/2026_08_10_000004_squash_reviews_security.php`. Folder `database/migrations/` hanya berisi 5 file squash (tidak ada file migrasi terpisah untuk analytics).

### `page_views` — kunjungan mentah
| Kolom | Keterangan |
|---|---|
| `path` | URL path (mis. `/gallery`) |
| `visitor_hash` | SHA-256(IP + APP_KEY) — IP tak disimpan mentah |
| `visitor_session` | UUID acak per sesi (cookie `visitor_session`, 30 hari) |
| `device_type` | `mobile` / `tablet` / `desktop` |
| `os` / `browser` | di-parse dari User-Agent |
| `referrer` | asal referal |
| `user_id` | nullable, terisi jika pengunjung login |
| `created_at` | timestamp kunjungan |

### `page_view_daily` — agregasi harian (rollup)
`id`, `date`, `path`, `views` (total), `visitors` (unique `visitor_hash`), unique `(date, path)`.

### `cookie_consents` — riwayat persetujuan cookie
`id`, `consent_type` (`all` / `necessary`), `ip_hash`, `user_agent`, `created_at`.

## Alur Tracking

1. **Banner cookie** (publik, `resources/views/partials/cookie-consent.blade.php`) muncul saat belum ada keputusan (localStorage `imagery_cookie_consent` kosong).
2. User memilih: **Terima Semua** → `POST /api/analytics/consent` `{consent: 'all'}` → cookie `cookie_consent=all` di-set (60 hari, CSRF-exempt).
   **Tolak** → consent `necessary` dicatat, cookie `necessary`.
   **Kustom** → toggle pilihan + **Simpan Preferensi**.
3. Middleware `TrackVisits` (`app/Http/Middleware/TrackVisits.php`) di grup `web`:
   - Skip tracking jika `analytics_enabled` off (setting) atau cookie consent bukan `all`.
   - Skip `/_debugbar*`, `/api/*`, `/dashboard*`, `/storage/*`, `/vendor/*`, `/favicon.ico`, dan request non-GET.
   - Catat ke `page_views` + set cookie `visitor_session` bila belum ada.
4. **Rollup**: command `analytics:process` (atau `POST /api/analytics/rollup`) mengagregasi `page_views` → `page_view_daily`, lalu hapus baris mentah yang sudah dirangkum. Dijadwalkan daily 02:30 di `routes/console.php`.

## API Endpoint (auth: owner/admin)

Semua di `app/Http/Controllers/Api/AnalyticsController.php`, prefix `/api/analytics`, guard `role:owner|admin`.

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/overview` | Total views (hari ini/kemarin/bulan), visitors, active users, konsen rate, trend 30 hari |
| GET | `/visits?days=30` | Top pages, device, OS, browser, referrer |
| GET | `/accounts?days=30` | Distribusi role, metode login, user aktif (dari `login_histories`) |
| GET | `/behavior?days=30` | Aktivitas per jam, aksi teratas, user paling aktif (dari `history_events`) |
| GET | `/raw?per_page=20` | Log kunjungan mentah (paginate) |
| POST | `/rollup` | Jalankan agregasi manual (`{days: 7}`) |
| POST | `/consent` | Simpan keputusan cookie (public, CSRF-exempt, rate-limited `analytics.consent` 20/jam/IP) |

## Setting (tab "Analitik" di Settings dashboard)

Disimpan di tabel `settings` via `SettingsController`:

- `analytics_enabled` (bool) — hidupkan/matikan tracking.
- `cookie_banner_enabled` (bool) — tampilkan/sembunyikan banner cookie.
- `cookie_banner_message` (string) — teks penjelasan banner.

Accessor di `app/Services/RuntimeSettings.php`: `analyticsEnabled()`, `cookieBannerEnabled()`, `cookieBannerMessage()`.

## UI

- **Halaman Analitik**: `resources/js/dashboard/pages/admin/Analytics.jsx` (route `/dashboard/analytics`, menu "Analitik" di Layout). Stat cards (views/visitors/akun), trend chart SVG 30 hari, tab Kunjungan / Akun / Perilaku, tabel log mentah, tombol Rollup.
- **Tab Settings**: `resources/js/dashboard/pages/admin/settings/AnalyticsTab.jsx`.
- **Banner publik**: `resources/views/partials/cookie-consent.blade.php` + logika di `resources/js/app.js` (localStorage + fetch POST consent).

## Privasi (UU PDP)

- IP TIDAK disimpan mentah — hanya `SHA-256(ip . APP_KEY)`.
- Tracking dihentikan total jika user menolak / memilih "necessary only".
- Preferensi dapat diubah kapan saja; banner muncul lagi setelah cookie dihapus.

## Catatan Implementasi

- **User model**: relasi `loginHistories()` ditambahkan (belum ada sebelumnya) untuk data akun.
- **AnalyticsService**: query `User::whereIn('id', ...)` TIDAK boleh pilih kolom `name` (tidak ada di tabel; itu accessor) — pilih `id, username, email` lalu pakai `->name` accessor.
- **`TrackVisits`** ada di tumpukan middleware `web` — pastikan tidak memblokir endpoint consent (sudah CSRF-exempt & di-exclude dari tracking).