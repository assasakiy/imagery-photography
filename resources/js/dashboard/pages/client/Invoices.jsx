import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import Icon from '../../components/Icon';
import PaymentModal from '../../components/PaymentModal';
import { PageHeader, Spinner, EmptyState, formatRupiah, formatDate } from '../../components/ui';
import Skeleton from '../../components/Skeleton';
import { toast } from '../../lib/toast';

const STATUS_META = {
    unpaid: { label: 'Belum Bayar', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
    awaiting_dp: { label: 'Menunggu DP', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
    partial: { label: 'Cicilan/DP', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    paid: { label: 'Lunas', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
};

export default function ClientInvoices() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [payments, setPayments] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);

    useEffect(() => {
        api.get('/customer/invoices')
            .then(({ data }) => setItems(data))
            .catch(() => toast.error('Gagal memuat data.'))
            .finally(() => setLoading(false));
    }, []);

    const openDetail = (it) => {
        setSelected(it);
        setPayments([]);
        if (it.project_id) {
            setPaymentsLoading(true);
            api.get(`/projects/${it.project_id}`)
                .then(({ data }) => setPayments(data.payments || []))
                .catch(() => setPayments([]))
                .finally(() => setPaymentsLoading(false));
        }
    };

    const refreshPayments = () => {
        if (!selected?.project_id) return;
        api.get(`/projects/${selected.project_id}`)
            .then(({ data }) => setPayments(data.payments || []))
            .catch(() => {});
    };

    const reloadInvoices = () => {
        api.get('/customer/invoices')
            .then(({ data }) => setItems(data))
            .catch(() => {});
        refreshPayments();
    };

    const onPaid = () => {
        reloadInvoices();
    };

    const totalOutstanding = items.reduce((sum, it) => sum + Number(it.remaining || 0), 0);

    return (
        <>
            <PageHeader title="Tagihan" subtitle="Status tagihan untuk pesanan Anda." />

            {loading ? (
                <Skeleton variant="table" />
            ) : (
            <>
            {items.length > 0 && (
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="card p-4">
                        <p className="text-xs text-ink-muted">Total Tagihan</p>
                        <p className="mt-1 text-lg font-bold text-ink">
                            {formatRupiah(items.reduce((sum, it) => sum + Number(it.price || 0), 0))}
                        </p>
                    </div>
                    <div className="card p-4">
                        <p className="text-xs text-ink-muted">Sudah Dibayar</p>
                        <p className="mt-1 text-lg font-bold text-emerald-600">
                            {formatRupiah(items.reduce((sum, it) => sum + Number(it.price || 0) - Number(it.remaining || 0), 0))}
                        </p>
                    </div>
                    <div className="card p-4">
                        <p className="text-xs text-ink-muted">Sisa Tagihan</p>
                        <p className={`mt-1 text-lg font-bold ${totalOutstanding > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {formatRupiah(totalOutstanding)}
                        </p>
                    </div>
                </div>
            )}

            {items.length ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {items.map((it) => (
                        <div key={it.id} className="card flex flex-col p-5">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="font-mono text-xs font-semibold text-ink-muted">INV-{it.number}</p>
                                    <h3 className="mt-1 font-bold text-ink">{it.project}</h3>
                                </div>
                                <span className={`badge shrink-0 ${STATUS_META[it.status]?.cls}`}>{STATUS_META[it.status]?.label}</span>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
                                <span className="flex items-center gap-1.5">
                                    <Icon name="calendar" size={14} />
                                    {it.issued_at ? formatDate(it.issued_at) : '-'}
                                </span>
                            </div>
                            <div className="mt-4 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs text-ink-muted">Sisa Pembayaran</p>
                                    <p className={`font-bold ${it.remaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {formatRupiah(it.remaining)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-ink-muted">Total Tagihan</p>
                                    <p className="font-semibold text-ink">{formatRupiah(it.price)}</p>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-1 items-end gap-2">
                                <button className="btn-primary flex-1 justify-center py-2" onClick={() => openDetail(it)}>
                                    <Icon name={it.remaining > 0 ? 'credit-card' : 'eye'} size={14} />
                                    {it.remaining > 0 ? 'Bayar Tagihan' : 'Lihat Tagihan'}
                                </button>
                                {it.project_id && (
                                    <Link to={`/dashboard/pesanan/${it.project_id}`} className="btn-outline justify-center py-2" title="Detail Pesanan">
                                        <Icon name="folder-open" size={14} />
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState title="Belum ada tagihan" message="Tagihan akan muncul setelah Anda memiliki pesanan." icon="credit-card" />
            )}

            <PaymentModal
                open={!!selected}
                onClose={() => setSelected(null)}
                invoice={selected}
                projectId={selected?.project_id}
                onPaid={onPaid}
            />

            <div className="card overflow-x-auto">
                <h4 className="mb-3 text-sm font-semibold text-ink">Riwayat Pembayaran</h4>
                {paymentsLoading ? (
                    <Spinner className="h-6 w-6" />
                ) : payments.length > 0 ? (
                    <table className="table">
                        <thead><tr><th>Tanggal</th><th>Jumlah</th><th>Status</th></tr></thead>
                        <tbody>
                            {payments.map((p) => (
                                <tr key={p.id}>
                                    <td className="text-sm text-ink-muted">{formatDate(p.created_at)}</td>
                                    <td className="font-semibold text-ink">{formatRupiah(p.amount)}</td>
                                    <td>
                                        <span className={`badge ${p.status === 'confirmed' ? 'bg-emerald-500/15 text-emerald-600' : p.status === 'pending' ? 'bg-amber-500/15 text-amber-600' : p.status === 'expired' ? 'bg-zinc-500/15 text-ink-muted' : 'bg-red-500/15 text-red-600'}`}>
                                            {p.status === 'confirmed' ? 'Terkonfirmasi' : p.status === 'pending' ? 'Menunggu' : p.status === 'expired' ? 'Kadaluarsa' : 'Ditolak'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-sm text-ink-muted">Belum ada pembayaran tercatat.</p>
                )}
            </div>
            </>
            )}
        </>
    );
}
