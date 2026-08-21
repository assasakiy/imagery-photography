import { useEffect, useState } from 'react';
import api from '../../api';
import { toast } from '../../lib/toast';
import { getApiErrorMessage } from '../../lib/errors';
import Icon from '../../components/Icon';
import PresenceBadge from '../../components/PresenceBadge';
import FilterDropdown from '../../components/FilterDropdown';
import { PageHeader, EmptyState, Confirm, formatDate } from '../../components/ui';
import Skeleton from '../../components/Skeleton';

export default function Subscribers() {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [stats, setStats] = useState({});
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    const load = (page = 1) => {
        setLoading(true);
        api.get('/subscribers', { params: { page, search: debounced || undefined, status: statusFilter || undefined } })
            .then(({ data }) => {
                setItems(data.data);
                setMeta(data);
                setStats(data.stats || {});
            })
            .catch(() => toast.error('Gagal memuat data.'))
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
            toast.error('Gagal memuat detail subscriber.');
        } finally {
            setDetailLoading(false);
        }
    };

    const handleDisable = async (user) => {
        setActionLoading(user.id);
        try {
            await api.post(`/subscribers/${user.id}/disable`);
            toast.success('Subscriber dinonaktifkan.');
            setDetail(null);
            load(meta.current_page);
        } catch {
            toast.error('Gagal menonaktifkan subscriber.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleActivate = async (user) => {
        setActionLoading(user.id);
        try {
            await api.post(`/subscribers/${user.id}/activate`);
            toast.success('Subscriber diaktifkan.');
            setDetail(null);
            load(meta.current_page);
        } catch {
            toast.error('Gagal mengaktifkan subscriber.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleResendOtp = async (user) => {
        setActionLoading(user.id);
        try {
            const { data } = await api.post(`/subscribers/${user.id}/resend-otp`);
            toast.success(data.message || 'OTP dikirim ulang.');
            if (data.dev_otp) toast.success(`Dev OTP: ${data.dev_otp}`);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal mengirim OTP.'));
        } finally {
            setActionLoading(null);
        }
    };

    const handleSoftDelete = async () => {
        setActionLoading(deleting?.id);
        try {
            await api.post(`/subscribers/${deleting.id}/soft-delete`, { reason: deleteReason });
            toast.success('Subscriber dipindahkan ke Recycle Bin.');
            setDeleting(null);
            setDeleteReason('');
            setDetail(null);
            load(meta.current_page);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal menghapus subscriber.'));
        } finally {
            setActionLoading(null);
        }
    };

    const STATUS_FILTERS = [
        { key: 'active', label: 'Aktif', icon: 'check' },
        { key: 'pending', label: 'Menunggu', icon: 'clock' },
        { key: 'disabled', label: 'Nonaktif', icon: 'eye-off' },
    ];

    const subscriberKpis = [
        { label: 'Total Subscriber', value: Number(stats.total || 0).toLocaleString('id-ID'), icon: 'users', color: 'bg-brand-500/15 text-brand-600 dark:text-brand-400' },
        { label: 'Subscriber Aktif', value: Number(stats.active || 0).toLocaleString('id-ID'), icon: 'user-check', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', trend: { up: true, text: `${stats.active_percentage || 0}%` } },
        { label: 'Baru Bulan Ini', value: `+${Number(stats.new_this_month || 0).toLocaleString('id-ID')}`, icon: 'user', color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400', trend: stats.new_growth_percentage !== null && stats.new_growth_percentage !== undefined ? { up: stats.new_growth_percentage >= 0, text: `${Math.abs(stats.new_growth_percentage)}%` } : null },
        { label: 'Subscriber Nonaktif', value: Number(stats.disabled || 0).toLocaleString('id-ID'), icon: 'eye-off', color: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400', trend: { up: false, text: `${stats.disabled_percentage || 0}%` } },
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

            <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {subscriberKpis.map((kpi) => (
                    <div key={kpi.label} className="card p-4">
                        <div className="flex items-start justify-between">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${kpi.color}`}>
                                <Icon name={kpi.icon} size={18} />
                            </div>
                            {kpi.trend && (
                                <span className={`badge ${kpi.trend.up ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'}`}>
                                    <Icon name="trending-up" size={11} className={kpi.trend.up ? '' : 'rotate-180'} /> {kpi.trend.text}
                                </span>
                            )}
                        </div>
                        <p className="mt-3 text-xl font-bold text-ink">{kpi.value}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">{kpi.label}</p>
                    </div>
                ))}
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-x-1.5 gap-y-2">
                <form className="relative w-full md:w-96" onSubmit={(e) => { e.preventDefault(); setDebounced(search.trim()); }}>
                    <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input
                        className="input pl-9"
                        placeholder="Cari nama, email, atau username…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button type="button" aria-label="Hapus pencarian" onClick={() => { setSearch(''); setDebounced(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink">
                            <Icon name="x" size={14} />
                        </button>
                    )}
                </form>
                <div className="ml-auto flex w-full flex-wrap items-center gap-1.5 md:w-auto">
                    <FilterDropdown title="Filter Status" icon="users" value={statusFilter} onChange={setStatusFilter} options={STATUS_FILTERS} />
                </div>
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
        </>
    );
}
