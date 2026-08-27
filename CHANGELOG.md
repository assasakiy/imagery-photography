# Changelog

Semua perubahan penting pada proyek ini akan didokumentasikan di sini.

## [1.0.0] - 2026-08-27

### Added
- **Dashboard SPA**: React + Vite, role-based (Owner, Admin, Klien) dengan Spatie Permission
- **Situs Publik (Blade SSR)**: Hero, Galeri, Layanan, Blog, Tentang, Kontak, Booking, FAQ
- **PWA**: Manifest dinamis, service worker, offline page, installable dashboard
- **Web Push**: VAPID keys, subscription table, PushController, badge API, PushPrompt UI
- **Notifikasi**: In-app polling, email SMTP, WhatsApp (multi-driver), webhook outgoing
- **Pembayaran**: Transfer manual, QRIS dinamis (EMVCo raw string), Payment Gateway (TriPay)
- **Pesan/Chat**: Real-time polling, reply, attachment, project reference, date separators
- **Media Library**: Spatie MediaLibrary dengan konversi WebP (thumbnail, hero, preview, og)
- **Docker Production**: Dockerfile multi-stage (nginx + php-fpm + supervisor), docker-compose.yml
- **Editorial Design**: Palet bronze/champagne, font Fraunces + Instrument Sans, dark/light mode
- **Security Headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Audit Log & Login Tracker**: Deteksi login mencurigakan, riwayat aktivitas
- **SEO**: OG tags dinamis, sitemap, meta description, structured data
- **Bookmarks & Engagement**: Like, bookmark, komentar pada blog

### Fixed
- **Docker**: Auto-generate APP_KEY jika kosong, PHP upload limits 64M, WebP GD support, fastcgi timeouts, storage permissions, nginx client body buffer
- **CSP**: Allow `http:` untuk img/font (support HTTP deploy)
- **Media URLs**: Relative `/storage` path alih-alih hardcoded `APP_URL`
- **Seeder**: Pemisahan core system data (owner only) dari dummy data
- **AppServiceProvider**: Try-catch RuntimeSettings agar migrate tidak crash saat DB belum siap
- **Route Model Binding**: `resolveRouteBindingQuery` untuk support `order_no` + `withTrashed()`
- **Notification Email**: Dynamic branding (siteName, siteLogo, brandColor) di template
- **IDOR Security**: Pengecekan kepemilikan file/ZIP proyek untuk role client

### Changed
- **Seeder Structure**: `DatabaseSeeder` hanya install core data (roles, permissions, owner, social platforms). `DummyDataSeeder` untuk data sampel (admin, client, reviews, stats, FAQ, portfolio, bookings)
- **Logo UI**: Hapus background/ring di header, sidebar, footer, branding settings — support PNG transparan
- **Typography**: Brand name pakai Fraunces editorial, border radius minimal pada logo
- **Reveal Animations**: Staggered multi-directional, `prefers-reduced-motion` guard

### Removed
- Decorative gradients, blobs, glassmorphism berlebihan (editorial flat design)
- Dead code: AdminInvitationMail, unused imports
