import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { toast } from '../lib/toast';
import Icon from '../components/Icon';
import { PageHeader, EmptyState, formatRupiah, formatDate, dateBoxParts } from '../components/ui';
import Skeleton from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { prefetchAllRoutesInBackground } from '../routes/prefetchAll';

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            prefetchAllRoutesInBackground();
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        api.get('/dashboard/stats')
            .then(({ data }) => setStats(data))
            .catch(() => toast.error('Gagal memuat dashboard.'))
            .finally(() => setLoading(false));
    }, []);

    const isAdmin = user ? ['admin', 'owner'].includes(user.role) : stats?.role === 'admin';

    if (loading) {
        return (
            <>
                <PageHeader title={isAdmin ? 'Dashboard' : 'Portal Klien'} subtitle={isAdmin ? `Selamat datang kembali, ${user?.name}` : `Halo, ${user?.name}`} />
                <Skeleton variant="card" />
            </>
        );
    }
    if (!stats) return null;

    if (isAdmin) {
        const trend = (curr, prev, suffix = '') => {
            const diff = curr - prev;
            if (diff > 0) return { up: true, text: `+${diff}${suffix}` };
            if (diff < 0) return { up: false, text: `${diff}${suffix}` };
            return null;
        };

        const projectTrend = trend(stats.projects_this_month, stats.projects_last_month);
        const revenueGrowth = stats.revenue_last_month > 0
            ? { up: Number(stats.revenue_this_month) >= Number(stats.revenue_last_month), text: `${Math.round(((Number(stats.revenue_this_month) - Number(stats.revenue_last_month)) / stats.revenue_last_month) * 100)}%` }
            : null;

        const kpis = [
            { label: 'Total Proyek', value: stats.total_projects, icon: 'folder-open', color: 'bg-brand-500/15 text-brand-600 dark:text-brand-400', trend: projectTrend },
            { label: 'Proyek Aktif', value: stats.active_projects, icon: 'zap', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', trend: null },
            { label: 'Total Klien', value: stats.total_clients, icon: 'users', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', trend: stats.clients_this_month > 0 ? { up: true, text: 'Baru' } : null },
            { label: 'Pendapatan Bulan Ini', value: formatRupiah(stats.revenue_this_month), icon: 'wallet', color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400', trend: revenueGrowth },
        ];

        const paymentBadge = (status) => {
            const map = {
                pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                confirmed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                failed: 'bg-red-500/15 text-red-600 dark:text-red-400',
            };
            const label = { pending: 'Menunggu', confirmed: 'Lunas', failed: 'Ditolak' };
            return <span className={`badge ${map[status] || 'bg-zinc-500/15 text-ink-muted'}`}>{label[status] || status}</span>;
        };

        return (
            <>
                <PageHeader
                    title="Dashboard"
                    subtitle={`Selamat datang kembali, ${user?.name}`}
                />

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {kpis.map((c) => (
                        <div key={c.label} className="card p-4">
                            <div className="flex items-start justify-between">
                                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${c.color}`}>
                                    <Icon name={c.icon} size={18} />
                                </div>
                                {c.trend && (
                                    <span className={`badge ${c.trend.up ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'}`}>
                                        <Icon name="trending-up" size={11} className={c.trend.up ? '' : 'rotate-180'} /> {c.trend.text}
                                    </span>
                                )}
                            </div>
                            <p className="mt-3 text-xl font-bold text-ink">{c.value}</p>
                            <p className="mt-0.5 text-xs text-ink-muted">{c.label}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <RevenueChart
                            data={stats.revenue_by_month}
                            thisMonth={stats.revenue_this_month}
                            lastMonth={stats.revenue_last_month}
                            pending={stats.pending_amount}
                            avg={stats.avg_per_project}
                        />
                    </div>
                    <StatusBreakdown data={stats.status_breakdown} />
                </div>

                <QuickLinks />

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="card overflow-hidden lg:col-span-1">
                        <div className="flex items-center justify-between border-b border-line px-5 py-4">
                            <h2 className="flex items-center gap-2 font-bold text-ink"><Icon name="credit-card" size={16} /> Pembayaran Terbaru</h2>
                            <Link to="/dashboard/payments" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">Lihat semua</Link>
                        </div>
                        <div className="divide-y divide-line">
                            {stats.recent_payments?.length ? (
                                stats.recent_payments.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-ink">{p.project?.name || '—'}</p>
                                            <p className="text-xs text-ink-muted">
                                                {formatRupiah(p.amount)} · {p.method === 'gateway' ? 'Gateway' : 'Manual'} · {p.paid_at ? formatDate(p.paid_at) : formatDate(p.created_at)}
                                            </p>
                                        </div>
                                        {paymentBadge(p.status)}
                                    </div>
                                ))
                            ) : (
                                <EmptyState icon="credit-card" title="Belum ada pembayaran" message="Pembayaran yang masuk akan muncul di sini." />
                            )}
                        </div>
                    </div>

                    <div className="card overflow-hidden lg:col-span-1">
                        <div className="flex items-center justify-between border-b border-line px-5 py-4">
                            <h2 className="flex items-center gap-2 font-bold text-ink"><Icon name="calendar" size={16} /> Jadwal Terdekat</h2>
                            <Link to="/dashboard/projects" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">Lihat semua</Link>
                        </div>
                        <div className="divide-y divide-line">
                            {stats.upcoming_schedule?.length ? (
                                stats.upcoming_schedule.map((p) => {
                                    const box = dateBoxParts(p.event_date);
                                    return (
                                        <Link key={p.id} to={`/dashboard/projects/${p.order_no || p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-muted">
                                            {box ? (
                                                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-surface-muted">
                                                    <span className="text-[10px] font-bold uppercase leading-none text-brand-600 dark:text-brand-400">
                                                        {box.month}
                                                    </span>
                                                    <span className="mt-0.5 text-sm font-bold leading-none text-ink">{box.day}</span>
                                                </div>
                                            ) : (
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-ink-muted">
                                                    <Icon name="calendar" size={18} />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                                                <p className="flex items-center gap-1 truncate text-xs text-ink-muted">
                                                    <Icon name="map-pin" size={11} /> {p.location || 'Lokasi belum diatur'}
                                                </p>
                                            </div>
                                            <StatusBadge status={p.status} />
                                        </Link>
                                    );
                                })
                            ) : (
                                <EmptyState icon="calendar" title="Tidak ada jadwal" message="Proyek dengan tanggal acara akan tampil di sini." />
                            )}
                        </div>
                    </div>

                    <div className="card overflow-hidden lg:col-span-1">
                        <div className="flex items-center justify-between border-b border-line px-5 py-4">
                            <h2 className="flex items-center gap-2 font-bold text-ink"><Icon name="message-circle" size={16} /> Pesan Terbaru</h2>
                            <Link to="/dashboard/messages" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">Lihat semua</Link>
                        </div>
                        <div className="divide-y divide-line">
                            {stats.recent_messages?.length ? (
                                stats.recent_messages.map((m) => (
                                    <Link key={m.id} to={`/dashboard/messages/${m.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-muted">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-xs font-bold uppercase text-brand-600 dark:text-brand-400">
                                            {m.name?.slice(0, 2) || '?'}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate text-sm font-semibold text-ink">{m.name}</p>
                                                {m.unread_count > 0 && (
                                                    <span className="badge bg-brand-500/15 text-brand-600 dark:text-brand-400">
                                                        {m.unread_count} baru
                                                    </span>
                                                )}
                                            </div>
                                            <p className="truncate text-xs text-ink-muted">{m.message}</p>
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <EmptyState icon="message-circle" title="Tidak ada pesan" message="Pesan kontak akan muncul di sini." />
                            )}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const cards = [
        { label: 'Total Pesanan', value: stats.projects, icon: 'folder-open', color: 'bg-brand-500/15 text-brand-600 dark:text-brand-400' },
        { label: 'Sedang Berjalan', value: stats.in_progress, icon: 'zap', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
        { label: 'Selesai', value: stats.completed, icon: 'check', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
        { label: 'Total Dibayar', value: formatRupiah(stats.total_spent), icon: 'wallet', color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
    ];

    return (
        <>
            <PageHeader title="Portal Klien" subtitle={`Halo, ${user?.name}`} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map((c) => (
                    <div key={c.label} className="card p-5">
                        <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${c.color}`}>
                            <Icon name={c.icon} size={22} />
                        </div>
                        <p className="text-sm text-ink-muted">{c.label}</p>
                        <p className="mt-1 text-2xl font-bold text-ink">{c.value}</p>
                    </div>
                ))}
            </div>

            <div className="card mt-6 overflow-hidden">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                    <h2 className="font-bold text-ink">Pesanan Saya</h2>
                    <Link to={isAdmin ? '/dashboard/projects' : '/dashboard/pesanan'} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                        Lihat semua
                    </Link>
                </div>
                <div className="divide-y divide-line">
                    {stats.recent_projects?.length ? (
                        stats.recent_projects.map((p) => (
                            <Link key={p.id} to={isAdmin ? `/dashboard/projects/${p.order_no || p.id}` : `/dashboard/pesanan/${p.order_no || p.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-surface-muted">
                                <p className="text-sm font-semibold text-ink">{p.name}</p>
                                <StatusBadge status={p.status} />
                            </Link>
                        ))
                    ) : (
                        <EmptyState title="Belum ada pesanan" />
                    )}
                </div>
            </div>
        </>
    );
}

function RevenueChart({ data = {}, thisMonth = 0, lastMonth = 0, pending = 0, avg = 0 }) {
    const lastMonths = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        lastMonths.push({
            key: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'),
            label: d.toLocaleDateString('id-ID', { month: 'short' }),
        });
    }

    const points = lastMonths.map((m) => ({ ...m, value: Number(data[m.key]) || 0 }));
    const max = Math.max(1, ...points.map((p) => p.value));
    const total = points.reduce((s, p) => s + p.value, 0);
    const growth = lastMonth > 0 ? Math.round(((Number(thisMonth) - Number(lastMonth)) / lastMonth) * 100) : (Number(thisMonth) > 0 ? 100 : 0);

    const W = 560;
    const H = 180;
    const PAD = 20;
    const innerW = W - PAD * 2;
    const innerH = H - PAD * 2;
    const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;
    const coords = points.map((p, i) => ({
        x: PAD + i * stepX,
        y: PAD + innerH - (p.value / max) * innerH,
        ...p,
    }));
    const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
    const areaPath = `${linePath} L ${PAD + (points.length - 1) * stepX} ${PAD + innerH} L ${PAD} ${PAD + innerH} Z`;

    const strip = [
        { label: 'Bulan Ini', value: formatRupiah(thisMonth), color: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Bulan Lalu', value: formatRupiah(lastMonth), color: 'text-ink-muted' },
        { label: 'Rata-rata/Proyek', value: formatRupiah(avg), color: 'text-ink-muted' },
        { label: 'Menunggu Bayar', value: formatRupiah(pending), color: 'text-amber-600 dark:text-amber-400' },
    ];

    return (
        <div className="card overflow-hidden h-full">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="flex items-center gap-2 font-bold text-ink">
                    <Icon name="trending-up" size={16} /> Tren Pendapatan 6 Bulan
                </h2>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                    {formatRupiah(total)}
                    {growth !== 0 && (
                        <span className={`badge ${growth > 0 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'}`}>
                            {growth > 0 ? '+' : ''}{growth}%
                        </span>
                    )}
                </span>
            </div>
            <div className="border-b border-line px-5 py-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {strip.map((s) => (
                        <div key={s.label}>
                            <p className="text-xs text-ink-muted">{s.label}</p>
                            <p className={`mt-0.5 text-lg font-bold leading-tight ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="px-3 py-4">
                <svg viewBox={`0 0 ${W} ${H}`} className="h-48 w-full" preserveAspectRatio="none" role="img" aria-label="Tren pendapatan 6 bulan">
                    <path d={areaPath} fill="brand" className="fill-brand-500/10" />
                    <path d={linePath} fill="none" strokeWidth="2.5" className="stroke-brand-500" strokeLinecap="round" strokeLinejoin="round" />
                    {coords.map((c) => (
                        <circle key={c.key} cx={c.x} cy={c.y} r="3.5" className="fill-white stroke-brand-500 dark:fill-zinc-900" strokeWidth="2">
                            <title>{`${c.label}: ${formatRupiah(c.value)}`}</title>
                        </circle>
                    ))}
                </svg>
                <div className="mt-2 flex justify-between px-2 text-xs text-ink-muted">
                    {points.map((p) => (
                        <span key={p.key}>{p.label}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}

function QuickLinks() {
    const links = [
        { to: '/dashboard/projects', icon: 'folder-open', label: 'Buat Proyek', desc: 'Buka manajemen proyek' },
        { to: '/dashboard/media', icon: 'upload', label: 'Upload Media', desc: 'Kelola pustaka gambar & video' },
        { to: '/dashboard/blog/create', icon: 'edit', label: 'Tulis Artikel', desc: 'Buat postingan blog baru' },
        { to: '/dashboard/bookings', icon: 'calendar', label: 'Lihat Booking', desc: 'Cek daftar booking masuk' },
        { to: '/dashboard/clients', icon: 'users', label: 'Kelola Klien', desc: 'Daftar klien terdaftar' },
        { to: '/dashboard/pages', icon: 'sparkles', label: 'Atur Halaman', desc: 'Konten halaman depan & statis' },
    ];

    return (
        <div className="card mt-6 overflow-hidden">
            <div className="border-b border-line px-5 py-4">
                <h2 className="flex items-center gap-2 font-bold text-ink">
                    <Icon name="dashboard" size={16} /> Tautan Cepat
                </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                {links.map((l) => (
                    <Link key={l.to} to={l.to} className="group flex items-center gap-3 rounded-2xl border border-line bg-surface/60 px-4 py-3 transition-colors hover:border-brand-500/40 hover:bg-surface-muted">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
                            <Icon name={l.icon} size={18} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink group-hover:text-brand-600 dark:group-hover:text-brand-400">{l.label}</p>
                            <p className="truncate text-xs text-ink-muted">{l.desc}</p>
                        </div>
                        <Icon name="arrow-right" size={16} className="ml-auto shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5" />
                    </Link>
                ))}
            </div>
        </div>
    );
}

const STATUS_META = {
    pending: { label: 'Menunggu', color: 'bg-amber-500', hex: '#f59e0b' },
    scheduled: { label: 'Dijadwalkan', color: 'bg-amber-400', hex: '#fbbf24' },
    shooting: { label: 'Pemotretan', color: 'bg-sky-500', hex: '#0ea5e9' },
    editing: { label: 'Editing', color: 'bg-indigo-500', hex: '#6366f1' },
    awaiting_payment: { label: 'Preview Tersedia', color: 'bg-orange-500', hex: '#f97316' },
    completed: { label: 'Selesai', color: 'bg-emerald-500', hex: '#10b981' },
    archived: { label: 'Diarsipkan', color: 'bg-zinc-400', hex: '#a1a1aa' },
};

function StatusBreakdown({ data = {} }) {
    const rows = Object.entries(data)
        .filter(([, v]) => Number(v) > 0)
        .map(([key, value]) => ({ key, value: Number(value), ...(STATUS_META[key] || { label: key, color: 'bg-zinc-400', hex: '#a1a1aa' }) }));

    const total = rows.reduce((s, r) => s + r.value, 0);

    const SIZE = 150;
    const STROKE = 18;
    const R = (SIZE - STROKE) / 2;
    const C = 2 * Math.PI * R;
    let offset = 0;

    return (
        <div className="card overflow-hidden h-full">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="flex items-center gap-2 font-bold text-ink">
                    <Icon name="layers" size={16} /> Status Proyek
                </h2>
                <span className="text-sm font-semibold text-ink">{total}</span>
            </div>
            <div className="flex flex-col items-center gap-5 px-5 py-5">
                {rows.length ? (
                    <>
                        <div className="relative">
                            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
                                <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" strokeWidth={STROKE} className="stroke-surface-muted" />
                                {rows.map((r) => {
                                    const len = total ? (r.value / total) * C : 0;
                                    const seg = (
                                        <circle
                                            key={r.key}
                                            cx={SIZE / 2}
                                            cy={SIZE / 2}
                                            r={R}
                                            fill="none"
                                            stroke={r.hex}
                                            strokeWidth={STROKE}
                                            strokeDasharray={`${Math.max(0, len - 1.5)} ${C - Math.max(0, len - 1.5)}`}
                                            strokeDashoffset={-offset}
                                            strokeLinecap="butt"
                                            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                                        >
                                            <title>{`${r.label}: ${r.value}`}</title>
                                        </circle>
                                    );
                                    offset += len;
                                    return seg;
                                })}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold leading-none text-ink">{total}</span>
                                <span className="mt-1 text-xs text-ink-muted">Proyek</span>
                            </div>
                        </div>
                        <div className="w-full space-y-1.5">
                            {rows.map((r) => (
                                <div key={r.key} className="flex items-center gap-2 text-sm">
                                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${r.color}`} />
                                    <span className="text-ink">{r.label}</span>
                                    <span className="ml-auto font-semibold text-ink">{r.value}</span>
                                    <span className="w-10 text-right text-xs text-ink-muted">{total ? Math.round((r.value / total) * 100) : 0}%</span>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <EmptyState title="Belum ada data proyek" />
                )}
            </div>
        </div>
    );
}

export function StatusBadge({ status }) {
    const map = {
        pending: ['bg-amber-500/15 text-amber-600 dark:text-amber-400', 'Menunggu'],
        scheduled: ['bg-amber-500/15 text-amber-600 dark:text-amber-400', 'Dijadwalkan'],
        shooting: ['bg-sky-500/15 text-sky-600 dark:text-sky-400', 'Pemotretan'],
        editing: ['bg-indigo-500/15 text-indigo-600 dark:text-indigo-400', 'Editing'],
        awaiting_payment: ['bg-orange-500/15 text-orange-600 dark:text-orange-400', 'Preview Tersedia'],
        completed: ['bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', 'Selesai'],
        archived: ['bg-zinc-500/15 text-zinc-600 dark:text-zinc-400', 'Diarsipkan'],
        confirmed: ['bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', 'Dikonfirmasi'],
        failed: ['bg-red-500/15 text-red-600 dark:text-red-400', 'Gagal'],
    };
    const [cls, label] = map[status] || ['bg-zinc-500/15 text-ink-muted', status];

    return <span className={`badge ${cls}`}>{label}</span>;
}

export { formatDate };
