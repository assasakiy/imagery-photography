# Manajemen Blog & Konten (Tiptap Editor)

Sistem CMS menyajikan fitur Editor Full-Page kelas profesional untuk menerbitkan artikel/blog dari nol.

## Auto-Generate SEO Excerpt
- Halaman form *CreateEditBlog.jsx* sengaja diciptakan minimalis namun canggih.
- Kolom pengisian data Meta (SEO) seperti deskripsi tidak lagi dimintakan kepada pengguna. Jika dibiarkan kosong, script React akan secara otomatis mengambil *text content* mentah, men-*strip* kerangka tag HTML-nya, dan mengapit tepat 160 karakter pertama untuk digenerasikan sebagai SEO ringkasan. 
- *URL Slug* otomatis diturunkan dari judul (menjamin tautan yang valid dan bersih dari karakter terlarang).

## Rich Text Tiptap
- Menggunakan ekstensi bawaan `StarterKit`.
- Ekstensi Media (*Image*) ditautkan langsung dengan `MediaPicker.jsx`. Saat kursor aktif di posisi mana pun, klik penyisipan Media akan menyisipkan tautan (URL) gambar langsung di baris teks yang berjalan, dengan format *lazy load* dan kelas radius responsif Tailwind.

## Taksonomi
- Pengelompokan didasarkan pada Relasi Induk (Kategori) tunggal, dan relasi Many-to-Many Polimorfik jamak untuk *Tags* (Topik Artikel).
- Diantarmuka pembuatan, penambahan tag dilakukan langsung layaknya aplikasi email masa kini (ketik teks -> tekan *Enter* -> menjadi chip yang dapat dihapus).
