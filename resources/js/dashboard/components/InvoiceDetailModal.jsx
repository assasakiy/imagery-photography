import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Icon from './Icon';
import { Modal, formatRupiah, formatDate } from './ui';

const PAY_STATUS = {
    pending: { label: 'Menunggu Konfirmasi', dot: 'bg-amber-500', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    confirmed: { label: 'Terkonfirmasi', dot: 'bg-emerald-500', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    failed: { label: 'Ditolak', dot: 'bg-red-500', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
    expired: { label: 'Kadaluarsa', dot: 'bg-zinc-400', cls: 'bg-zinc-500/15 text-zinc-500 dark:text-zinc-400' },
};

const INV_STATUS = {
    unpaid: { label: 'Belum Bayar', cls: 'bg-white/15 text-white' },
    awaiting_dp: { label: 'Menunggu DP', cls: 'bg-white/15 text-white' },
    partial: { label: 'Cicilan/DP', cls: 'bg-white/15 text-white' },
    paid: { label: 'Lunas', cls: 'bg-emerald-400/25 text-white' },
};

function methodMeta(p) {
    if (p.method === 'gateway') {
        const gw = (p.gateway || '').toLowerCase();
        const gwName = gw === 'tripay' ? 'TriPay' : gw ? gw.charAt(0).toUpperCase() + gw.slice(1) : null;
        return { icon: 'zap', label: 'Pembayaran Otomatis', channel: [p.gateway_method, gwName].filter(Boolean).join(' · ') };
    }
    const notes = (p.notes || '').trim();
    let channel = null;
    let icon = 'landmark';
    if (/^bayar via qris/i.test(notes)) {
        const merchant = notes.replace(/^bayar via qris/i, '').trim();
        channel = merchant ? `QRIS · ${merchant}` : 'QRIS';
        icon = 'qr';
    } else if (/^transfer ke /i.test(notes)) {
        channel = notes.replace(/^transfer ke /i, '');
    } else if (notes) {
        channel = notes;
    }
    return { icon, label: 'Transfer Manual', channel };
}

function Stat({ label, value, accent }) {
    return (
        <div className="rounded-lg border border-line bg-surface px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</p>
            <p className={`mt-0.5 font-mono text-sm font-bold ${accent || 'text-ink'}`}>{value}</p>
        </div>
    );
}

export default function InvoiceDetailModal({ open, onClose, invoice }) {
    const [payments, setPayments] = useState(null);
    const [loading, setLoading] = useState(false);
    const [proof, setProof] = useState(null);

    useEffect(() => {
        if (!open || !invoice) return;
        setLoading(true);
        setPayments(null);
        api.get('/customer/payments')
            .then(({ data }) => setPayments((data || []).filter((p) => Number(p.project_id) === Number(invoice.project_id))))
            .catch(() => setPayments([]))
            .finally(() => setLoading(false));
    }, [open, invoice]);

    if (!open || !invoice) return null;

    const num = invoice.number.startsWith('INV-') ? invoice.number : `INV-${invoice.number}`;
    const price = Number(invoice.price || 0);
    const paid = Number(invoice.paid || 0);
    const remaining = Number(invoice.remaining || 0);
    const pct = price > 0 ? Math.min(100, Math.round((paid / price) * 100)) : 0;
    const invMeta = INV_STATUS[invoice.status];
    const state = invoice.payment_state;

    const payUrl = `/dashboard/client-invoices/${invoice.id}/bayar${state === 'proof_rejected' ? '?step=confirm' : ''}`;
    const showCta = remaining > 0 && state !== 'pending_verification';

    let footer = null;
    if (remaining > 0) {
        footer = (
            <div className="flex items-center justify-end gap-2">
                <button className="btn-outline" onClick={onClose}>Tutup</button>
                {showCta && (
                    <Link to={payUrl} className="btn-primary">
                        <Icon name={state === 'proof_rejected' ? 'upload' : 'credit-card'} size={14} />
                        {state === 'proof_rejected' ? 'Upload Ulang Bukti' : 'Bayar Sekarang'}
                    </Link>
                )}
            </div>
        );
    }

    return (
        <>
        <Modal open={open} onClose={onClose} title="Detail Tagihan" wide bodyClassName="p-0" footer={footer}>
            {/* Dokumen header */}
            <div className="bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-5 dark:from-brand-700 dark:to-brand-600">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Invoice &middot; Sopian Lalu Imagery</p>
                        <p className="mt-0.5 font-mono text-xl font-bold tracking-wide text-white">{num}</p>
                    </div>
                    {invMeta && (
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${invMeta.cls}`}>
                            {invoice.status === 'paid' && <Icon name="check-circle" size={13} />}
                            {invMeta.label}
                        </span>
                    )}
                </div>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-white/80">
                    <span className="flex items-center gap-1.5">
                        <Icon name="calendar" size={13} /> Terbit: {invoice.issued_at ? formatDate(invoice.issued_at) : '-'}
                    </span>
                    {invoice.due_at && (
                        <span className={`flex items-center gap-1.5 ${remaining > 0 && new Date(invoice.due_at) < new Date() ? 'font-bold text-red-200' : ''}`}>
                            <Icon name="clock" size={13} /> Jatuh Tempo: {formatDate(invoice.due_at)}
                        </span>
                    )}
                </div>
                <p className="mt-3 border-t border-white/20 pt-3 text-sm font-medium text-white">
                    Untuk pesanan: {invoice.project}
                </p>
            </div>

            {/* Hero nominal + progres */}
            <div className="border-b border-line bg-surface-muted/40 px-6 py-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-xs font-medium text-ink-muted">{remaining > 0 ? 'Sisa Tagihan' : 'Total Terbayar'}</p>
                        <p className={`font-mono text-3xl font-bold ${remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {formatRupiah(remaining)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-medium text-ink-muted">Progres Pembayaran</p>
                        <p className="font-mono text-sm font-bold text-ink">{pct}%</p>
                    </div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                    <div
                        className={`h-full rounded-full transition-all ${remaining > 0 ? 'bg-brand-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    <Stat label="Total Tagihan" value={formatRupiah(price)} />
                    {Number(invoice.dp_amount || 0) > 0 && <Stat label="DP Ditetapkan" value={formatRupiah(invoice.dp_amount)} />}
                    <Stat label="Sudah Dibayar" value={formatRupiah(paid)} accent="text-emerald-600 dark:text-emerald-400" />
                </div>
                {state === 'proof_rejected' && invoice.latest_payment?.notes && (
                    <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
                        <Icon name="alert-triangle" size={16} className="mt-0.5 shrink-0" />
                        <span><strong>Pembayaran terakhir ditolak:</strong> {invoice.latest_payment.notes}</span>
                    </div>
                )}
            </div>

            {/* Riwayat pembayaran */}
            <div className="px-6 py-5">
                <p className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-ink">
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
                    <ol className="relative space-y-4 pl-7">
                        <span className="absolute bottom-3 left-[9px] top-3 w-px bg-line" aria-hidden />
                        {payments.map((p) => {
                            const meta = PAY_STATUS[p.status] || { label: p.status, dot: 'bg-zinc-400', cls: 'bg-surface-muted text-ink-muted' };
                            const m = methodMeta(p);
                            return (
                                <li key={p.id} className="relative">
                                    <span className={`absolute -left-7 top-5 h-[19px] w-[19px] rounded-full border-[5px] border-surface ${meta.dot}`} aria-hidden />
                                    <div className="rounded-xl border border-line bg-surface p-4 transition-colors hover:border-brand-500/40">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="font-mono text-base font-bold text-ink">{formatRupiah(p.amount)}</p>
                                            <span className={`badge shrink-0 ${meta.cls}`}>{meta.label}</span>
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                                            <span className="flex items-center gap-1.5 font-medium text-ink">
                                                <Icon name={m.icon} size={13} /> {m.label}
                                            </span>
                                            {m.channel && <span className="truncate">{m.channel}</span>}
                                            <span className="flex items-center gap-1.5">
                                                <Icon name="calendar" size={12} /> {formatDate(p.paid_at || p.created_at)}
                                            </span>
                                        </div>
                                        {p.proof_url && (() => {
                                            const isPdf = p.proof_mime === 'application/pdf';
                                            return (
                                                <button type="button" onClick={() => setProof({ url: p.proof_url, pdf: isPdf })} className="group mt-3 inline-flex items-center gap-2.5 text-left" title="Lihat bukti pembayaran">
                                                    {isPdf ? (
                                                        <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-line bg-red-500/10 text-red-600 dark:text-red-400">
                                                            <Icon name="file-text" size={22} />
                                                        </span>
                                                    ) : (
                                                        <img
                                                            src={p.proof_url}
                                                            alt="Bukti pembayaran"
                                                            className="h-14 w-14 rounded-lg border border-line object-cover transition-opacity group-hover:opacity-80"
                                                        />
                                                    )}
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 group-hover:underline dark:text-brand-400">
                                                        <Icon name="eye" size={12} /> Lihat Bukti{isPdf ? ' (PDF)' : ''}
                                                    </span>
                                                </button>
                                            );
                                        })()}
                                        {p.status === 'failed' && p.notes && (
                                            <div className="mt-3 rounded-md bg-red-500/10 p-2.5 text-xs text-red-600 dark:text-red-400">
                                                <strong>Alasan penolakan:</strong> {p.notes}
                                            </div>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </div>
        </Modal>

        <Modal
            open={!!proof}
            onClose={() => setProof(null)}
            title="Bukti Pembayaran"
            fullscreen
            bodyClassName="bg-zinc-950 flex items-center justify-center"
        >
            {proof && (proof.pdf ? (
                <iframe src={proof.url} title="Bukti pembayaran" className="h-[85vh] w-full max-w-4xl rounded-xl bg-white" />
            ) : (
                <img src={proof.url} alt="Bukti pembayaran" className="max-h-[85vh] max-w-full rounded-xl object-contain" />
            ))}
        </Modal>
        </>
    );
}
