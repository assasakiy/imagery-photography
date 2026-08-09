import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import Icon from '../../components/Icon';
import { PageHeader, Spinner, EmptyState, Confirm, formatDate } from '../../components/ui';

const CATEGORY_META = {
    pesan: { label: 'Pesan', cls: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    booking: { label: 'Booking', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    review: { label: 'Review', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    sistem: { label: 'Sistem', cls: 'bg-surface-muted text-ink-muted' },
};

const FILTERS = [
    { key: 'semua', label: 'Semua' },
    { key: 'pesan', label: 'Pesan' },
    { key: 'booking', label: 'Booking' },
    { key: 'review', label: 'Review' },
    { key: 'sistem', label: 'Sistem' },
];

export default function Notifications() {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);
    const [category, setCategory] = useState('semua');

    const load = (page = 1, cat = category) => {
        setLoading(true);
        api.get('/notifications', { params: { page, per_page: 20, category: cat !== 'semua' ? cat : undefined } })
            .then(({ data }) => {
                setItems(data.data);
                setMeta(data);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load(1, category);
    }, [category]);

    const markRead = async (n) => {
        if (!n.read_at) {
            await api.patch(`/notifications/${n.id}/read`);
            load(meta.current_page);
        }
    };

    const markAll = async () => {
        await api.patch('/notifications/read-all');
        load(meta.current_page);
    };

    const clearAll = async () => {
        setClearing(false);
        await api.delete('/notifications');
        setItems([]);
        setMeta({});
    };

    const cardClass = (n) =>
        `flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-surface-muted ${!n.read_at ? 'bg-brand-500/5' : ''}`;

    const cardBody = (n) => (
        <>
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${n.read_at ? 'bg-surface-muted ring-1 ring-line' : 'bg-brand-500'}`} />
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{n.data.title || 'Notifikasi'}</p>
                    {CATEGORY_META[n.category] && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_META[n.category].cls}`}>
                            {CATEGORY_META[n.category].label}
                        </span>
                    )}
                </div>
                <p className="mt-0.5 text-sm text-ink-muted">{n.data.body || n.data.message || ''}</p>
                <p className="mt-1 text-xs text-ink-muted">{formatDate(n.created_at)}</p>
            </div>
        </>
    );

    return (
        <>
            <PageHeader
                title="Notifikasi"
                subtitle="Pemberitahuan dari dalam sistem, termasuk pesan dan booking baru."
                action={
                    items.length ? (
                        <div className="flex flex-wrap gap-2">
                            {items.some((n) => !n.read_at) && (
                                <button className="btn-outline" onClick={markAll}>
                                    <Icon name="check" size={16} /> Tandai semua dibaca
                                </button>
                            )}
                            <button className="btn-outline text-red-600 hover:bg-red-50 dark:text-red-400" onClick={() => setClearing(true)}>
                                <Icon name="trash" size={16} /> Hapus semua
                            </button>
                        </div>
                    ) : undefined
                }
            />

            <div className="mb-4 flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                    <button
                        key={f.key}
                        className={`chip ${category === f.key ? 'chip-active' : ''}`}
                        onClick={() => setCategory(f.key)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <Spinner />
            ) : items.length ? (
                <div className="card">
                    <ul className="divide-y divide-line">
                        {items.map((n) => (
                            <li key={n.id}>
                                {n.url ? (
                                    <Link to={n.url} onClick={() => markRead(n)} className={cardClass(n)}>
                                        {cardBody(n)}
                                    </Link>
                                ) : (
                                    <button onClick={() => markRead(n)} className={cardClass(n)}>
                                        {cardBody(n)}
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                    {meta.last_page > 1 && (
                        <div className="flex items-center justify-between px-4 py-3">
                            <button className="btn-outline disabled:opacity-40" disabled={!meta.prev_page_url} onClick={() => load(meta.current_page - 1)}>
                                Sebelumnya
                            </button>
                            <span className="text-sm text-ink-muted">Halaman {meta.current_page} dari {meta.last_page}</span>
                            <button className="btn-outline disabled:opacity-40" disabled={!meta.next_page_url} onClick={() => load(meta.current_page + 1)}>
                                Berikutnya
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <EmptyState icon="bell" title="Tidak ada notifikasi" message="Tidak ada notifikasi pada kategori ini." />
            )}

            <Confirm
                open={clearing}
                onClose={() => setClearing(false)}
                onConfirm={clearAll}
                title="Hapus semua notifikasi?"
                message="Semua notifikasi akan dihapus permanen dari akun Anda."
            />
        </>
    );
}
