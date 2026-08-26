# Arsitektur & Keamanan (RBAC)

## Arsitektur Sistem
Proyek ini merupakan Monolith Laravel 13 yang menyajikan dua sisi:
- **Publik (Blade SSR)**: Berjalan di `resources/views/landing_pages/`. Teroptimasi untuk SEO.
- **Dashboard Admin & Klien (React SPA)**: Di-mount di `/dashboard` (menggunakan React 18, Tailwind CSS v4, React Router, Vite). Berkomunikasi secara asinkron menggunakan endpoint API Sanctum yang terlindungi.
- **Sistem Layer**: `Routes` -> `Controllers` -> `Services` (`app/Services/`) -> `Models`. 
- Logika eksternal (notifikasi, integrasi) ditaruh secara pluggable di `/app/Services/` (contoh: `WhatsAppDriverRegistry`).

## Sistem Palet Brand
- Pengaturan branding menyediakan tiga template (`editorial`, `modern`, `natural`) dan satu mode `custom`.
- Setiap palet mempunyai `primary` untuk aksi utama, `secondary` untuk permukaan CTA, dan `accent` untuk highlight.
- Nilai disimpan sebagai settings key-value: `brand_primary_color`, `brand_secondary_color`, `brand_accent_color`, dan `brand_palette_template`; `brand_color` lama tetap menjadi fallback primary.
- `BrandColors` menghasilkan scale runtime dan token semantik `--action-*`, `--brand-surface-*`, serta `--accent-*`. Background aksi diturunkan dari primary dan otomatis digelapkan hanya bila perlu sampai teks putih mencapai rasio kontras minimum 4.5:1; warna primary asli tetap dipakai untuk identitas dan aksen.
- Class `.action-surface` memakai primary untuk CTA, navigasi aktif, tab/filter terpilih, tombol kirim, dan indikator pilihan. `.secondary-surface` memakai secondary untuk badge media/tipe layanan. `.accent-surface` memakai accent secara terbatas untuk badge `Unggulan`/`Populer` paket dan karya galeri; Unggulan memakai ikon bintang, Populer memakai ikon tren naik. Semua solid surface diturunkan ke background contrast-safe dengan teks putih; warna status sukses/peringatan/error tetap semantik.

## Otentikasi & RBAC
- **Library Utama**: Menggunakan `spatie/laravel-permission`. Tidak memakai kolom hardcode `role` lama (sudah migrasi).
- **Role yang Tersedia**:
  - `owner`: Super admin, dapat mengakses seluruh modul termasuk konfigurasi dasar, Landing, dan manajemen Tim.
  - `admin`: Operator harian (mengelola pesanan, proyek, layanan, klien, blog).
  - `client`: Hanya bisa melihat `/dashboard/pesanan`, membayar, dan mengunduh filenya.
  - `subscriber`: Pengguna portal publik terdaftar.
- **Gate / Middleware**:
  - Backend API dilindungi oleh middleware `role:owner`, `permission:manage-blog`, dll.
  - Di sisi Frontend React (`App.jsx`), route dibungkus dengan komponen `<Protected adminOnly>` atau `<Protected ownerOnly>`. Akses klien menggunakan `<Protected notStaffCase>`.

## Keamanan Data
- **CSRF Token**: Karena sistemnya SPA, semua mutasi state state (POST/PUT/DELETE) wajib menyertakan token CSRF (di-inject manual via header HTTP `X-XSRF-TOKEN`). Cookie ini di-*refresh* otomatis via Axios Interceptor jika mendapatkan error `419`.
- **Soft Deletes & Recycle Bin**: Menggunakan trait `SoftDeletes` dan pencatat waktu penghapusan `SoftDeletesWithWho` agar data yang terhapus dapat di-*restore* via modul "Recycle Bin".
