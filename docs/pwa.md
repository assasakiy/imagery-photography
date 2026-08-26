# PWA — Dashboard Installable App

## Scope
PWA hanya untuk **dashboard & auth** (`/dashboard`, `/login`, `/register`). Ketiganya me-render view yang sama (`resources/views/app.blade.php`), sehingga manifest + service worker cukup di-inject di satu tempat. Situs publik (Blade SSR) **tidak** memuat manifest → tidak bisa diinstall dari halaman publik.

## Arsitektur

```
routes/web.php
  ├─ GET /manifest.webmanifest  → JSON dinamis (name/theme dari RuntimeSettings)
  └─ GET /offline               → resources/views/errors/offline.blade.php

public/sw.js                    → Service Worker (versi: const VERSION)
public/icons/pwa-*.png          → 192, 512, maskable-512 (generate via scripts/)
resources/views/app.blade.php   → <link rel="manifest"> + <meta theme-color> + register SW
```

## Manifest Dinamis
`theme_color`, `name`, `short_name` dibaca dari `RuntimeSettings` — ganti branding di dashboard settings akan otomatis ikut ke PWA (nama app, warna status bar). `short_name` = inisial jika nama > 2 kata (SLI).

- `start_url: /dashboard`, `scope: /` (agar redirect ke `/login` saat sesi habis tetap dalam jendela standalone, tidak lompat ke browser)
- `display: standalone`, `background_color: #09090b`
- Shortcuts: Pesanan Saya (`/dashboard/pesanan`), Pesan (`/dashboard/client-messages`)
- Content-Type wajib `application/manifest+json`

## Strategi Service Worker
| Request | Strategi | Catatan |
|---|---|---|
| Navigasi halaman (`mode=navigate`) | Network-first → cache → `/offline` | SPA shell + auth pages ter-cache saat online |
| `/build/*`, `/icons/*`, gambar, font | Stale-while-revalidate | Aset Vite hashed, aman di-cache lama |
| `/api/*` | **Tidak di-cache** | Data sensitif (Sanctum session) selalu network |
| Non-GET (POST/PUT/PATCH) | Pass-through | CSRF & mutasi tak boleh tersentuh SW |

Cache di-versioning via `CACHE = sli-pwa-${VERSION}` — naikkan `VERSION` di `sw.js` untuk force-update semua client; `activate` menghapus cache lama + `clients.claim()`.

## Icon Generation
```bash
php scripts/generate-pwa-icons.php
```
Sumber: logo asli media library (3500×3500). Output:
- `pwa-192.png` / `pwa-512.png` — cover-fit penuh
- `pwa-maskable-512.png` — logo 72% di canvas bronze `#b08d57` (safe zone maskable)

Jalankan ulang script ini jika logo diganti permanen.

## Guard Lingkungan Dev
SW hanya register bila `location.protocol === 'https:'` atau hostname localhost/127.0.0.1. Server dev via IP HTTP (`http://129.225.7.177:20128`) tidak meregister SW (bukan secure context) — mencegah error console.

## Instalasi User
- **Android/Chrome:** menu → "Install app" / ikon install di omnibox (muncul setelah manifest + SW valid)
- **iOS/Safari:** Share → "Add to Home Screen" (pakai apple-touch-icon.png yang ada)
- **Desktop Chrome/Edge:** ikon install di address bar

## Update Aplikasi
Karena navigasi network-first, HTML terbaru selalu diambil saat online. Aset build baru otomatis masuk cache via SWR. Untuk perubahan besar SW sendiri, naikkan `const VERSION`.

## Gotcha
- Jangan tambah caching untuk `/api/*` — Sanctum cookie auth + data sensitif.
- Manifest `id` dan `start_url` harus konsisten; mengubahnya membuat browser menganggap app baru.
- CSP middleware (`SecurityHeaders.php`) mengizinkan `'unsafe-inline'` untuk script — inline registration snippet aman.
