import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Icon from '../components/Icon';
import { PageHeader, EmptyState, formatRupiah, formatDate } from '../components/ui';
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
        const kpis = [
            { label: 'Total Proyek', value: stats.total_projects, icon: 'folder-open', color: 'bg-brand-500/15 text-brand-600 dark:text-brand-400' },
            { label: 'Proyek Aktif', value: stats.active_projects, icon: 'zap', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
            { label: 'Total Klien', value: stats.total_clients, icon: 'users', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
            { label: 'Pendapatan', value: formatRupiah(stats.total_revenue), icon: 'wallet', color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
        ];

        const quickStats = [
            { label: 'Proyek Selesai', value: stats.completed_projects, icon: 'check', color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Pembayaran Menunggu', value: stats.pending_payments, icon: 'clock', color: 'text-amber-600 dark:text-amber-400' },
            { label: 'Pesan Belum Dibaca', value: stats.unread_messages, icon: 'mail', color: 'text-brand-600 dark:text-brand-400' },
            { label: 'Portofolio', value: stats.portfolios, icon: 'image', color: 'text-sky-600 dark:text-sky-400' },
        ];

        const paymentBadge = (status) => {
            const map = {
                pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                confirmed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
                failed: 'bg-red-500/15 text-red-600 dark:text-red-400',
            };
            const label = { pending: 'Menunggu', confirmed: 'Dikonfirmasi', failed: 'Ditolak' };
            return <span className={`badge ${map[status] || 'bg-zinc-500/15 text-ink-muted'}`}>{label[status] || status}</span>;
        };

        return (
            <>
                <PageHeader
                    title="Dashboard"
                    subtitle={`Selamat datang kembali, ${user?.name}`}
                    action={
                        <div className="flex gap-2">
                            <Link to="/dashboard/projects" className="btn-outline inline-flex items-center gap-2">
                                <Icon name="folder-open" size={16} /> Proyek
                            </Link>
                            <Link to="/dashboard/media" className="btn-primary inline-flex items-center gap-2">
                                <Icon name="upload" size={16} /> Media
                            </Link>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {kpis.map((c) => (
                        <div key={c.label} className="card p-5">
                            <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${c.color}`}>
                                <Icon name={c.icon} size={22} />
                            </div>
                            <p className="text-sm text-ink-muted">{c.label}</p>
                            <p className="mt-1 text-2xl font-bold text-ink">{c.value}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {quickStats.map((s) => (
                        <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-line bg-surface/60 px-4 py-3">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted ${s.color}`}>
                                <Icon name={s.icon} size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-lg font-bold leading-tight text-ink">{s.value}</p>
                                <p className="truncate text-xs text-ink-muted">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <RevenueChart data={stats.revenue_by_month} />
                    </div>
                    <StatusBreakdown data={stats.status_breakdown} />
                </div>

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
                            <h2 className="flex items-center gap-2 font-bold text-ink"><Icon name="folder-open" size={16} /> Proyek Terbaru</h2>
                            <Link to="/dashboard/projects" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">Lihat semua</Link>
                        </div>
                        <div className="divide-y divide-line">
                            {stats.recent_projects?.length ? (
                                stats.recent_projects.map((p) => (
                                    <Link key={p.id} to={`/dashboard/projects/${p.order_no || p.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-muted">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                                            <p className="text-xs text-ink-muted">
                                                {p.user?.name || '—'} {p.event_date ? `· ${formatDate(p.event_date)}` : ''}
                                            </p>
                                        </div>
                                        <StatusBadge status={p.status} />
                                    </Link>
                                ))
                            ) : (
                                <EmptyState title="Belum ada proyek" message="Buat proyek pertama Anda dari menu Proyek." />
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
                                    <Link key={m.id} to={`/dashboard/messages/${m.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-muted">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-ink">{m.name}</p>
                                            <p className="truncate text-xs text-ink-muted">{m.message}</p>
                                        </div>
                                        {!m.read_at && <span className="badge bg-brand-500/15 text-brand-600 dark:text-brand-400">Baru</span>}
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

function RevenueChart({ data = {} }) {
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

    return (
        <div className="card overflow-hidden h-full">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="flex items-center gap-2 font-bold text-ink">
                    <Icon name="trending-up" size={16} /> Pendapatan 6 Bulan
                </h2>
                <span className="text-sm font-semibold text-ink">{formatRupiah(total)}</span>
            </div>
            <div className="px-5 py-5">
                <div className="flex h-44 items-end gap-3">
                    {points.map((p) => (
                        <div key={p.key} className="group flex flex-1 flex-col items-center gap-2">
                            <div className="flex w-full flex-1 items-end">
                                <div
                                    className="w-full rounded-t-lg bg-brand-500/20 transition-colors group-hover:bg-brand-500/35"
                                    style={{ height: `${Math.max(4, Math.round((p.value / max) * 100))}%` }}
                                    title={`${p.label}: ${formatRupiah(p.value)}`}
                                />
                            </div>
                            <span className="text-xs text-ink-muted">{p.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const STATUS_META = {
    pending: { label: 'Menunggu', color: 'bg-amber-500' },
    scheduled: { label: 'Dijadwalkan', color: 'bg-amber-400' },
    shooting: { label: 'Pemotretan', color: 'bg-sky-500' },
    editing: { label: 'Editing', color: 'bg-indigo-500' },
    awaiting_payment: { label: 'Preview Tersedia', color: 'bg-orange-500' },
    completed: { label: 'Selesai', color: 'bg-emerald-500' },
    archived: { label: 'Diarsipkan', color: 'bg-zinc-400' },
};

function StatusBreakdown({ data = {} }) {
    const rows = Object.entries(data)
        .filter(([, v]) => Number(v) > 0)
        .map(([key, value]) => ({ key, value: Number(value), ...(STATUS_META[key] || { label: key, color: 'bg-zinc-400' }) }));

    const total = rows.reduce((s, r) => s + r.value, 0);

    return (
        <div className="card overflow-hidden h-full">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="flex items-center gap-2 font-bold text-ink">
                    <Icon name="layers" size={16} /> Status Proyek
                </h2>
                <span className="text-sm font-semibold text-ink">{total}</span>
            </div>
            <div className="space-y-4 px-5 py-5">
                {rows.length ? (
                    rows.map((r) => (
                        <div key={r.key}>
                            <div className="mb-1.5 flex items-center justify-between text-sm">
                                <span className="text-ink">{r.label}</span>
                                <span className="font-semibold text-ink">{r.value}</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                                <div className={`h-full rounded-full ${r.color}`} style={{ width: `${total ? Math.round((r.value / total) * 100) : 0}%` }} />
                            </div>
                        </div>
                    ))
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
