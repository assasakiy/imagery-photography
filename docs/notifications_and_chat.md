# Chat Universal & Sistem Notifikasi

## Universal Chat (Pesan Terpusat)
Fitur `Kirim Pesan` tidak lagi terpencar ke dalam form statis per tahap proyek. 

Sistem kini memiliki Antarmuka (UI) Bubble Chat Interaktif dua-arah:
- Klien dapat berkomunikasi dengan Admin secara *real-time* semu (berbalas-balasan secara berututan).
- Database menampung seluruh alur historis melalui model `ContactMessage` (termasuk referensi ID `reply_to_id` yang saling berkaitan untuk fitur *Reply* ala aplikasi chat asli).
- Mendukung pemformatan ringan: sisipan Emoji dan pengunggahan berkas attachment/dokumen pendukung (ditautkan dengan link Storage privat).
- *Tags*: Pesan ditandai (*tagged*) secara visual untuk mengidentifikasi apakah pesan tersebut terhubung kepada proyek tertentu (misalnya, ber-chip kuning "PSN-0010").

## Mesin Notifikasi
Sistem dapat mengalirkan pesan kepada *Klien* maupun *Staf/Admin* melalui tiga jalur (channel) berbeda dengan arsitektur **Pluggable**:

1. **In-App (Dashboard API)**: Pop-up tanda lonceng merah yang mengambang dengan notifikasi teks di dashboard aplikasi.
2. **Email (SMTP)**: Otomatis me-render Blade template berdesain HTML jika dikonfigurasi melalui Settings.
3. **WhatsApp Engine (`WhatsAppDriverRegistry`)**:
   Arsitektur modern, dapat disambungkan bebas tanpa membongkar *core code*.
   - Driver tertanam: *GoWA*, *Evolution API*, *WAHA*, *Fonnte*, *Twilio*, *Meta Cloud API*.
   - Semuanya dikonfigurasi sebagai skema dinamis (schema-driven). 
   - Seluruh panggilan jaringan dipaksa menggunakan `CURLOPT_IPRESOLVE_V4` (guna menghindari blok firewall IPv6 pada virtual machine *host*).

Semua aktivasi Notifikasi dipusatkan di tab "Notifikasi" yang mengatur rute mana yang *Wajib (Mandatory)* dan *Bebas-Aktif* berdasarkan setiap skenario (Event).
