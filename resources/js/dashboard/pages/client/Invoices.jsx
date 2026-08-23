import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import Icon from '../../components/Icon';
import PaymentModal from '../../components/PaymentModal';
import InvoiceDetailModal from '../../components/InvoiceDetailModal';
import { PageHeader, EmptyState, formatRupiah, formatDate } from '../../components/ui';
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
    const [detail, setDetail] = useState(null);

    useEffect(() => {
        api.get('/customer/invoices')
            .then(({ data }) => setItems(data))
            .catch(() => toast.error('Gagal memuat data.'))
            .finally(() => setLoading(false));
    }, []);

    const reloadInvoices = () => {
        api.get('/customer/invoices')
            .then(({ data }) => setItems(data))
            .catch(() => {});
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
                                    <p className="font-mono text-xs font-semibold text-ink-muted">{it.number.startsWith("INV-") ? it.number : `INV-${it.number}`}</p>
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
                            
                            {it.payment_state === 'proof_rejected' && (
                                <div className="mt-4 rounded-md bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
                                    <strong>Bukti Pembayaran Ditolak</strong>
                                    <p className="mt-1">{it.latest_payment?.notes || 'Bukti pembayaran tidak dapat diverifikasi.'}</p>
                                </div>
                            )}

                            <div className="mt-4 flex flex-wrap items-end gap-2 sm:flex-nowrap">
                                {it.payment_state === 'paid' && (
                                    <button className="btn-primary flex-1 justify-center py-2" onClick={() => setDetail(it)}>
                                        <Icon name="check" size={14} />
                                        Detail Pembayaran
                                    </button>
                                )}

                                {it.payment_state === 'pending_verification' && (
                                    <>
                                        <button className="btn-primary flex-1 justify-center py-2 opacity-70 cursor-not-allowed" disabled>
                                            <Icon name="clock" size={14} />
                                            Menunggu Verifikasi
                                        </button>
                                        <button className="btn-outline flex-1 justify-center py-2" onClick={() => setDetail(it)}>
                                            <Icon name="eye" size={14} />
                                            Lihat Bukti
                                        </button>
                                    </>
                                )}

                                {it.payment_state === 'proof_rejected' && (
                                    <>
                                        <Link to={`/dashboard/client-invoices/${it.id}/bayar`} className="btn-primary flex-1 justify-center py-2">
                                            <Icon name="upload" size={14} />
                                            Upload Ulang Bukti
                                        </Link>
                                        <button className="btn-outline flex-1 justify-center py-2" onClick={() => setDetail(it)}>
                                            <Icon name="eye" size={14} />
                                            Lihat Ditolak
                                        </button>
                                    </>
                                )}

                                {it.payment_state === 'unpaid' && (
                                    <>
                                        <Link to={`/dashboard/client-invoices/${it.id}/bayar`} className="btn-primary flex-1 justify-center py-2">
                                            <Icon name="credit-card" size={14} />
                                            Bayar Sekarang
                                        </Link>
                                        <button className="btn-outline flex-1 justify-center py-2" onClick={() => setDetail(it)}>
                                            <Icon name="eye" size={14} />
                                            Detail Tagihan
                                        </button>
                                    </>
                                )}
                                
                                {it.project_id && (
                                    <Link to={`/dashboard/pesanan/${it.project_id}`} className="btn-outline shrink-0 px-3 py-2" title="Detail Pesanan">
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
            </>
            )}

            <PaymentModal
                open={false} // Disabled, left for fallback/rollback if needed
                onClose={() => {}}
            />

            <InvoiceDetailModal open={!!detail} onClose={() => setDetail(null)} invoice={detail} />
        </>
    );
}
