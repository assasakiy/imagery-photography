# Manajemen Media & Aset

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
