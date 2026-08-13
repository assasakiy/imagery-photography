import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import Icon from '../../components/Icon';
import { PageHeader, EmptyState } from '../../components/ui';
import Skeleton from '../../components/Skeleton';

const statusOptions = [
    { value: 'scheduled', label: 'Dijadwalkan', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    { value: 'shooting', label: 'Pemotretan', color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400' },
    { value: 'editing', label: 'Editing', color: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400' },
    { value: 'awaiting_payment', label: 'Preview Tersedia', color: 'bg-orange-500/15 text-orange-600 dark:text-orange-400' },
    { value: 'completed', label: 'Selesai', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    { value: 'archived', label: 'Diarsipkan', color: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400' },
];

function StatusBadge({ value }) {
    const item = statusOptions.find((s) => s.value === value);
    return <span className={`badge ${item?.color || ''}`}>{item?.label || value}</span>;
}

function formatLongDate(value) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Preview() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/customer/gallery')
            .then(({ data }) => setItems(data))
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <PageHeader title="Preview & Galeri" subtitle="Lihat hasil pesanan Anda." />

            {loading ? (
                <Skeleton variant="card" />
            ) : items.length ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((p) => {
                        const files = (p.files || []).filter((f) => f.url);
                        const cover = p.thumb_url ? { url: p.thumb_url, name: 'Sampul' } : files.find((f) => f.category === 'photo' || f.type?.startsWith('image/')) || files[0];
                        const photoCount = files.filter((f) => f.category === 'photo' || f.type?.startsWith('image/')).length;
                        const videoCount = files.filter((f) => f.category === 'video').length;
                        const paymentBadge = p.archived
                            ? null
                            : p.preview_expired
                              ? { label: 'Preview Berakhir', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' }
                              : p.is_paid
                                ? { label: 'Lunas', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' }
                                : { label: 'Menunggu Pembayaran', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' };
                        return (
                            <div key={p.id} className="card group flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl">
                                <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
                                    {cover ? (
                                        <img src={cover.url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    ) : (
                                        <div className="h-full w-full bg-gradient-to-br from-brand-500/70 via-brand-600/70 to-brand-800/70" />
                                    )}
                                    <span className="absolute left-3 top-3 rounded-lg bg-black/55 px-2 py-0.5 font-mono text-xs font-bold text-white backdrop-blur-sm">PSN-{p.order_no}</span>
                                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-black/55 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                                        <Icon name="image" size={12} /> {files.length}
                                    </span>
                                    <span className="absolute bottom-3 left-3 text-xs font-medium text-white/90">{cover ? cover.name : 'Sampul pratinjau'}</span>
                                </div>
                                <div className="flex flex-1 flex-col gap-3 p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-bold text-ink">{p.name}</h3>
                                        <StatusBadge value={p.status} />
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                                        {paymentBadge && <span className={`badge ${paymentBadge.cls}`}>{paymentBadge.label}</span>}
                                        {p.client_name && (
                                            <span className="flex items-center gap-1.5">
                                                <Icon name="user" size={14} /> {p.client_name}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1.5">
                                            <Icon name="calendar" size={14} /> {p.event_date ? formatLongDate(p.event_date) : '—'}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Icon name="image" size={14} /> {photoCount} Foto{videoCount > 0 && <> · {videoCount} Video</>}
                                        </span>
                                    </div>
                                    <div className="flex-1" />
                                    <Link to={`/dashboard/preview/${p.order_no || p.id}`} className="btn-primary w-full">
                                        Lihat Preview
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <EmptyState title="Belum ada preview" message="Belum ada file media yang diupload untuk pesanan Anda." icon="image" />
            )}
        </>
    );
}