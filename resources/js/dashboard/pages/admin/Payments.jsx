import { useEffect, useState } from 'react';
import api from '../../api';
import { toast } from '../../lib/toast';
import { getApiErrorMessage } from '../../lib/errors';
import Icon from '../../components/Icon';
import { PageHeader, EmptyState, formatRupiah, formatDate } from '../../components/ui';
import Skeleton from '../../components/Skeleton';

export default function Payments() {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(null);

    const load = (page = 1) => {
        setLoading(true);
        api.get('/payments', { params: { page, per_page: 15, status: status || undefined } })
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

    const act = async (payment, action) => {
        setActing(payment.id);
        try {
            await api.patch(`/payments/${payment.id}/${action}`);
            toast.success(action === 'confirm' ? 'Pembayaran dikonfirmasi.' : 'Pembayaran ditolak.');
            load(meta.current_page);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal memproses pembayaran.'));
        } finally {
            setActing(null);
        }
    };

    const badge = (s) =>
        `badge ${
            s === 'confirmed' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : s === 'pending' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : s === 'expired' ? 'bg-zinc-500/15 text-ink-muted' : 'bg-red-500/15 text-red-600 dark:text-red-400'
        }`;
    const statusLabel = (s) =>
        s === 'confirmed' ? 'Terkonfirmasi' : s === 'pending' ? 'Menunggu' : s === 'expired' ? 'Kadaluarsa' : 'Ditolak';

    return (
        <>
            <PageHeader title="Pembayaran" subtitle="Konfirmasi pembayaran dari klien." />

            <div className="mb-4 flex flex-wrap gap-2">
                <button className={`chip ${!status ? 'chip-active' : ''}`} onClick={() => setStatus('')}>Semua</button>
                <button className={`chip ${status === 'pending' ? 'chip-active' : ''}`} onClick={() => setStatus('pending')}>Menunggu</button>
                <button className={`chip ${status === 'confirmed' ? 'chip-active' : ''}`} onClick={() => setStatus('confirmed')}>Terkonfirmasi</button>
                <button className={`chip ${status === 'failed' ? 'chip-active' : ''}`} onClick={() => setStatus('failed')}>Ditolak</button>
            </div>

            {loading ? (
                <Skeleton variant="table" />
            ) : items.length ? (
                <div className="card overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Klien</th>
                                <th>Project</th>
                                <th>Jumlah</th>
                                <th>Metode</th>
                                <th>Status</th>
                                <th>Bukti</th>
                                <th className="w-40">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((p) => (
                                <tr key={p.id}>
                                    <td className="text-sm text-ink-muted">{formatDate(p.created_at)}</td>
                                    <td className="text-sm font-medium text-ink">{p.project?.user?.name || '-'}</td>
                                    <td className="text-sm text-ink-muted">{p.project?.name || '-'}</td>
                                    <td className="font-semibold text-ink">{formatRupiah(p.amount)}</td>
                                    <td className="text-sm text-ink-muted">{p.method === 'gateway' ? 'Gateway' : 'Manual'}</td>
                                    <td><span className={badge(p.status)}>{statusLabel(p.status)}</span></td>
                                    <td>
                                        {p.proof_url ? (
                                            <a href={p.proof_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline dark:text-brand-400">
                                                Lihat <Icon name="eye" size={14} />
                                            </a>
                                        ) : (
                                            <span className="text-sm text-ink-muted">-</span>
                                        )}
                                    </td>
                                    <td>
                                        {p.status === 'pending' ? (
                                            <div className="flex gap-1.5">
                                                <button
                                                    className="btn-outline !px-2.5 !py-1.5 !text-xs"
                                                    disabled={acting === p.id}
                                                    onClick={() => act(p, 'confirm')}
                                                >
                                                    Terima
                                                </button>
                                                <button
                                                    className="btn-outline !px-2.5 !py-1.5 !text-xs hover:!border-red-500 hover:!text-red-500"
                                                    disabled={acting === p.id}
                                                    onClick={() => act(p, 'reject')}
                                                >
                                                    Tolak
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-ink-muted">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {meta.last_page > 1 && (
                        <div className="flex items-center justify-between px-4 py-3">
                            <button className="btn-outline disabled:opacity-40" disabled={!meta.prev_page_url} onClick={() => load(meta.current_page - 1)}>
                                Sebelumnya
                            </button>
                            <span className="text-sm text-ink-muted">Halaman {meta.current_page} dari {meta.last_page}</span>
                            <button className="btn-outline disabled:opacity-40" disabled={!meta.next_page_url} onClick={() => load(meta.current_page + 1)}>
                                Berikutnya
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <EmptyState title="Belum ada pembayaran" />
            )}
        </>
    );
}
