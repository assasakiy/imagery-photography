# Dashboard Admin — Analitik & Statistik

Halaman Dashboard admin (`resources/js/dashboard/pages/Dashboard.jsx`) disajikan ala dashboard analitik umum. Data tunggal dari endpoint `GET /api/dashboard/stats` (`app/Http/Controllers/Api/DashboardController.php::stats`).

## Data dari Backend
Untuk admin (`isStaff()`), endpoint mengembalikan:

| Field | Sumber |
|---|---|
| `total_projects`, `active_projects`, `completed_projects` | `Project::count()` / `whereIn('status', …)` |
| `total_clients` | `User::role('client')->count()` |
| `total_revenue` | jumlah `Payment` `status=confirmed` yang punya proyek |
| `pending_payments` | `Payment` `status=pending` yang punya proyek |
| `portfolios` | `Portfolio::count()` |
| `unread_messages` | `ContactMessage` `read_at` null (dengan proyek atau non-proyek) |
| `revenue_by_month` | 6 bulan terakhir, `groupBy(paid_at->format('Y-m'))`, hanya `confirmed` — `{"2026-08": 1500000, …}` |
| `status_breakdown` | `selectRaw('status, COUNT(*)')` per status proyek — `{"completed": 3, …}` |
| `recent_projects`, `recent_messages`, `recent_payments` | 5 item terbaru masing-masing (payment/laporan dengan `project`) |

Untuk klien, endpoint mengembalikan data pesanan milik user sendiri (`projects`, `in_progress`, `completed`, `total_spent`, `recent_projects`).

## UI Dashboard
- **KPI cards** (4): Total Proyek, Proyek Aktif, Total Klien, Pendapatan.
- **Quick stats** (4): Proyek Selesai, Pembayaran Menunggu, Pesan Belum Dibaca, Portofolio.
- **Grafik Pendapatan 6 Bulan**: bar chart murni CSS (flex + `height` persentase) — TANPA library chart. Bar dihitung dari `max(points)`; total bulanan tampil di header card. Ikuti pola ini bila menambah grafik lain.
- **Status Proyek**: progress bar per status (persentase dari total proyek). Warna status didefinisikan di `STATUS_META` (baris dalam file Dashboard).
- **3 panel terbaru**: Pembayaran, Proyek, Pesan — masing-masing `Link` "Lihat semua".

## Konvensi
- **Jangan menambah dependency chart** (mis. Recharts/Chart.js) — gunakan CSS/inline SVG agar bundle tetap kecil (lihat target bundle < 300 kB di `docs/progressive_loading.md`).
- Ikon baru harus didaftarkan di `resources/js/dashboard/components/Icon.jsx` (icon `layers` ditambahkan untuk panel Status Proyek).
- Saat menambah statistik baru: tambahkan field di controller `stats()`, lalu konsumsi di `Dashboard.jsx` (atau `docs/progressive_loading.md` untuk bagian loading).
