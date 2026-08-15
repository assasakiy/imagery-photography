# Manajemen Media & Aset

## Pipeline Media Publik (Portfolio & Blog)

Sejak 2026-08-15, alur media publik di-desain agar **URL eksternal hanya menjadi sumber import** (satu kali), lalu Spatie Media Library menjadi *source of truth*:

```text
External URL (WordPress/manual)
     │
     │ import 1× (MediaController / media:import-covers)
     ▼
Spatie Media Library
     ├── original (koleksi `cover`)
     │      ├── thumbnail.webp  (conversion, ≤800px / Blog ≤400px)  → card/grid + admin
     │      └── medium.webp     (Blog saja, ≤1200px)                → card blog
     │
     └── original ─→ WatermarkService (GD) ─→ cache watermarked ─→ lightbox/detail publik
```

- **Card publik** pakai `thumbnail_url` (conversion, bersih/tanpa watermark) untuk Portfolio (`home`, `about`, `gallery/` index+category+related) dan Blog (`partials/blog-card`, related).
- **Lightbox/detail** Portfolio pakai `watermark_url($portfolio->cover_url)` — `WatermarkService::publicUrl()` mendaftar aset di tabel `watermarked_assets`, file cache di `storage/app/watermarked`, `serve()` meng-generate on-demand via GD (teks miring diagonal, font `Noto Sans`/`RedHat`).
- **Admin/editor** selalu melihat original (`cover_url`).
- **Blog** tanpa watermark: hero/content pakai media original/conversion biasa, tidak diliput WatermarkService.

### Conversion Spatie
```php
// Portfolio
$this->addMediaConversion('thumbnail')->width(800)->format('webp')->nonQueued();
// Blog
$this->addMediaConversion('thumbnail')->width(400)->format('webp')->nonQueued();
$this->addMediaConversion('medium')->width(1200)->format('webp')->nonQueued();
```
Semua conversion `nonQueued()` → diproses sinkron saat media di-import (tidak menunggu queue worker). Media lama yang dibuat sebelum conversion ada perlu `FileManipulator::createDerivedFiles()` / `media-library:regenerate`.

### Aksesor & URL
- `Portfolio::thumbnail_url` / `Blog::thumbnail_url` → URL conversion; fallback ke `cover_url`/`image_url`.
- `Portfolio::cover_url` → original media; fallback `image_url`.
- API `/api/portfolios` & `/api/blog` mengekspor `thumbnail_url` + `cover_url` + `media_id` (+ `image_url` lama).

### Import URL
- `POST /api/media/import {url}` → unduh URL → koleksi `library` Media Library global, kembalikan `mediaId` (tab URL di `MediaPicker.jsx`).
- Command backfill `php artisan media:import-covers` mengimpor `image_url` lama ke koleksi `cover` lalu menghapus `image_url`.

### Catatan Operasional
- php-fpm berjalan sebagai `apache` (SELinux Enforcing); CLI `opc` tidak bisa tulis `storage/app/public`. Seeder/command media jalankan `sudo -u apache` dengan `HOME=/tmp XDG_CONFIG_HOME=/tmp XDG_CACHE_HOME=/tmp`.
- Generate watermark massal: `php artisan media:watermark --fresh`.

## Spatie Media Library
Sistem file menggunakan `spatie/laravel-medialibrary` sebagai mesin utamanya. Semua unggahan terkait portofolio, user, dan proyek diubah menjadi *Media Collection*.

- **Original vs Preview**:
  - File orisinil diunggah ke disk **privat** (`local` atau `private`).
  - Sistem akan otomatis menghasilkan versi pratinjau (*conversion*) pada disk **publik**.
  - **Foto**: Gambar original disimpan di privat. Versi `preview` di-generate di publik, dikompresi ke maksimal dimensi 1920x1920, dan ditempel *watermark* otomatis (menggunakan `public_path('watermark.png')`).
  - **Video**: Karena video berat untuk di-encode on-the-fly, video dipisah menjadi dua pasang saat diunggah: satu file versi pratinjau (sudah diedit watermark) dimasukkan ke koleksi publik, dan satu file HD orisinil dimasukkan ke privat. Keduanya disatukan oleh parameter `asset_key` pada `custom_properties`.
- **Media Library Global**: Pustaka gambar di dashboard yang digunakan untuk Landing Page dan Blog disimpan di koleksi `library`. Tidak bercampur dengan aset milik Proyek klien (yang dicegah muncul di pustaka via query scope).

## Konvensi Akses (Gating)
- **Preview Terbuka**: Klien dan Admin bisa melihat pratinjau gambar dan memutarnya (untuk video) langsung dari Dashboard kapan saja.
- **Original HD Terkunci (Gated)**: Route `GET /api/files/{id}/download` dilindungi middleware. Klien hanya dapat mengunduhnya jika status pembayaran invoice adalah **Lunas** (`isPaid()`). Admin selalu dapat mengunduhnya kapan saja.
- **Zip Otomatis**: Ketika tagihan lunas, klien dapat mengunduh seluruh album HD sekaligus melalui rute kompresi `ZipStream`.

## Pruning & Siklus Hidup File (Lifecycle)
- Hari 1-30 setelah dibayar: File original HD tersedia untuk di-download.
- **Hari 30**: Proses pruning akan mem-build *Zip* gabungan dari file HD (disimpan sementara), lalu **menghapus secara fisik** file individual HD untuk menghemat ruang *storage* (hanya baris databasenya saja yang tersisa di-null-kan path-nya).
- **Hari 90**: Proyek secara otomatis ditandai `archived` (diarsipkan), dan klien harus meminta akses *Redelivery* kepada Admin jika ingin mengunduh ulang berkas mereka.
