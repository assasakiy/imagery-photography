import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { toast } from '../../lib/toast';
import { getApiErrorMessage } from '../../lib/errors';
import Icon from '../../components/Icon';
import { PageHeader, EmptyState, Modal, Confirm, Field, formatDate } from '../../components/ui';
import Skeleton from '../../components/Skeleton';

function Stars({ value, size = 18 }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <Icon key={n} name="star" size={size} className={n <= value ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-700'} />
            ))}
        </div>
    );
}

export default function Reviews() {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [stats, setStats] = useState({ all: 0, ratings: {} });
    const [rating, setRating] = useState('');
    const [q, setQ] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(null);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const load = (page = 1) => {
        setLoading(true);
        api.get('/reviews', {
            params: {
                page,
                rating: rating === '' ? undefined : rating,
                q: search || undefined,
            },
        })
            .then(({ data }) => {
                setItems(data.data);
                setMeta(data);
                if (data.stats) setStats(data.stats);
            })
            .catch(() => toast.error('Gagal memuat data.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [rating, search]);

    const handleEdit = async (e) => {
        e.preventDefault();
        setActing(editing.id);
        try {
            await api.put(`/reviews/${editing.id}`, {
                name: editing.name,
                service: editing.service,
                rating: editing.rating,
                title: editing.title,
                content: editing.content,
            });
            toast.success('Review diperbarui.');
            setEditing(null);
            load(meta.current_page);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal memperbarui review.'));
        } finally {
            setActing(null);
        }
    };

    const handleDelete = async () => {
        setActing(deleting.id);
        try {
            await api.delete(`/reviews/${deleting.id}`);
            toast.success('Review dihapus.');
            setDeleting(null);
            load(meta.current_page);
        } finally {
            setActing(null);
        }
    };

    const ratingTabs = [
        { key: '', label: 'Semua' },
        { key: '5', label: '5★' },
        { key: '4', label: '4★' },
        { key: '3', label: '3★' },
        { key: '2', label: '2★' },
        { key: '1', label: '1★' },
    ];

    return (
        <>
            <PageHeader title="Review" subtitle="Semua review dari klien." />

            <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap gap-2">
                    {ratingTabs.map((r) => (
                        <button key={r.key || 'all'} className={`chip ${rating === r.key ? 'chip-active' : ''}`} onClick={() => setRating(r.key)}>
                            {r.label}
                            {r.key && stats.ratings?.[Number(r.key)] ? ` (${stats.ratings[Number(r.key)]})` : ''}
                        </button>
                    ))}
                </div>

                <form
                    className="min-w-[180px] flex-1"
                    onSubmit={(e) => {
                        e.preventDefault();
                        setSearch(q);
                    }}
                >
                    <div className="relative">
                        <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                        <input
                            className="input w-full !pl-10"
                            placeholder="Cari nama klien, email, pesanan, atau isi review…"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </div>
                </form>
            </div>

            {loading ? (
                <Skeleton variant="card" />
            ) : items.length ? (
                <div className="space-y-3">
                    {items.map((item) => (
                        <div key={item.id} className="card p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-bold text-ink">{item.name}</p>
                                    </div>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <Stars value={item.rating} />
                                        {item.service && <span className="text-xs text-ink-muted">{item.service}</span>}
                                        {item.order_no && (
                                            <span className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">PSN-{item.order_no}</span>
                                        )}
                                    </div>
                                    {item.title && <p className="mt-2 font-medium text-ink">{item.title}</p>}
                                    <p className="mt-1 text-sm leading-relaxed text-ink-muted">{item.content}</p>
                                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                                        {item.client && (
                                            <span className="flex items-center gap-1">
                                                <Icon name="user" size={13} /> {item.client.name} · {item.client.email}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1"><Icon name="calendar" size={13} /> {formatDate(item.created_at)}</span>
                                    </div>
                                </div>
                                <div className="flex shrink-0 flex-wrap gap-1">
                                    {item.project_id && (
                                        <Link
                                            to={`/dashboard/projects/${item.project?.order_no || item.project_id}`}
                                            className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-brand-600"
                                            title="Lihat pesanan"
                                        >
                                            <Icon name="folder-open" size={16} />
                                        </Link>
                                    )}
                                    <button className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-brand-600" title="Edit" onClick={() => setEditing({ ...item })}>
                                        <Icon name="edit" size={16} />
                                    </button>
                                    <button className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-red-500" title="Hapus" onClick={() => setDeleting(item)}>
                                        <Icon name="trash" size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {meta.last_page > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                            <button className="btn-outline text-xs disabled:opacity-40" disabled={!meta.prev_page_url} onClick={() => load(meta.current_page - 1)}>
                                Sebelumnya
                            </button>
                            <span className="text-sm text-ink-muted">Hal {meta.current_page}/{meta.last_page}</span>
                            <button className="btn-outline text-xs disabled:opacity-40" disabled={!meta.next_page_url} onClick={() => load(meta.current_page + 1)}>
                                Berikutnya
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <EmptyState icon="star" title="Belum ada review" message="Review yang ditulis klien akan muncul di sini." />
            )}

            <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Review" footer={
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Batal</button>
                    <button type="submit" form="review-form" className="btn-primary" disabled={acting === editing?.id}>Simpan</button>
                </div>
            }>
                {editing && (
                    <form id="review-form" onSubmit={handleEdit} className="space-y-4">
                        <Field label="Nama">
                            <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                        </Field>
                        <Field label="Layanan">
                            <input className="input" value={editing.service || ''} onChange={(e) => setEditing({ ...editing, service: e.target.value })} />
                        </Field>
                        <Field label="Rating">
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <button key={n} type="button" onClick={() => setEditing({ ...editing, rating: n })} aria-label={`${n} bintang`}>
                                        <Icon name="star" size={20} className={n <= editing.rating ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-700'} />
                                    </button>
                                ))}
                            </div>
                        </Field>
                        <Field label="Judul">
                            <input className="input" value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                        </Field>
                        <Field label="Review">
                            <textarea className="input min-h-[100px]" value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} />
                        </Field>
                    </form>
                )}
            </Modal>

            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title="Hapus review?" />
        </>
    );
}
