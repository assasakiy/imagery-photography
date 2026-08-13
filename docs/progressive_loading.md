# Progressive Loading Dashboard (Lazy, Preload, & Skeleton)

Sistem ini memecah bundle React dashboard menjadi banyak *chunk* per-halaman lalu memuatnya secara bertahap (progressive loading) sehingga bundle awal kecil dan navigasi terasa instan. Semua berkas berada di `resources/js/dashboard/`.

## Registry Rute (routeImports.js)
Satu-satunya sumber kebenaran pemetaan path → `import()`, di `routes/routeImports.js`:

```js
export const pageImports = {
    '/dashboard': () => import('../pages/Dashboard'),
    '/dashboard/projects/:id': () => import('../pages/admin/projects/ProjectDetail'),
    ...
};
```

- **Urutan object = prioritas prefetch** (semakin awal semakin penting dipelankan duluan).
- **Route dengan parameter** ditulis memakai `:id` (mis. `/dashboard/projects/:id`), dinormalisasi runtime (lihat di bawah).
- `App.jsx` membangun `<Route>` dari registry ini: `lazy(pageImports[path])` + `withSuspense(node, variant)` yang membungkus tiap rute dengan `RouteErrorBoundary` dan `PageFallback`.

## Preload Router (preloadRoute.js)
```js
preloadRoute(path, { force }) // → Promise<modul> | undefined
```
- Menormalkan path via `normalizePath` agar rute berparameter ikut cocok: coba exact → lalu pola `:id` (regex `[^/]+`) → lalu prefix terpanjang yang ada di registry.
- **Cache promise**: sekali dipelankan, promise disimpan di `Map`, penggagalan mem-bersihkan cache agar bisa dicoba lagi.
- **Koneksi lambat**: tanpa `force`, mengembalikan `undefined` bila `navigator.connection.saveData` atau `effectiveType` ∈ `slow-2g`/`2g`.

## Idle Prefetch (prefetchAll.js)
`prefetchAllRoutesInBackground()` dipanggil `setTimeout(1500)` setelah Dashboard mount (`pages/Dashboard.jsx`):

- Lewati Dashboard & Login (`PRIORITY_SKIP`) karena halaman yang sedang/akan segera dipakai.
- Mengambil seluruh path lain **satu-per-satu** di `requestIdleCallback` (timeout 2000ms; fallback `setTimeout` 300ms).
- Lewati total bila koneksi `saveData`/`2g` (hemat bandwidth).

## Hover Preload (Layout.jsx)
Sidebar memanggil `preloadRoute(nav.path)` saat `onMouseEnter`/`onFocus`/`onTouchStart` pada item & sub-item navigasi — chunk halaman sudah siap sebelum diklik.

## Fallback & Error (PageFallback.jsx, RouteErrorBoundary.jsx)
- `PageFallback` dipakai sebagai fallback `<Suspense>`: menunda tampilnya skeleton **150ms (desktop) / 200ms (mobile)** agar navigasi cepat tidak berkedip skeleton.
- `RouteErrorBoundary` menangkap gagal muat chunk (jaringan drop) dan otomatis `window.location.reload()`.

## Skeleton Loading (Skeleton.jsx & components/skeletons/)
Komponen `Skeleton` memilih salah satu dari `skeletons/{Card,Table,Form}Skeleton.jsx` berdasarkan varian `card`/`table`/`form` (dipetakan per-tipe halaman di `App.jsx`).

**Aturan wajib (agar tidak terjadi layout jump):**
1. `PageHeader` (judul halaman) **selalu dirender** — skeleton hanya menggantikan area konten di bawahnya.
   ```jsx
   <PageHeader title="Pesanan" subtitle="..." />
   {loading ? <Skeleton variant="table" /> : <Tabel ... />}
   ```
2. Skeleton **TIDAK boleh** memuat blok judul tiruan atau `py-2` ekstra — konten asli harus mendarat tepat di posisi skeleton ditinggalkan.
3. Halaman "full-page" tanpa `PageHeader` (mis. `OrderDetail`, `CreateEditBlog`) memakai `if (loading) return <Skeleton variant="form" />` — aman karena konten aslinya juga mulai dari atas.
4. Spinner kecil tetap diperbolehkan untuk loading bagian dalam konten (thread chat, riwayat pembayaran).

## Konvensi Tambahan
- Halaman auth (`Login`, `ForgotPassword`, `ResetPassword`, `SetPassword`) di-`import` statis (eager) agar tanpa fallback loading; `LoginRoute` hanya redirect saat `!loading && user`.
- Pemicu build: `CI=1 npx vite build`. Target bundle utama: **< 300 kB** (sekarang ~267 kB, sebelumnya ~335 kB).
