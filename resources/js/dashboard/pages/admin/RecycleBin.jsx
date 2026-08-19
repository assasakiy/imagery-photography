import { useEffect, useState } from 'react';
import api from '../../api';
import Icon from '../../components/Icon';
import { PageHeader, EmptyState, useToast, Confirm, formatDate } from '../../components/ui';
import Skeleton from '../../components/Skeleton';

const TYPE_LABEL = { client: 'Klien', blog: 'Blog', portfolio: 'Portofolio' };
const CONTENT_TYPES = ['blog', 'portfolio'];

export default function RecycleBin() {
    const [type, setType] = useState('client');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [target, setTarget] = useState(null);
    const [action, setAction] = useState(null);
    const { show, node } = useToast();

    const load = () => {
        setLoading(true);
        api.get('/recycle-bin', { params: { type } })
            .then(({ data }) => setItems(data.data || []))
            .finally(() => setLoading(false));
    };

    useEffect(load, [type]);

    const restore = async () => {
        try {
            await api.post(`/recycle-bin/${target.type}/${target.id}/restore`);
            show(target.type === 'client' ? 'Klien beserta datanya dipulihkan.' : 'Item dipulihkan.');
            setTarget(null);
            load();
        } catch {
            show('Gagal memulihkan.', 'error');
            setTarget(null);
        }
    };

    const forceDelete = async () => {
        try {
            await api.delete(`/recycle-bin/${target.type}/${target.id}`);
            show('Item dihapus permanen.', 'error');
            setTarget(null);
            load();
        } catch {
            show('Gagal menghapus permanen.', 'error');
            setTarget(null);
        }
    };

    const isContent = CONTENT_TYPES.includes(type);

    return (
        <>
            <PageHeader
                title="Recycle Bin"
                subtitle={
                    isContent
                        ? 'Artikel atau portofolio yang dihapus bisa dipulihkan kembali, atau dihapus permanen.'
                        : 'Data yang dihapus. Pulihkan atau hapus permanen.'
                }
            />

            <div className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1">
                {Object.entries(TYPE_LABEL).map(([key, label]) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setType(key)}
                        className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                            type === key ? 'bg-brand-600 text-white shadow' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                        }`}
                    >
                        <Icon name={key === 'client' ? 'users' : key === 'blog' ? 'file' : 'briefcase'} size={16} /> {label}
                    </button>
                ))}
            </div>

            {loading ? (
                <Skeleton variant="table" />
            ) : items.length ? (
                <div className="card overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                {isContent && <th className="w-16">Media</th>}
                                <th>Nama</th>
                                {isContent ? <th>Kategori</th> : <th>Tipe</th>}
                                <th>Dihapus</th>
                                {!isContent && <th>Dihapus Oleh</th>}
                                {!isContent && <th>Alasan</th>}
                                <th className="w-40">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it) => (
                                <tr key={`${it.type}-${it.id}`}>
                                    {isContent && (
                                        <td>
                                            {it.thumbnail_url ? (
                                                <img src={it.thumbnail_url} alt={it.name} loading="lazy" className="h-12 w-16 rounded-lg object-cover" />
                                            ) : (
                                                <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-surface-muted text-ink-muted">
                                                    <Icon name={type === 'blog' ? 'file' : 'briefcase'} size={18} />
                                                </div>
                                            )}
                                        </td>
                                    )}
                                    <td>
                                        <div className="font-medium text-ink max-w-[280px] truncate" title={it.name}>{it.name}</div>
                                        {it.type === 'client' && (
                                            <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-ink-muted">
                                                <span>{it.projects_count ?? 0} proyek</span>
                                                <span>· {it.bookings_count ?? 0} booking</span>
                                                <span>· {it.payments_count ?? 0} pembayaran</span>
                                                {(it.messages_count ?? 0) > 0 && <span>· {it.messages_count} pesan</span>}
                                            </div>
                                        )}
                                    </td>
                                    {isContent ? (
                                        <td className="text-sm text-ink-muted">{it.category || '-'}</td>
                                    ) : (
                                        <td><span className="badge bg-brand-500/15 text-brand-600 dark:text-brand-400">{TYPE_LABEL[it.type] || it.type}</span></td>
                                    )}
                                    <td className="whitespace-nowrap text-xs text-ink-muted">{it.deleted_at ? formatDate(it.deleted_at) : '-'}</td>
                                    {!isContent && <td className="text-sm text-ink-muted">{it.deleted_by_name || '-'}</td>}
                                    {!isContent && <td className="max-w-[200px] truncate text-sm text-ink-muted" title={it.delete_reason || ''}>{it.delete_reason || '-'}</td>}
                                    <td>
                                        <div className="flex gap-1">
                                            <button
                                                className="btn-outline px-2.5 py-1.5 text-xs"
                                                onClick={() => {
                                                    setTarget(it);
                                                    setAction('restore');
                                                }}
                                            >
                                                <Icon name="refresh" size={14} /> Pulihkan
                                            </button>
                                            <button
                                                className="btn bg-red-600 px-2.5 py-1.5 text-xs text-white hover:bg-red-700"
                                                onClick={() => {
                                                    setTarget(it);
                                                    setAction('delete');
                                                }}
                                            >
                                                <Icon name="trash" size={14} /> Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState
                    title="Recycle bin kosong"
                    message={isContent ? 'Tidak ada data yang dihapus untuk tab ini.' : 'Tidak ada data yang dihapus.'}
                    icon="trash"
                />
            )}

            <Confirm
                open={!!target}
                onClose={() => setTarget(null)}
                onConfirm={action === 'restore' ? restore : forceDelete}
                title={action === 'restore' ? 'Pulihkan item?' : 'Hapus permanen?'}
                message={
                    action === 'restore'
                        ? target?.type === 'client'
                            ? `Klien beserta ${target?.projects_count ?? 0} proyek dan seluruh data terkaitnya akan dikembalikan ke daftar aktif.`
                            : 'Item akan dikembalikan ke daftar aktif.'
                        : target?.type === 'client'
                          ? 'Klien, semua proyek, booking, dan file (foto/video) terkait akan dihapus permanen dan tidak bisa dikembalikan.'
                          : 'Item beserta cover dan seluruh file terkait akan dihapus permanen dan tidak bisa dikembalikan.'
                }
            />
            {node}
        </>
    );
}