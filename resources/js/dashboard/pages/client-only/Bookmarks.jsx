import { useEffect, useState } from 'react';
import api from '../../api';
import Icon from '../../components/Icon';
import { PageHeader, Spinner, EmptyState, useToast, formatDate } from '../../components/ui';

export default function Bookmarks() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { show, node } = useToast();

    const load = () => api.get('/bookmarks').then(({ data }) => setItems(data)).finally(() => setLoading(false));
    useEffect(() => { load(); }, []);

    const remove = async (id, type) => {
        const item = items.find((i) => i.id === id);
        if (!item) return;
        await api.delete(`/bookmarks/${item.type}/${item.target_id}`);
        show('Bookmark dihapus.');
        load();
    };

    if (loading) return <Spinner />;

    const typeLabel = { blog: 'Artikel', portfolio: 'Galeri', package: 'Paket' };

    return (
        <>
            <PageHeader title="Bookmark" subtitle="Konten yang Anda simpan untuk dibaca kemudian." />
            {items.length ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {items.map((b) => (
                        <div key={b.id} className="card flex items-center justify-between gap-3 p-4">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
                                    <Icon name="heart" size={18} />
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-ink">{b.title}</p>
                                    <p className="text-xs text-ink-muted">{typeLabel(b.type)} · {formatDate(b.created_at)}</p>
                                </div>
                            </div>
                            <button onClick={() => remove(b.id, b.type)} className="rounded-lg p-2 text-ink-muted hover:bg-surface-muted hover:text-red-500" aria-label="Hapus">
                                <Icon name="x" size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState title="Belum ada bookmark" message="Simpan artikel, galeri, atau paket favorit Anda." icon="heart" />
            )}
            {node}
        </>
    );
}