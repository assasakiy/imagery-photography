# Timezone & Penjadwalan Acara

## Prinsip
- **Timestamp sistem selalu UTC.** Kolom `event_start`, `event_end`, dan kolom timestamp lain (`created_at`, dsb.) disimpan dalam UTC; `config('app.timezone')` Laravel **tetap `UTC`** dan tidak pernah diubah.
- Timezone hanya memengaruhi **interpretasi & tampilan jadwal acara**, bukan sistem timestamp global.

## Timezone Bisnis Global (bukan per-user)
- Satu timezone global untuk keseluruhan akun: **DB setting `timezone`** → **`.env` `APP_BUSINESS_TIMEZONE`** → default `Asia/Makassar`.
- Resolusi: `App\Services\RuntimeSettings::timezone()`.
- Nilai ini **dapat dikonfigurasi** di dashboard pada tab **Regional** (Branding → "Regional") — dropdown `BUSINESS_TIMEZONES`.
- `RuntimeSettings` dicache selama 1 jam (`runtime_settings`); menyimpan setting via API akan memanggil `forget()`.

## Input: Wall-clock lokal → UTC (backend)
Semua *endpoint* yang menerima jadwal acara mengubahnya menjadi UTC sebelum menyimpan:

- `BookingController::store` — menggabungkan `event_date` + `event_start_time`/`event_end_time` (format `H:i`) menjadi datetime, lalu ke UTC via `App\Support\BusinessTime::toUtc(date, time)`.
- `Api\ProjectController::store` / `update` — memakai `BusinessTime::parseToUtc(...)`.
- `Api\BookingApiController::confirm` / `accept` — `parseToUtc` (menerima naive wall-clock atau ISO UTC; bila string sudah mengandung zona eksplisit seperti `Z`, Carbon menghormatinya tanpa re-interpretasi).
- `Api\CustomerController::storeBooking` — `parseToUtc` pada `event_start`/`event_end` dari payload.

### `App\Support\BusinessTime`
Helper dengan constructor-injection `RuntimeSettings`:
- `toUtc(?date, ?time): ?Carbon` — parse `Y-m-d H:i` pada timezone bisnis → Carbon UTC (atau null).
- `parseToUtc(?string): ?Carbon` — parse string datetime bebas pada timezone bisnis → UTC (try/catch → null).
- `fromUtc(Carbon): Carbon` — UTC → timezone bisnis (untuk tampilan).
- `tz(): string`, `now(): Carbon`.

Form di frontend mengirim wall-clock naive (mis. `2026-08-14T08:00`); backend yang mengkonversi. **Frontend tidak pernah mengirim UTC yang sudah dikonversi.**

## Tampilan: UTC → timezone bisis (frontend)
- Frontend memakai native `Intl.DateTimeFormat` (bukan Day.js). Helper di `resources/js/dashboard/utils/date.js`:
  - `formatDate` — tanggal, dengan penanganan khusus *date-only* (`YYYY-MM-DD`) sebagai UTC agar tidak beralih hari.
  - `formatTime`, `formatTimeInput`, `formatTimeRange`, `formatDateTime`, `formatLongDate`, `isEventPassed`.
  - Timezone dibaca secara dinamis dari `window.APP_CONFIG.businessTimezone` (di-set di `resources/views/app.blade.php`); sehingga mengganti timezone di Settings langsung berlaku setelah reload.
- API mengembalikan `event_start`/`event_end` sebagai ISO-8601 UTC (Carbon `toJSON` → `...Z`), yang dipetakan ke zona bisnis oleh helper di atas.

## Catatan
- Tidak ada backfill migration; pada dev cukup `php artisan migrate:fresh --seed`.
- Filter `upcoming_schedule` di `DashboardController::stats` memakai kolom `event_date` (date-only) dan tidak bergantung zona waktu.
- `BookingApiController::accept` tetap memakai fallback `$data['event_start'] ?? $booking->event_start` — nilai booking lama sudah UTC, jadi aman.
