import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api';
import Icon from '../../../components/Icon';
import { PageHeader, EmptyState } from '../../../components/ui';
import { SkeletonCard, SkeletonGrid } from '../../../components/ui/skeleton';

export default function Index() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = () => {
        setLoading(true);
        api.get('/pages')
            .then(({ data }) => setItems(data))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    return (
        <>
            <PageHeader
                title="Halaman Landing"
                subtitle="Atur konten halaman statis per section."
            />

            {loading ? (
                <SkeletonGrid count={6} columns="md:grid-cols-2 xl:grid-cols-3">
                    <SkeletonCard />
                </SkeletonGrid>
            ) : items.length ? (
                <div className="space-y-3">
                    {items.map((item) => (
                        <div key={item.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-lg bg-surface-muted px-2 py-0.5 font-mono text-xs text-ink-muted">/{item.slug === 'home' ? '' : item.slug}</span>
                                    {!item.published && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                            Tidak tampil
                                        </span>
                                    )}
                                </div>
                                <h3 className="mt-1 font-bold text-ink">{item.title}</h3>
                                <p className="text-sm text-ink-muted line-clamp-1">{item.description || 'Tidak ada deskripsi'}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                <a href={item.slug === 'home' ? '/' : `/${item.slug}`} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-ink-muted hover:bg-surface-muted hover:text-brand-600" aria-label="Lihat">
                                    <Icon name="eye" size={18} />
                                </a>
                                <Link to={`/dashboard/pages/${item.slug}/edit`} className="rounded-lg p-2 text-ink-muted hover:bg-surface-muted hover:text-brand-600" aria-label="Edit">
                                    <Icon name="edit" size={18} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState title="Belum ada halaman" />
            )}
        </>
    );
}