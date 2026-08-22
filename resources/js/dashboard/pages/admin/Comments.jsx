import { useEffect, useState } from 'react';
import api from '../../api';
import { toast } from '../../lib/toast';
import { getApiErrorMessage } from '../../lib/errors';
import Icon from '../../components/Icon';
import Avatar from '../../components/Avatar';
import { PageHeader, EmptyState, Confirm, formatDate } from '../../components/ui';
import Skeleton from '../../components/Skeleton';

export default function Comments() {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [status, setStatus] = useState('all');
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const load = (page = 1) => {
        setLoading(true);
        api.get('/comments/moderate/list', {
            params: {
                page,
                status: status === 'all' ? undefined : status,
            },
        })
            .then(({ data }) => {
                setItems(data.data);
                setMeta(data);
            })
            .catch(() => toast.error('Gagal memuat data.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [status]);

    const handleModerate = async (comment, next) => {
        setActing(comment.id);
        try {
            await api.patch(`/comments/${comment.id}/moderate`, { status: next });
            toast.success(next === 'approved' ? 'Komentar disetujui.' : 'Komentar disembunyikan.');
            load(meta.current_page);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal mengubah status komentar.'));
        } finally {
            setActing(null);
        }
    };

    const handleDelete = async () => {
        setActing(deleting.id);
        try {
            await api.delete(`/comments/${deleting.id}`);
            toast.success('Komentar dihapus.');
            setDeleting(null);
            load(meta.current_page);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal menghapus komentar.'));
        } finally {
            setActing(null);
        }
    };

    const statusTabs = [
        { key: 'all', label: 'Semua' },
        { key: 'approved', label: 'Disetujui' },
        { key: 'hidden', label: 'Disembunyikan' },
    ];

    return (
        <>
            <PageHeader title="Komentar" subtitle="Moderasi komentar dari blog, portofolio, dan paket." />

            <div className="mb-4 flex flex-wrap items-center gap-2">
                {statusTabs.map((t) => (
                    <button key={t.key} className={`chip ${status === t.key ? 'chip-active' : ''}`} onClick={() => setStatus(t.key)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <Skeleton variant="card" />
            ) : items.length ? (
                <div className="space-y-3">
                    {items.map((item) => (
                        <div key={item.id} className={`card p-5 ${item.status === 'hidden' ? 'opacity-70' : ''}`}>
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Avatar src={item.user?.avatar} name={item.user?.name || 'Subscriber'} size="xs" shape="xl" />
                                        <p className="font-bold text-ink">{item.user?.name || 'Subscriber'}</p>
                                        {item.status === 'hidden' && (
                                            <span className="chip chip-active !px-2 !py-0.5 text-[10px]">Disembunyikan</span>
                                        )}
                                    </div>
                                    {item.target && (
                                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
                                            <Icon name="message-circle" size={13} />
                                            <span className="font-semibold capitalize">{item.target.type}</span>
                                            <span>· {item.target.title}</span>
                                        </div>
                                    )}
                                    {item.parent && (
                                        <div className="mt-2 rounded-lg border-l-2 border-brand-500/30 bg-surface-muted px-3 py-2 text-xs text-ink-muted">
                                            Balasan untuk <span className="font-semibold text-ink">{item.parent.user?.name || 'Subscriber'}</span>: {item.parent.body}
                                        </div>
                                    )}
                                    <p className="mt-2 text-sm leading-relaxed text-ink">{item.body}</p>
                                    {!item.parent_id && item.replies_count > 0 && (
                                        <p className="mt-2 text-xs font-medium text-brand-600 dark:text-brand-400">{item.replies_count} balasan</p>
                                    )}
                                    <div className="mt-2 text-xs text-ink-muted">
                                        <span className="flex items-center gap-1"><Icon name="calendar" size={13} /> {formatDate(item.created_at)}</span>
                                    </div>
                                </div>
                                <div className="flex shrink-0 flex-wrap gap-1">
                                    {item.status !== 'approved' && (
                                        <button
                                            className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-brand-600"
                                            title="Setujui"
                                            disabled={acting === item.id}
                                            onClick={() => handleModerate(item, 'approved')}
                                        >
                                            <Icon name="check" size={16} />
                                        </button>
                                    )}
                                    {item.status !== 'hidden' && (
                                        <button
                                            className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-amber-500"
                                            title="Sembunyikan"
                                            disabled={acting === item.id}
                                            onClick={() => handleModerate(item, 'hidden')}
                                        >
                                            <Icon name="eye-off" size={16} />
                                        </button>
                                    )}
                                    <button
                                        className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-red-500"
                                        title="Hapus"
                                        onClick={() => setDeleting(item)}
                                    >
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
                <EmptyState icon="message-circle" title="Belum ada komentar" message="Komentar dari blog, portofolio, dan paket akan muncul di sini." />
            )}

            <Confirm
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={handleDelete}
                title="Hapus komentar?"
                message={deleting?.replies_count ? `${deleting.replies_count} balasan di bawah komentar ini juga akan dihapus.` : undefined}
            />
        </>
    );
}
