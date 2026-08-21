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
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const { show, node } = useToast();

    const load = (page = 1) => {
        setLoading(true);
        api.get('/subscribers', { params: { page, search: debounced || undefined, status: statusFilter || undefined } })
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
    }, [debounced, statusFilter]);

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

    const handleDisable = async (user) => {
        setActionLoading(user.id);
        try {
            await api.post(`/subscribers/${user.id}/disable`);
            show('Subscriber dinonaktifkan.');
            setDetail(null);
            load(meta.current_page);
        } catch {
            show('Gagal menonaktifkan subscriber.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleActivate = async (user) => {
        setActionLoading(user.id);
        try {
            await api.post(`/subscribers/${user.id}/activate`);
            show('Subscriber diaktifkan.');
            setDetail(null);
            load(meta.current_page);
        } catch {
            show('Gagal mengaktifkan subscriber.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleResendOtp = async (user) => {
        setActionLoading(user.id);
        try {
            const { data } = await api.post(`/subscribers/${user.id}/resend-otp`);
            show(data.message || 'OTP dikirim ulang.');
            if (data.dev_otp) show(`Dev OTP: ${data.dev_otp}`);
        } catch (err) {
            show(err.response?.data?.message || 'Gagal mengirim OTP.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleSoftDelete = async () => {
        setActionLoading(deleting?.id);
        try {
            await api.post(`/subscribers/${deleting.id}/soft-delete`, { reason: deleteReason });
            show('Subscriber dipindahkan ke Recycle Bin.');
            setDeleting(null);
            setDeleteReason('');
            setDetail(null);
            load(meta.current_page);
        } catch (err) {
            show(err.response?.data?.message || 'Gagal menghapus subscriber.', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const STATUS_FILTERS = [
        { value: '', label: 'Semua' },
        { value: 'active', label: 'Aktif' },
        { value: 'pending', label: 'Menunggu' },
        { value: 'disabled', label: 'Nonaktif' },
    ];

    const statusBadge = (status) => {
        const map = {
            active: { label: 'Aktif', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
            pending: { label: 'Menunggu', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
            disabled: { label: 'Nonaktif', cls: 'bg-zinc-500/10 text-zinc-500' },
        };
        const s = map[status] || map.pending;
        return <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.cls}`}>{s.label}</span>;
    };

    return (
        <>
            <PageHeader title="Subscriber" subtitle="Kelola pengguna yang berlangganan blog." />

            <div className="mb-4 flex flex-wrap items-center gap-3">
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
                <div className="flex gap-1 rounded-lg border border-line bg-surface p-0.5">
                    {STATUS_FILTERS.map((f) => (
                        <button
                            key={f.value}
                            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${statusFilter === f.value ? 'bg-brand-500 text-white' : 'text-ink-muted hover:bg-surface-muted'}`}
                            onClick={() => setStatusFilter(f.value)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
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
                                                <img src={item.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                                            ) : (
                                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/20 text-xs font-bold text-brand-600 dark:text-brand-400">
                                                    {(item.name || '?').charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-ink">{item.name}</p>
                                                <p className="truncate text-xs text-ink-muted">{item.email}</p>
                                                {item.username && <p className="truncate text-xs text-ink-muted">@{item.username}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-1">
                                            <span className="inline-flex w-fit items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Subscribe</span>
                                            {item.is_client && (
                                                <span className="inline-flex w-fit items-center rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold text-brand-600 dark:text-brand-400">Klien</span>
                                            )}
                                            {statusBadge(item.status)}
                                            <PresenceBadge isOnline={item.is_online} lastSeenAt={item.last_seen_at} />
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

            {detail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetail(null)}>
                    <div className="w-full max-w-lg rounded-2xl border border-line bg-surface shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between border-b border-line px-6 py-4">
                            <h3 className="text-lg font-bold text-ink">Detail Subscriber</h3>
                            <button onClick={() => setDetail(null)} className="rounded-lg p-1 text-ink-muted hover:bg-surface-muted"><Icon name="x" size={20} /></button>
                        </div>
                        {detailLoading ? (
                            <div className="flex items-center justify-center py-12"><Skeleton /></div>
                        ) : (
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
                                            {statusBadge(detail.status)}
                                            {detail.is_client && (
                                                <span className="inline-flex items-center rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold text-brand-600 dark:text-brand-400">Klien</span>
                                            )}
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

                                <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
                                    {detail.status === 'pending' && (
                                        <button
                                            className="btn-outline text-xs"
                                            disabled={actionLoading === detail.id}
                                            onClick={() => handleResendOtp(detail)}
                                        >
                                            <Icon name="mail" size={14} className="mr-1" /> {actionLoading === detail.id ? 'Mengirim...' : 'Kirim Ulang OTP'}
                                        </button>
                                    )}
                                    {!detail.is_client && detail.status !== 'pending' && (
                                        detail.status === 'active' ? (
                                            <button
                                                className="btn-outline text-xs text-amber-600 hover:bg-amber-500/10"
                                                disabled={actionLoading === detail.id}
                                                onClick={() => handleDisable(detail)}
                                            >
                                                <Icon name="pause" size={14} className="mr-1" /> Nonaktifkan
                                            </button>
                                        ) : (
                                            <button
                                                className="btn-outline text-xs text-emerald-600 hover:bg-emerald-500/10"
                                                disabled={actionLoading === detail.id}
                                                onClick={() => handleActivate(detail)}
                                            >
                                                <Icon name="play" size={14} className="mr-1" /> Aktifkan
                                            </button>
                                        )
                                    )}
                                    {detail.is_client ? (
                                        <p className="text-xs text-ink-muted self-center">Subscriber ini juga klien. Hapus dari menu Klien.</p>
                                    ) : (
                                        <button
                                            className="btn-outline text-xs text-red-500 hover:bg-red-500/10"
                                            onClick={() => { setDeleting(detail); setDetail(null); }}
                                        >
                                            <Icon name="trash" size={14} className="mr-1" /> Hapus
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Confirm
                open={!!deleting}
                onClose={() => { setDeleting(null); setDeleteReason(''); }}
                onConfirm={handleSoftDelete}
                title={`Hapus "${deleting?.name}"?`}
                message={
                    <div className="space-y-2">
                        <p className="text-sm text-ink-muted">Subscriber akan dipindahkan ke Recycle Bin. Bisa dipulihkan kembali dari sana.</p>
                        <input className="input" placeholder="Alasan (opsional)" value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} autoFocus />
                    </div>
                }
            />
            {node}
        </>
    );
}
