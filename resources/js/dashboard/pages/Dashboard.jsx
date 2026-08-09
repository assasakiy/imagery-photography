import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Icon from '../components/Icon';
import { PageHeader, Spinner, EmptyState, formatRupiah, formatDate } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/stats')
            .then(({ data }) => setStats(data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner />;
    if (!stats) return null;

    const isAdmin = stats.role === 'admin';

    if (isAdmin) {
        const cards = [
            { label: 'Total Proyek', value: stats.total_projects, icon: 'folder-open', color: 'bg-brand-500/15 text-brand-600 dark:text-brand-400' },
            { label: 'Proyek Aktif', value: stats.active_projects, icon: 'zap', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
            { label: 'Total Klien', value: stats.total_clients, icon: 'users', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
            { label: 'Pendapatan', value: formatRupiah(stats.total_revenue), icon: 'wallet', color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
        ];

        return (
            <>
                <PageHeader title="Dashboard" subtitle={`Selamat datang kembali, ${user?.name}`} />

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

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="card overflow-hidden">
                        <div className="flex items-center justify-between border-b border-line px-5 py-4">
                            <h2 className="font-bold text-ink">Proyek Terbaru</h2>
                            <Link to={isAdmin ? '/dashboard/projects' : '/dashboard/pesanan'} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                                Lihat semua
                            </Link>
                        </div>
                        <div className="divide-y divide-line">
                            {stats.recent_projects?.length ? (
                                stats.recent_projects.map((p) => (
                                    <Link key={p.id} to={isAdmin ? `/dashboard/projects/${p.id}` : `/dashboard/pesanan/${p.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-surface-muted">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
                                            <p className="text-xs text-ink-muted">{p.user?.name || '—'}</p>
                                        </div>
                                        <StatusBadge status={p.status} />
                                    </Link>
                                ))
                            ) : (
                                <EmptyState title="Belum ada proyek" message="Buat proyek pertama Anda dari menu Proyek." />
                            )}
                        </div>
                    </div>

                    <div className="card overflow-hidden">
                        <div className="flex items-center justify-between border-b border-line px-5 py-4">
                            <h2 className="font-bold text-ink">Pesan Terbaru</h2>
                            <Link to="/dashboard/messages" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                                Lihat semua
                            </Link>
                        </div>
                        <div className="divide-y divide-line">
                            {stats.recent_messages?.length ? (
                                stats.recent_messages.map((m) => (
                                    <Link key={m.id} to={`/dashboard/messages/${m.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-surface-muted">
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
                            <Link key={p.id} to={isAdmin ? `/dashboard/projects/${p.id}` : `/dashboard/pesanan/${p.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-surface-muted">
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
