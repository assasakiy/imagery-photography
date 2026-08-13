import { useEffect, useState } from 'react';
import api from '../../api';
import Icon from '../../components/Icon';
import { PageHeader, EmptyState, useToast, Confirm, formatDate } from '../../components/ui';
import Skeleton from '../../components/Skeleton';

const TYPE_LABEL = { client: 'Klien' };

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
        await api.post(`/recycle-bin/${target.type}/${target.id}/restore`);
        show('Item dipulihkan.');
        setTarget(null);
        load();
    };

    const forceDelete = async () => {
        await api.delete(`/recycle-bin/${target.type}/${target.id}`);
        show('Item dihapus permanen.', 'error');
        setTarget(null);
        load();
    };

    return (
        <>
            <PageHeader title="Recycle Bin" subtitle="Data yang dihapus. Pulihkan atau hapus permanen." />

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
                        {label}
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
                                <th>Nama</th>
                                <th>Tipe</th>
                                <th>Dihapus Oleh</th>
                                <th>Tanggal</th>
                                <th>Alasan</th>
                                <th className="w-40">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it) => (
                                <tr key={`${it.type}-${it.id}`}>
                                    <td>
                                        <div className="font-medium text-ink">{it.name}</div>
                                        <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-ink-muted">
                                            <span>{it.projects_count ?? 0} proyek</span>
                                            <span>· {it.bookings_count ?? 0} booking</span>
                                            <span>· {it.payments_count ?? 0} pembayaran</span>
                                            {(it.messages_count ?? 0) > 0 && <span>· {it.messages_count} pesan</span>}
                                        </div>
                                    </td>
                                    <td><span className="badge bg-brand-500/15 text-brand-600 dark:text-brand-400">{TYPE_LABEL[it.type] || it.type}</span></td>
                                    <td className="text-sm text-ink-muted">{it.deleted_by_name || '-'}</td>
                                    <td className="whitespace-nowrap text-xs text-ink-muted">{it.deleted_at ? formatDate(it.deleted_at) : '-'}</td>
                                    <td className="max-w-[200px] truncate text-sm text-ink-muted" title={it.delete_reason || ''}>{it.delete_reason || '-'}</td>
                                    <td>
                                        <div className="flex gap-1">
                                            <button className="btn-outline px-2.5 py-1.5 text-xs" onClick={() => { setTarget(it); setAction('restore'); }}>
                                                <Icon name="refresh" size={14} /> Pulihkan
                                            </button>
                                            <button className="btn bg-red-600 px-2.5 py-1.5 text-xs text-white hover:bg-red-700" onClick={() => { setTarget(it); setAction('delete'); }}>
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
                <EmptyState title="Recycle bin kosong" message="Tidak ada data yang dihapus." icon="trash" />
            )}

            <Confirm
                open={!!target}
                onClose={() => setTarget(null)}
                onConfirm={action === 'restore' ? restore : forceDelete}
                title={action === 'restore' ? 'Pulihkan item?' : 'Hapus permanen?'}
                message={
                    action === 'restore'
                        ? `Klien beserta ${target?.projects_count ?? 0} proyek dan seluruh data terkaitnya akan dikembalikan ke daftar aktif.`
                        : 'Klien, semua proyek, booking, dan file (foto/video) terkait akan dihapus permanen dan tidak bisa dikembalikan.'
                }
            />
            {node}
        </>
    );
}