# Sistem Tagihan, Pembayaran, dan QRIS

## Modul Pembayaran & Integrasi
Terdapat pemisahan tegas antara area konfigurasi rahasia (*Integrasi*) dan area tampilan visual (*Pembayaran*).

1. **Tab Integrasi**
   - Admin memasukkan kredensial *Payment Gateway* (TriPay), seperti API Key, Private Key, dan Kode Merchant (mendukung mask `••••••••` agar tidak bisa dicuri staf lain).
   - Admin mendata seluruh rekening Transfer Manual yang dimiliki studio, baik berupa Rekening Bank, Dompet Digital (E-Wallet), maupun Pendaftaran QRIS Statis.

2. **Tab Pembayaran (Rules / Aturan Tayang)**
   - Di sini, admin mengendalikan "sakelar" (toggle) mana saja yang diizinkan untuk dilihat oleh Klien di pop-up penagihan.
   - Apabila belum ada setup di tab Integrasi, sakelar ini tidak bisa dihidupkan (terblokir).
   - Sistem akan me-render daftar kotak centang berdasarkan setup admin, menyaring list (hanya mengirim metode yang aktif ke klien via API).

## Algoritma QRIS Dinamis Otomatis
Project ini tidak memerlukan integrasi API khusus ke penyedia dompet digital untuk menerbitkan nilai nominal secara instan ke *scanner* QR pelanggan.

1. **Setup Admin**: Admin meng-upload gambar asli (Statis QR Code) yang ia terima dari GoPay Bisnis / DANA Bisnis.
2. **Decode Lokal**: React SPA secara *client-side* membaca piksel-piksel gambar tersebut menggunakan pustaka `jsQR` untuk mengekstraksi raw payload EMVCo berawalan `000201...`. Ini langsung divalidasi keabsahannya (menolak Tipe 12/Dinamis).
3. **Konversi Sisi Klien**: Saat pop-up `PaymentModal` dimuat untuk Klien X, sistem (melalui `utils/qris.js`) akan:
   - Mencari Tag `54` dalam EMVCo. Jika belum ada (karena tipe QR Statis), fungsi akan memasukkan *string* nominal (berdasarkan total tagihan yang sedang dilihat).
   - Menghapus CRC16 lama (Tag `63`), menghitung ulang sandinya.
   - Me-render *string* baru ini menggunakan pustaka `qrcode` kembali ke wujud gambar grafis di layar Klien.
4. Nominal transaksi tertanam secara transparan, menghapus risiko *human-error* nominal saat klien membayar.
