import { useEffect, useState } from 'react';
import api from '../api';
import Icon from '../components/Icon';
import { PageHeader, Spinner, EmptyState, formatRupiah, formatDate } from '../components/ui';

function formatSize(bytes) {
    if (!bytes) return '-';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function ClientGallery() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(null);

    useEffect(() => {
        api.get('/customer/gallery')
            .then(({ data }) => setProjects(data))
            .finally(() => setLoading(false));
    }, []);

    const download = async (file) => {
        setDownloading(file.id);
        try {
            const res = await api.get(`/files/${file.id}/download`, { responseType: 'blob' });
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            alert(e?.response?.data?.message || 'Gagal mengunduh file.');
        } finally {
            setDownloading(null);
        }
    };

    if (loading) return <Spinner />;

    return (
        <>
            <PageHeader title="Galeri Saya" subtitle="Hasil foto/video dari pesanan Anda. File tersedia sesuai masa simpan." />
            {projects.length ? (
                <div className="space-y-6">
                    {projects.map((p) => (
                        <div key={p.id} className="card p-5">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="font-bold text-ink">{p.name}</p>
                                    <p className="text-xs text-ink-muted">Status: {p.status}</p>
                                </div>
                            </div>
                            {p.files?.length ? (
                                <div className="divide-y divide-line">
                                    {p.files.map((f) => (
                                        <div key={f.id} className="flex items-center justify-between gap-3 py-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-ink-muted">
                                                    <Icon name="file" size={18} />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-ink">{f.name}</p>
                                                    <p className="text-xs text-ink-muted">
                                                        {formatSize(f.size)}
                                                        {f.expires_at ? ` · berlaku hingga ${formatDate(f.expires_at)}` : ' · tanpa batas'}
                                                    </p>
                                                </div>
                                            </div>
                                            {f.available ? (
                                                <button className="btn-primary px-3 py-1.5" onClick={() => download(f)} disabled={downloading === f.id}>
                                                    <Icon name="download" size={14} />
                                                    {downloading === f.id ? 'Mengunduh...' : 'Download'}
                                                </button>
                                            ) : (
                                                <span className="text-xs text-red-500">File diarsipkan</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-ink-muted">Belum ada file pada pesanan ini.</p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState title="Belum ada galeri" message="Hasil foto/video Anda akan muncul di sini setelah pesanan selesai." icon="image" />
            )}
        </>
    );
}