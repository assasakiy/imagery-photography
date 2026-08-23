import { useEffect, useState } from 'react';
import api from '../api';
import Icon from './Icon';
import { Modal, formatRupiah, formatDate } from './ui';

const PAY_STATUS = {
    pending: { label: 'Menunggu Konfirmasi', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    confirmed: { label: 'Terkonfirmasi', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    rejected: { label: 'Ditolak', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
};

const INV_STATUS = {
    unpaid: { label: 'Belum Bayar', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
    awaiting_dp: { label: 'Menunggu DP', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
    partial: { label: 'Cicilan/DP', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    paid: { label: 'Lunas', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
};

function Row({ label, value, valueClass = 'font-mono font-semibold text-ink', border = false }) {
    return (
        <div className={`flex items-center justify-between gap-3 text-sm ${border ? 'border-t border-line pt-2.5' : ''}`}>
            <span className="text-ink-muted">{label}</span>
            <span className={valueClass}>{value}</span>
        </div>
    );
}

export default function InvoiceDetailModal({ open, onClose, invoice }) {
    const [payments, setPayments] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !invoice) return;
        setLoading(true);
        api.get('/customer/payments')
            .then(({ data }) => setPayments((data || []).filter((p) => Number(p.project_id) === Number(invoice.project_id))))
            .catch(() => setPayments([]))
            .finally(() => setLoading(false));
    }, [open, invoice]);

    if (!open || !invoice) return null;

    const invMeta = INV_STATUS[invoice.status];
    const remaining = Number(invoice.remaining || 0);

    return (
        <Modal open={open} onClose={onClose} title="Detail Tagihan" bodyClassName="p-0">
            <div className="border-b border-line bg-surface-muted/50 p-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="font-mono text-xs font-semibold tracking-wide text-ink-muted">{invoice.number.startsWith("INV-") ? invoice.number : `INV-${invoice.number}`}</p>
                        <h3 className="mt-1 text-xl font-bold text-ink">{invoice.project}</h3>
                    </div>
                    {invMeta && (
                        <span className={`badge shrink-0 ${invMeta.cls}`}>
                            {invoice.status === 'paid' && <Icon name="check" size={12} />}
                            {invMeta.label}
                        </span>
                    )}
                </div>
                <div className="mt-5 space-y-2.5">
                    <Row label="Tanggal terbit" value={invoice.issued_at ? formatDate(invoice.issued_at) : '-'} valueClass="text-sm font-medium text-ink" />
                    <Row label="Jatuh tempo" value={invoice.due_at ? formatDate(invoice.due_at) : '-'} valueClass="text-sm font-medium text-ink" />
                    <Row label="Total tagihan" value={formatRupiah(invoice.price)} />
                    <Row
                        label="Sudah dibayar"
                        value={formatRupiah(invoice.paid || 0)}
                        valueClass="font-mono font-semibold text-emerald-600 dark:text-emerald-400"
                    />
                    <Row
                        label="Sisa pembayaran"
                        value={formatRupiah(remaining)}
                        valueClass={`font-mono text-lg font-bold ${remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                        border
                    />
                </div>
            </div>

            <div className="p-6">
                <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink">
                    <Icon name="file-text" size={16} /> Riwayat Pembayaran
                </p>
                {loading ? (
                    <div className="py-6 text-center text-sm text-ink-muted">Memuat…</div>
                ) : !payments?.length ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-center">
                        <Icon name="credit-card" size={26} className="text-ink-muted" />
                        <p className="text-sm text-ink-muted">Belum ada pembayaran tercatat.</p>
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {payments.map((p) => {
                            const meta = PAY_STATUS[p.status] || { label: p.status, cls: 'bg-surface-muted text-ink-muted' };
                            return (
                                <li key={p.id} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
                                    {p.proof_url ? (
                                        <a href={p.proof_url} target="_blank" rel="noreferrer" title="Lihat bukti pembayaran" className="shrink-0">
                                            <img
                                                src={p.proof_url}
                                                alt="Bukti pembayaran"
                                                className="h-12 w-12 rounded-lg border border-line object-cover transition-opacity hover:opacity-80"
                                            />
                                        </a>
                                    ) : (
                                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-muted">
                                            <Icon name="credit-card" size={18} />
                                        </span>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-ink">{formatRupiah(p.amount)}</p>
                                        <p className="mt-0.5 truncate text-xs text-ink-muted">
                                            {formatDate(p.paid_at || p.created_at)} · {p.method || '-'}
                                        </p>
                                    </div>
                                    {p.proof_url && (
                                        <a
                                            href={p.proof_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
                                        >
                                            Bukti
                                        </a>
                                    )}
                                    <span className={`badge shrink-0 ${meta.cls}`}>{meta.label}</span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </Modal>
    );
}
