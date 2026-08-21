import { useEffect, useState } from 'react';
import api from '../../api';
import Icon from '../../components/Icon';
import PresenceBadge from '../../components/PresenceBadge';
import { PageHeader, EmptyState, Confirm, useToast, formatDate } from '../../components/ui';
import Skeleton from '../../components/Skeleton';

export default function Subscribers() {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const { show, node } = useToast();

    const load = (page = 1) => {
        setLoading(true);
        api.get('/subscribers', { params: { page, search: debounced || undefined } })
            .then(({ data }) => {
                setItems(data.data);
                setMeta(data);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const t = setTimeout(() => setDebounced(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        load();
    }, [debounced]);

    const openDetail = async (item) => {
        setDetailLoading(true);
        try {
            const { data } = await api.get(`/subscribers/${item.id}`);
            setDetail(data);
        } catch {
            show('Gagal memuat detail subscriber.', 'error');
        } finally {
            setDetailLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/subscribers/${deleting.id}`);
            show('Subscriber dihapus.');
            setDeleting(null);
            setDetail(null);
            load(meta.current_page);
        } catch (err) {
            show(err.response?.data?.message || 'Gagal menghapus subscriber.', 'error');
        }
    };

    return (
        <>
            <PageHeader title="Subscriber" subtitle="Kelola pengguna yang berlangganan blog." />

            <div className="mb-4 flex items-center gap-3">
                <form
                    className="min-w-[180px] flex-1"
                    onSubmit={(e) => { e.preventDefault(); setDebounced(search); }}
                >
                    <div className="relative">
                        <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                        <input
                            className="input w-full !pl-10"
                            placeholder="Cari nama, email, atau username…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </form>
                <span className="text-sm text-ink-muted">{meta.total || 0} subscriber</span>
            </div>

            {loading ? (
                <Skeleton variant="table" />
            ) : items.length ? (
                <div className="overflow-x-auto rounded-xl border border-line">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-line bg-surface-muted text-xs font-semibold uppercase tracking-wider text-ink-muted">
                                <th className="px-4 py-3">Nama</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Bookmark</th>
                                <th className="px-4 py-3 text-right">Suka</th>
                                <th className="px-4 py-3 text-right">Komentar</th>
                                <th className="px-4 py-3">Bergabung</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {items.map((item) => (
                                <tr key={item.id} className="transition-colors hover:bg-surface-muted/50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {item.avatar ? (
                                                <img src={item.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                                            ) : (
                                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-600 dark:text-brand-400">
                                                    {(item.name || '?').charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-ink">{item.name}</p>
                                                {item.username && <p className="truncate text-xs text-ink-muted">@{item.username}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-ink-muted">{item.email}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <PresenceBadge isOnline={item.is_online} lastSeenAt={item.last_seen_at} />
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-500/10 text-zinc-500'}`}>
                                                {item.status === 'active' ? 'Aktif' : 'Pending'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right text-ink-muted">{item.bookmarks_count}</td>
                                    <td className="px-4 py-3 text-right text-ink-muted">{item.likes_count}</td>
                                    <td className="px-4 py-3 text-right text-ink-muted">{item.comments_count}</td>
                                    <td className="px-4 py-3 text-ink-muted">{formatDate(item.created_at)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-brand-600" title="Detail" onClick={() => openDetail(item)}>
                                            <Icon name="eye" size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState icon="users" title="Belum ada subscriber" message="Pengguna yang berlangganan blog akan muncul di sini." />
            )}

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

            {/* Detail Modal */}
            {detail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetail(null)}>
                    <div className="w-full max-w-lg rounded-2xl border border-line bg-surface shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-line px-6 py-4">
                            <h3 className="text-lg font-bold text-ink">Detail Subscriber</h3>
                            <button onClick={() => setDetail(null)} className="rounded-lg p-1 text-ink-muted hover:bg-surface-muted"><Icon name="x" size={20} /></button>
                        </div>
                        <div className="px-6 py-4 space-y-4">
                            <div className="flex items-center gap-4">
                                {detail.avatar ? (
                                    <img src={detail.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
                                ) : (
                                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/20 text-xl font-bold text-brand-600 dark:text-brand-400">
                                        {(detail.name || '?').charAt(0).toUpperCase()}
                                    </span>
                                )}
                                <div>
                                    <p className="text-lg font-bold text-ink">{detail.name}</p>
                                    <p className="text-sm text-ink-muted">{detail.email}</p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <PresenceBadge isOnline={detail.is_online} lastSeenAt={detail.last_seen_at} />
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${detail.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-500/10 text-zinc-500'}`}>
                                            {detail.status === 'active' ? 'Aktif' : 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-xl border border-line bg-surface-muted p-3 text-center">
                                    <p className="text-2xl font-bold text-ink">{detail.bookmarks_count}</p>
                                    <p className="text-xs text-ink-muted">Bookmark</p>
                                </div>
                                <div className="rounded-xl border border-line bg-surface-muted p-3 text-center">
                                    <p className="text-2xl font-bold text-ink">{detail.likes_count}</p>
                                    <p className="text-xs text-ink-muted">Suka</p>
                                </div>
                                <div className="rounded-xl border border-line bg-surface-muted p-3 text-center">
                                    <p className="text-2xl font-bold text-ink">{detail.comments_count}</p>
                                    <p className="text-xs text-ink-muted">Komentar</p>
                                </div>
                            </div>

                            <div className="text-xs text-ink-muted">
                                <p>Bergabung: {formatDate(detail.created_at)}</p>
                                {detail.last_seen_at && <p>Terakhir aktif: {formatDate(detail.last_seen_at)}</p>}
                            </div>

                            {detail.bookmarks?.length > 0 && (
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Bookmark Terakhir</p>
                                    <div className="space-y-1.5">
                                        {detail.bookmarks.map((b) => (
                                            <div key={b.id} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                                                <Icon name="heart" size={14} className="text-rose-400" />
                                                <span className="capitalize text-ink-muted">{b.type}</span>
                                                <span className="truncate text-ink">{b.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {detail.recent_comments?.length > 0 && (
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Komentar Terakhir</p>
                                    <div className="space-y-1.5">
                                        {detail.recent_comments.map((c) => (
                                            <div key={c.id} className="rounded-lg border border-line px-3 py-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="capitalize text-ink-muted">{c.commentable_type}</span>
                                                    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${c.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-zinc-500/10 text-zinc-500'}`}>
                                                        {c.status}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-ink">{c.body}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 border-t border-line pt-4">
                                <button className="btn-outline text-red-500 hover:bg-red-500/10" onClick={() => { setDeleting(detail); setDetail(null); }}>
                                    <Icon name="trash" size={16} className="mr-1" /> Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title={`Hapus subscriber "${deleting?.name}"?`} />
            {node}
        </>
    );
}
