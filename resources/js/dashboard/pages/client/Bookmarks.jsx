import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import Icon from '../../components/Icon';
import { PageHeader, EmptyState, formatDate } from '../../components/ui';
import Skeleton, { CardGridSkeleton } from '../../components/Skeleton';
import { toast } from '../../lib/toast';
import { getApiErrorMessage } from '../../lib/errors';

const typeConfig = {
    blog: { label: 'Artikel', icon: 'file-text', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
    portfolio: { label: 'Galeri', icon: 'image', color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400' },
    package: { label: 'Paket', icon: 'package', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
};

export default function Bookmarks() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = () => {
        setLoading(true);
        api.get('/bookmarks')
            .then(({ data }) => setItems(data))
            .catch(() => toast.error('Gagal memuat bookmark.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const removeBookmark = async (b) => {
        try {
            await api.delete(`/bookmarks/${b.type}/${b.target_id}`);
            setItems((prev) => prev.filter((i) => i.id !== b.id));
            toast.success('Bookmark dihapus.');
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal menghapus bookmark.'));
        }
    };

    const toggleLike = async (b) => {
        try {
            const { data } = await api.post('/likes/toggle', { type: b.type, id: b.target_id });
            setItems((prev) => prev.map((i) => i.id === b.id ? { ...i, user_liked: data.liked, likes_count: data.likes_count } : i));
        } catch {
            toast.error('Gagal memproses like.');
        }
    };

    return (
        <>
            <PageHeader title="Bookmark" subtitle="Konten yang Anda simpan untuk dibaca kemudian." />
            {loading ? (
                <CardGridSkeleton count={6} cols="sm:grid-cols-2 lg:grid-cols-3" ratio="photo" metaLines={2} />
            ) : items.length ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((b) => {
                        const cfg = typeConfig[b.type] || typeConfig.blog;
                        return (
                            <div key={b.id} className="card group flex flex-col overflow-hidden">
                                {b.url ? (
                                    <Link to={b.url} className="relative block aspect-[16/10] overflow-hidden bg-surface-muted">
                                        {b.cover_url ? (
                                            <img src={b.cover_url} alt={b.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                        ) : (
                                            <div className="flex h-full items-center justify-center">
                                                <Icon name={cfg.icon} size={36} className="text-ink-muted/40" />
                                            </div>
                                        )}
                                        <span className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.color}`}>
                                            <Icon name={cfg.icon} size={12} /> {cfg.label}
                                        </span>
                                    </Link>
                                ) : (
                                    <div className="relative block aspect-[16/10] overflow-hidden bg-surface-muted">
                                        <div className="flex h-full items-center justify-center">
                                            <Icon name={cfg.icon} size={36} className="text-ink-muted/40" />
                                        </div>
                                        <span className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.color}`}>
                                            <Icon name={cfg.icon} size={12} /> {cfg.label}
                                        </span>
                                    </div>
                                )}

                                <div className="flex flex-1 flex-col p-4">
                                    {b.url ? (
                                        <Link to={b.url} className="line-clamp-2 text-sm font-semibold text-ink hover:text-brand-600 dark:hover:text-brand-400">{b.title}</Link>
                                    ) : (
                                        <p className="line-clamp-2 text-sm font-semibold text-ink">{b.title}</p>
                                    )}

                                    {b.excerpt && (
                                        <p className="mt-1.5 line-clamp-2 text-xs text-ink-muted">{b.excerpt}</p>
                                    )}

                                    {b.author && (
                                        <p className="mt-2 text-xs text-ink-muted">oleh <span className="font-medium text-ink">{b.author}</span></p>
                                    )}

                                    <div className="mt-auto pt-3">
                                        <div className="flex items-center gap-1 border-t border-line pt-3">
                                            <button
                                                onClick={() => toggleLike(b)}
                                                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${b.user_liked ? 'text-red-500 hover:bg-red-500/10' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'}`}
                                                aria-label={b.user_liked ? 'Unlike' : 'Like'}
                                            >
                                                <Icon name="heart" size={14} className={b.user_liked ? 'fill-current' : ''} />
                                                <span>{b.likes_count}</span>
                                            </button>

                                            {b.url && b.type === 'blog' && (
                                                <Link
                                                    to={b.url}
                                                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
                                                >
                                                    <Icon name="message-circle" size={14} />
                                                    <span>{b.comments_count}</span>
                                                </Link>
                                            )}

                                            <div className="ml-auto">
                                                <button
                                                    onClick={() => removeBookmark(b)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
                                                    aria-label="Hapus bookmark"
                                                >
                                                    <Icon name="heart" size={14} className="fill-current" />
                                                    <span>Tersimpan</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <EmptyState title="Belum ada bookmark" message="Simpan artikel, galeri, atau paket favorit Anda." icon="heart" />
            )}
        </>
    );
}
