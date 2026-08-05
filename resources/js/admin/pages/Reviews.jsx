import { useEffect, useState } from 'react';
import api from '../api';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Spinner, EmptyState, Modal, Confirm, Field, useToast } from '../components/ui';

const STATUS_LABEL = { pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' };
const STATUS_STYLE = {
    pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    approved: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    rejected: 'bg-red-500/15 text-red-600 dark:text-red-400',
};

function Stars({ value, onChange, size = 20 }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    type="button"
                    disabled={!onChange}
                    onClick={() => onChange?.(n)}
                    className={onChange ? 'cursor-pointer' : 'cursor-default'}
                    aria-label={`${n} bintang`}
                >
                    <Icon name="star" size={size} className={n <= value ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-700'} />
                </button>
            ))}
        </div>
    );
}

function ClientReview() {
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: '', service: '', rating: 5, content: '' });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const { show, node } = useToast();

    const load = () => {
        api.get('/reviews/my')
            .then(({ data }) => setReview(data.review))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    if (loading) return <Spinner />;

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            await api.post('/reviews', form);
            show('Review terkirim. Menunggu persetujuan.');
            load();
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
            else show('Gagal mengirim review.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (review) {
        return (
            <>
                <PageHeader title="Review" subtitle="Terima kasih sudah memberi penilaian." />
                <div className="card mx-auto max-w-lg p-6 text-center">
                    <div className="mb-3 flex justify-center">
                        <Stars value={review.rating} />
                    </div>
                    <p className="text-ink">{review.content}</p>
                    <p className="mt-3 text-sm text-ink-muted">{review.service || 'Tanpa layanan'}</p>
                    <span className={`badge mt-4 ${STATUS_STYLE[review.status]}`}>{STATUS_LABEL[review.status]}</span>
                </div>
                {node}
            </>
        );
    }

    return (
        <>
            <PageHeader title="Kirim Review" subtitle="Bagikan pengalaman Anda bersama kami." />
            <form onSubmit={submit} className="card mx-auto max-w-lg p-6">
                <div className="space-y-4">
                    <Field label="Nama" required error={errors.name?.[0]}>
                        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </Field>
                    <Field label="Layanan" hint="opsional" error={errors.service?.[0]}>
                        <input className="input" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} placeholder="Wedding, Prewedding, Event…" />
                    </Field>
                    <Field label="Rating" required error={errors.rating?.[0]}>
                        <Stars value={form.rating} onChange={(n) => setForm({ ...form, rating: n })} />
                    </Field>
                    <Field label="Review" required error={errors.content?.[0]}>
                        <textarea className="input min-h-[120px]" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
                    </Field>
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="btn-primary" disabled={saving}>
                            <Icon name="send" size={16} /> {saving ? 'Mengirim…' : 'Kirim Review'}
                        </button>
                    </div>
                </div>
            </form>
            {node}
        </>
    );
}

function Moderation() {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [filter, setFilter] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const { show, node } = useToast();

    const load = (page = 1, status = filter) => {
        setLoading(true);
        api.get('/reviews', { params: { page, status: status === 'all' ? undefined : status } })
            .then(({ data }) => {
                setItems(data.data);
                setMeta(data);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load(1, filter);
    }, [filter]);

    const setStatus = async (item, status) => {
        await api.patch(`/reviews/${item.id}/status`, { status });
        show(status === 'approved' ? 'Review disetujui.' : status === 'rejected' ? 'Review ditolak.' : 'Status diperbarui.');
        load(meta.current_page);
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        await api.put(`/reviews/${editing.id}`, editing);
        show('Review diperbarui.');
        setEditing(null);
        load(meta.current_page);
    };

    const handleDelete = async () => {
        await api.delete(`/reviews/${deleting.id}`);
        show('Review dihapus.');
        setDeleting(null);
        load(meta.current_page);
    };

    const tabs = [
        { key: 'pending', label: 'Menunggu' },
        { key: 'approved', label: 'Disetujui' },
        { key: 'rejected', label: 'Ditolak' },
        { key: 'all', label: 'Semua' },
    ];

    return (
        <>
            <PageHeader title="Review" subtitle="Kelola review dari klien." />
            <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-surface-muted p-1">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setFilter(t.key)}
                        className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold sm:text-sm ${filter === t.key ? 'bg-surface text-ink shadow' : 'text-ink-muted hover:text-ink'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <Spinner />
            ) : items.length ? (
                <div className="space-y-3">
                    {items.map((item) => (
                        <div key={item.id} className="card p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-ink">{item.name}</p>
                                        <span className={`badge ${STATUS_STYLE[item.status]}`}>{STATUS_LABEL[item.status]}</span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                        <Stars value={item.rating} />
                                        <span className="text-xs text-ink-muted">{item.service || 'Tanpa layanan'}</span>
                                    </div>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                    {item.status !== 'approved' && (
                                        <button className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-emerald-600" title="Setujui" onClick={() => setStatus(item, 'approved')}>
                                            <Icon name="check" size={16} />
                                        </button>
                                    )}
                                    {item.status !== 'rejected' && (
                                        <button className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-red-500" title="Tolak" onClick={() => setStatus(item, 'rejected')}>
                                            <Icon name="x" size={16} />
                                        </button>
                                    )}
                                    <button className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-brand-600" title="Edit" onClick={() => setEditing({ ...item })}>
                                        <Icon name="edit" size={16} />
                                    </button>
                                    <button className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-red-500" title="Hapus" onClick={() => setDeleting(item)}>
                                        <Icon name="trash" size={16} />
                                    </button>
                                </div>
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-ink-muted">{item.content}</p>
                            <p className="mt-2 text-xs text-ink-muted">{item.client_name ? `Oleh ${item.client_name}` : ''}</p>
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
                <EmptyState icon="star" title="Belum ada review" />
            )}

            <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Review">
                {editing && (
                    <form onSubmit={handleEdit} className="space-y-4">
                        <Field label="Nama">
                            <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                        </Field>
                        <Field label="Layanan">
                            <input className="input" value={editing.service || ''} onChange={(e) => setEditing({ ...editing, service: e.target.value })} />
                        </Field>
                        <Field label="Rating">
                            <Stars value={editing.rating} onChange={(n) => setEditing({ ...editing, rating: n })} />
                        </Field>
                        <Field label="Review">
                            <textarea className="input min-h-[100px]" value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} />
                        </Field>
                        <div className="flex justify-end gap-2">
                            <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Batal</button>
                            <button type="submit" className="btn-primary">Simpan</button>
                        </div>
                    </form>
                )}
            </Modal>

            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title="Hapus review?" />
            {node}
        </>
    );
}

export default function Reviews() {
    const { user } = useAuth();
    return user?.role === 'client' ? <ClientReview /> : <Moderation />;
}
