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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((item) => (
                        <Link key={item.id} to={`/dashboard/pesanan/${item.id}`} className="card group p-5">
                            <div className="flex items-start justify-between gap-2">
                                <h3 className="font-bold text-ink group-hover:text-brand-600 dark:group-hover:text-brand-400">
                                    {item.name}
                                </h3>
                                <StatusBadge value={item.status} />
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
                                <span className="flex items-center gap-1.5 font-mono">
                                    PSN-{item.order_no}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Icon name="calendar" size={14} />
                                    {item.event_date ? formatDate(item.event_date) : 'Segera'}
                                </span>
                                {item.price !== null && item.price !== undefined && (
                                    <span className="font-semibold text-ink">{formatRupiah(item.price)}</span>
                                )}
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