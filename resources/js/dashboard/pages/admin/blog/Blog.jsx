import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api';
import Icon from '../../../components/Icon';
import { PageHeader, EmptyState, Confirm, formatDate } from '../../../components/ui';
import Skeleton from '../../../components/Skeleton';
import { toast } from '../../../lib/toast';

export default function Blog() {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [status, setStatus] = useState('');
    const [deleting, setDeleting] = useState(null);

    const load = () => {
        setLoading(true);
        api.get('/blog', { params: { q: q || undefined, status: status || undefined, per_page: 20 } })
            .then(({ data }) => setItems(data.data))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    };

    useEffect(load, [q, status]);

    useEffect(() => {
        api.get('/categories').then(({ data }) => setCategories(data)).catch(() => {});
    }, []);

    const performDelete = async () => {
        try {
            await api.delete(`/blog/${deleting.id}`);
            toast.success('Artikel dipindah ke Recycle Bin.');
            setDeleting(null);
            load();
        } catch {
            toast.error('Gagal menghapus artikel.');
        }
    };

    const statusBadge = (item) => {
        return item.status === 'published'
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            : 'bg-zinc-500/15 text-ink-muted';
    };

    return (
        <>
            <PageHeader
                title="Blog"
                subtitle="Kelola artikel blog untuk website Anda."
                action={
                    <Link to="/dashboard/blog/create" className="btn-primary">
                        <Icon name="plus" size={18} /> Tulis Artikel
                    </Link>
                }
            />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                    {[
                        { value: '', label: 'Semua' },
                        { value: 'published', label: 'Terbit' },
                        { value: 'draft', label: 'Draf' },
                    ].map((s) => (
                        <button
                            key={s.value}
                            onClick={() => setStatus(s.value)}
                            className={`chip ${status === s.value ? 'chip-active' : ''}`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
                <div className="relative w-full sm:w-64">
                    <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input
                        className="input pl-9"
                        placeholder="Cari artikel..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <Skeleton variant="table" />
            ) : items.length > 0 ? (
                <div className="card overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Artikel</th>
                                <th>Kategori</th>
                                <th>Status</th>
                                <th>Tanggal</th>
                                <th className="text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                                                <img
                                                    src={item.thumbnail_url || item.cover_url}
                                                    alt={item.title}
                                                    className="h-full w-full object-cover"
                                                    loading="lazy"
                                                />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-ink">{item.title}</p>
                                                <p className="text-xs text-ink-muted">Oleh {item.author?.name || 'Sistem'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="inline-flex rounded-md bg-surface-muted px-2 py-1 text-xs text-ink-muted">
                                            {item.category?.name || 'Tanpa Kategori'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${statusBadge(item)}`}>
                                            {item.status === 'published' ? 'Terbit' : 'Draf'}
                                        </span>
                                    </td>
                                    <td className="text-xs text-ink-muted">
                                        {formatDate(item.published_at || item.created_at)}
                                    </td>
                                    <td>
                                        <div className="flex justify-end gap-1">
                                            {item.status === 'published' && (
                                                <a href={`/blog/${item.slug}`} target="_blank" rel="noreferrer" className="btn-outline !p-1.5" title="Lihat">
                                                    <Icon name="eye" size={16} />
                                                </a>
                                            )}
                                            <Link to={`/dashboard/blog/${item.id}/edit`} className="btn-outline !p-1.5" title="Edit">
                                                <Icon name="edit" size={16} />
                                            </Link>
                                            <button className="btn-outline !p-1.5 hover:!border-red-500 hover:!text-red-500" onClick={() => setDeleting(item)} title="Hapus">
                                                <Icon name="trash" size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState title="Belum ada artikel" message="Mulai bagikan cerita, tips, dan penawaran Anda." icon="file-text" />
            )}

            <Confirm
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={performDelete}
                title="Hapus Artikel"
                message={`Anda yakin ingin menghapus artikel "${deleting?.title}"? Artikel dipindah ke Recycle Bin dan bisa dipulihkan.`}
                confirmText="Ya, Hapus Artikel"
                danger
            />
        </>
    );
}