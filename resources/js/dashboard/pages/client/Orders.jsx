import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import Icon from '../../components/Icon';
import { PageHeader, Spinner, EmptyState, formatRupiah, formatDate } from '../../components/ui';

const STATUS_META = {
    scheduled: ['bg-amber-500/15 text-amber-600', 'Dijadwalkan'],
    shooting: ['bg-sky-500/15 text-sky-600', 'Pemotretan'],
    editing: ['bg-indigo-500/15 text-indigo-600', 'Editing'],
    awaiting_payment: ['bg-orange-500/15 text-orange-600', 'Preview Tersedia'],
    completed: ['bg-emerald-500/15 text-emerald-600', 'Selesai'],
    archived: ['bg-zinc-500/15 text-zinc-600', 'Diarsipkan'],
};

export function StatusBadge({ value }) {
    const [cls, label] = STATUS_META[value] || ['bg-zinc-500/15 text-zinc-600', value];
    return <span className={`badge ${cls}`}>{label}</span>;
}

export default function Orders() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/projects')
            .then(({ data }) => setItems(data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner />;

    return (
        <>
            <PageHeader title="Pesanan" subtitle="Pantau progress dan file pesanan Anda." />

            {items.length ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((p) => (
                        <Link key={p.id} to={`/dashboard/projects/${p.order_no || p.id}`} className="card group overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl">
                            <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
                                {p.thumb_url ? (
                                    <img src={p.thumb_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                ) : (
                                    <div className="h-full w-full bg-gradient-to-br from-brand-500/70 via-brand-600/70 to-brand-800/70" />
                                )}
                                <span className="absolute left-3 top-3 rounded-lg bg-black/55 px-2 py-0.5 font-mono text-xs font-bold text-white backdrop-blur-sm">PSN-{p.order_no}</span>
                                <span className="absolute right-3 top-3 rounded-lg bg-black/55 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">{p.is_paid ? 'Lunas' : 'Menunggu Bayar'}</span>
                            </div>
                            <div className="flex flex-col gap-2 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <h3 className="font-bold text-ink">{p.name}</h3>
                                    {p.event_date && (
                                        <span className="flex shrink-0 items-center gap-1.5 text-sm text-ink-muted">
                                            <Icon name="calendar" size={14} /> {formatDate(p.event_date)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="badge bg-emerald-500/15 text-emerald-600">{p.status_label}</span>
                                    {p.archived && <span className="badge bg-zinc-500/15 text-zinc-600">Diarsipkan</span>}
                                </div>
                                <p className="mt-auto text-sm text-ink-muted">{formatRupiah(p.price)}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <EmptyState title="Belum ada pesanan" message="Pesanan Anda akan muncul di sini." icon="folder-open" />
            )}
        </>
    );
}