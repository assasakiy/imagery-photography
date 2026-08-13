import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api';
import Icon from '../../../components/Icon';
import { PageHeader, EmptyState, formatRupiah, formatDate } from '../../../components/ui';
import Skeleton from '../../../components/Skeleton';

const statusOptions = [
    { value: 'scheduled', label: 'Dijadwalkan', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    { value: 'shooting', label: 'Pemotretan', color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
    { value: 'editing', label: 'Editing', color: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400' },
    { value: 'awaiting_payment', label: 'Preview Tersedia', color: 'bg-orange-500/15 text-orange-600 dark:text-orange-400' },
    { value: 'completed', label: 'Selesai', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    { value: 'archived', label: 'Diarsipkan', color: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400' },
];

export function StatusBadge({ value }) {
    const item = statusOptions.find((s) => s.value === value);
    return <span className={`badge ${item?.color || ''}`}>{item?.label || value}</span>;
}

export default function Orders() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');

    const load = () => {
        setLoading(true);
        api.get('/projects', { params: { status: status || undefined } })
            .then(({ data }) => setItems(data))
            .finally(() => setLoading(false));
    };

    useEffect(load, [status]);

    return (
        <>
            <PageHeader title="Pesanan" subtitle="Pantau progress dan file pesanan Anda." />

            <div className="mb-4 flex flex-wrap gap-2">
                <button className={`chip ${!status ? 'chip-active' : ''}`} onClick={() => setStatus('')}>
                    Semua
                </button>
                {statusOptions.map((s) => (
                    <button key={s.value} className={`chip ${status === s.value ? 'chip-active' : ''}`} onClick={() => setStatus(s.value)}>
                        {s.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <Skeleton variant="card" />
            ) : items.length ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {items.map((item) => (
                        <div key={item.id} className="card flex flex-col p-5">
                            <div className="flex items-center justify-between gap-2">
                                <p className="font-mono text-xs font-semibold text-ink-muted">PSN-{item.order_no}</p>
                                <StatusBadge value={item.status} />
                            </div>
                            <h3 className="mt-1 font-bold text-ink">{item.name}</h3>
                            {item.description && <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{item.description}</p>}
                            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
                                <span className="flex items-center gap-1.5">
                                    <Icon name="calendar" size={14} />
                                    {item.event_date ? formatDate(item.event_date) : 'Segera'}
                                </span>
                            </div>
                            <div className="mt-4 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs text-ink-muted">Sisa Pembayaran</p>
                                    <p className={`font-bold ${Number(item.remaining || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {formatRupiah(item.remaining)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-ink-muted">Total Tagihan</p>
                                    <p className="font-semibold text-ink">{formatRupiah(item.price)}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-1 items-end gap-2">
                                {item.has_preview ? (
                                    <>
                                        <Link
                                            to={`/dashboard/preview/${item.order_no || item.id}`}
                                            className="btn-primary flex-1 justify-center py-2"
                                        >
                                            <Icon name="eye" size={14} /> Lihat Preview
                                        </Link>
                                        <Link to={`/dashboard/pesanan/${item.order_no || item.id}`} className="btn-outline justify-center py-2" title="Detail Pesanan">
                                            <Icon name="folder-open" size={14} />
                                        </Link>
                                    </>
                                ) : (
                                    <Link to={`/dashboard/pesanan/${item.order_no || item.id}`} className="btn-outline flex-1 justify-center py-2">
                                        <Icon name="folder-open" size={14} /> Detail Pesanan
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState title="Belum ada pesanan" message="Pesanan Anda akan muncul di sini." icon="folder-open" />
            )}
        </>
    );
}