# Alur Pesanan: Booking hingga Selesai

## Booking (Reservasi)
1. **Pembuatan**: Klien publik membuat pesanan paket atau "Layanan Satuan" kustom. Masuk ke tabel `bookings` dengan status `pending` dan nomor unik `BK-{ABBR}-{YYMMDD}-{0001}`.
2. **Review Admin**: Admin merespons pesanan tersebut; ditolak (`rejected`) atau diterima.
3. **Konversi**: Saat booking diterima, statusnya berubah menjadi `converted` dan seketika membuat *instance* baru di tabel `projects` dengan status awal `scheduled`. Uang muka (DP) dapat langsung memicu tagihan pertama (`awaiting_dp`).

## Tahapan Proyek (Steppers)
Proyek bergerak **maju saja (forward-only)** melalui rute transisi state, difasilitasi oleh `STEP_ORDER` di sisi antarmuka klien & admin (`ProjectDetail.jsx`).

1. **Dijadwalkan (scheduled)**: Waktu persiapan menuju hari-H acara.
2. **Sesi Pemotretan (shooting)**: Terpicu otomatis jika `event_start` + masa tenggang (`grace_minutes`) terlewati. Admin mengunggah bukti/record foto kehadiran lapangan (masuk ke koleksi `proofs`).
3. **Editing**: Fotografer / tim bekerja memoles foto dan video. Admin mengatur target *progres* angka editing (misal 50/100).
4. **Menunggu Pembayaran (awaiting_payment)**: Preview tersedia untuk dilihat klien. Klien mendapati *invoice* jatuh tempo. Aksi mengunduh terkunci.
5. **Selesai (completed)**: Setelah invoice LUNAS, klien bisa bebas men-download ZIP file.
6. **Arsip (archived)**: Terjadi otomatis di Hari ke-90 pasca selesai, memutus askes link klien. Klien bisa meminta `Redelivery` dan Admin dapat menerapkan tarif tambahan untuk pemulihan (restore) berkas via popup khusus.

## Metadata & Lokasi
- Informasi waktu kini bersandar di kolom tunggal yang presisi: `event_start` dan `event_end` berformat Timestamp.
- Detail lokasi terpisah menjadi kolom `location` spesifik (String) dan diturunkan langsung dari form Booking awal.
