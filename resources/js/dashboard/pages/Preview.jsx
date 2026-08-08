import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Icon from '../components/Icon';
import { PageHeader, Spinner, EmptyState, formatDate } from '../components/ui';

export default function Preview() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/customer/gallery')
            .then(({ data }) => setItems(data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner />;

    return (
        <>
            <PageHeader title="Preview & Galeri" subtitle="Lihat hasil pesanan Anda." />
            
            {items.length ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((p) => (
                        <div key={p.id} className="card p-5 group transition-all hover:-translate-y-1 hover:shadow-xl">
                            <div className="mb-4">
                                <span className="rounded-lg bg-brand-500/15 px-2 py-0.5 font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                                    PSN-{p.order_no}
                                </span>
                            </div>
                            <h3 className="font-bold text-ink text-lg mb-1">{p.name}</h3>
                            <p className="text-sm text-ink-muted flex items-center gap-1.5"><Icon name="calendar" size={14} /> {p.event_date ? formatDate(p.event_date) : '-'}</p>
                            
                            <div className="mt-4 flex items-center gap-2">
                                <span className="badge bg-surface-muted text-ink-muted">{p.files.length} File</span>
                                {p.is_paid && <span className="badge bg-emerald-500/15 text-emerald-600"><Icon name="check" size={12} /> Lunas (Bisa Download)</span>}
                            </div>
                            
                            <Link to={`/dashboard/preview/${p.order_no || p.id}`} className="btn-primary w-full mt-5">
                                Lihat Preview
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState title="Belum ada preview" message="Belum ada file media yang diupload untuk pesanan Anda." icon="image" />
            )}
        </>
    );
}