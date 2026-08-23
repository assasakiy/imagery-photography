import Icon from '../../../../components/Icon';
import { formatDate, formatRupiah } from '../../../../components/ui';
import { Link } from 'react-router-dom';

const INV_LABEL = {
    unpaid: 'Belum Dibayar',
    awaiting_dp: 'Menunggu DP',
    partial: 'DP Dibayarkan',
    paid: 'Lunas',
};

export default function AwaitingPaymentStep({ ctx }) {
    const { PanelHeader, PanelFooter, project, previewHref, isPaid } = ctx;
    const inv = project.invoice;
    const invPaid = isPaid || inv?.status === 'paid' || Number(inv?.remaining || 0) <= 0;

    const payUrl = inv ? `/dashboard/client-invoices/${inv.id}/bayar` : '/dashboard/client-invoices';
    const detailUrl = inv ? `/dashboard/client-invoices?detail=${inv.id}` : '/dashboard/client-invoices';
    const amountLabel = invPaid ? 'Total Tagihan' : 'Sisa Tagihan';
    const amountValue = inv ? (invPaid ? inv.base_amount : (inv.remaining ?? inv.base_amount)) : 0;

    return (
        <div className="card overflow-hidden">
            <PanelHeader
                icon="eye"
                iconCls="bg-orange-500/15 text-orange-600 dark:text-orange-400"
                title="Preview & Invoice"
                subtitle="File final sudah diunggah. Link pratinjau dan invoice dibuat otomatis."
            />
            <div className="p-5">
                {inv ? (
                    <div className={`flex items-center justify-between gap-3 rounded-xl border p-4 ${
                        invPaid
                            ? 'border-emerald-500/20 bg-emerald-500/5'
                            : 'border-amber-500/25 bg-amber-500/5'
                    }`}>
                        <div>
                            <p className={`font-mono text-[10px] font-semibold uppercase tracking-wider ${
                                invPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                            }`}>
                                Invoice {INV_LABEL[inv.status] || ''} · {inv.number.startsWith('INV-') ? inv.number : `INV-${inv.number}`}
                            </p>
                            <p className="mt-1 text-xl font-bold text-ink">{formatRupiah(amountValue)}</p>
                        </div>
                        {!invPaid && (
                            <div className="text-right text-xs text-amber-700 dark:text-amber-400">
                                <p>Jatuh tempo</p>
                                <p className="mt-0.5 font-semibold">{formatDate(inv.due_at)}</p>
                            </div>
                        )}
                        {invPaid && (
                            <span className="badge shrink-0 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                <Icon name="check" size={12} /> Lunas
                            </span>
                        )}
                    </div>
                ) : null}
                <p className="mt-4 text-xs text-ink-muted">
                    {invPaid
                        ? 'Terima kasih — tagihan untuk pesanan ini sudah lunas. Anda dapat meninjau riwayat pembayaran di detail tagihan.'
                        : <>Status berpindah ke <b>Selesai</b> otomatis setelah pembayaran invoice lunas.</>}
                </p>
            </div>
            <PanelFooter>
                <Link to={previewHref} className="btn-outline"><Icon name="eye" size={16} /> Lihat Preview</Link>
                {invPaid ? (
                    <Link to={detailUrl} className="btn-primary"><Icon name="file-text" size={16} /> Detail Tagihan</Link>
                ) : (
                    <Link to={payUrl} className="btn-primary"><Icon name="credit-card" size={16} /> Bayar Sekarang</Link>
                )}
            </PanelFooter>
        </div>
    );
}
