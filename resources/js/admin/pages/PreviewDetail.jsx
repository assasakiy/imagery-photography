import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import Icon from '../components/Icon';
import { Spinner, EmptyState } from '../components/ui';

export default function PreviewDetail() {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/customer/gallery', { params: { project_id: id } })
            .then(({ data }) => setProject(data[0] || null))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <Spinner />;
    if (!project) return <EmptyState title="Galeri tidak ditemukan" />;

    return (
        <>
            <Link to="/dashboard/preview" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand-600">
                <Icon name="arrow-left" size={16} /> Kembali ke Galeri
            </Link>

            <div className="card mb-6 p-5">
                <span className="rounded-lg bg-brand-500/15 px-2 py-0.5 font-mono text-xs font-bold text-brand-600 dark:text-brand-400">PSN-{project.order_no}</span>
                <h1 className="mt-2 text-2xl font-bold text-ink">{project.name}</h1>
                {!project.is_paid && (
                    <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
                        <strong>Informasi:</strong> Anda belum dapat mengunduh file HD. Silakan selesaikan pelunasan (Invoice) di menu Pesanan terlebih dahulu.
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {project.files.map((f) => (
                    <div key={f.id} className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-surface-muted">
                        {f.category === 'photo' || f.type.startsWith('image/') ? (
                            <img src={f.url} alt={f.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center p-4 text-ink-muted">
                                <Icon name={f.category === 'video' || f.type.startsWith('video/') ? 'video' : 'file'} size={32} />
                                <p className="mt-2 w-full truncate text-center text-xs">{f.name}</p>
                            </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                            {project.is_paid ? (
                                <a href={`/api/files/${f.id}/download`} className="rounded-lg bg-white/20 p-2 text-white hover:bg-white/40" title="Download HD">
                                    <Icon name="download" size={16} />
                                </a>
                            ) : (
                                <span className="text-white text-xs px-2 text-center">Menunggu Pelunasan</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}