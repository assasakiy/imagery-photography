import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import api from '../api';
import Icon from './Icon';
import { Modal, Field, ButtonSpinner, formatRupiah } from './ui';
import { dynamicQris } from '../utils/qris';
import { toast } from '../lib/toast';
import { getApiErrorMessage } from '../lib/errors';

const BANK_ICON = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10l9-6 9 6M5 10v9M19 10v9M9 10v9M15 10v9M3 21h18" />
    </svg>
);

const WALLET_ICON = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="14" rx="2" />
        <path d="M3 10h18M16 15h2" />
    </svg>
);

function dueLabel(dueAt) {
    if (!dueAt) return 'Belum diatur';
    const now = new Date();
    const due = new Date(dueAt);
    const days = Math.ceil((due - now) / 86400000);
    if (days < 0) return `Terlambat ${Math.abs(days)} hari`;
    if (days === 0) return 'Hari ini';
    if (days === 1) return 'Besok';
    return `Dalam ${days} hari`;
}

function dueColor(dueAt) {
    if (!dueAt) return 'text-ink-muted';
    const now = new Date();
    const due = new Date(dueAt);
    const days = Math.ceil((due - now) / 86400000);
    return days < 3 ? 'text-red-600 dark:text-red-400' : 'text-ink-muted';
}

function maskNumber(num) {
    if (!num) return '';
    const s = String(num);
    if (s.length <= 6) return s;
    return `${s.slice(0, 4)}••••${s.slice(-4)}`;
}

function channelIcon(channel) {
    if (channel?.icon_url) {
        return <img src={channel.icon_url} alt={channel.name} className="h-5 w-5 object-contain" />;
    }
    return <Icon name="credit-card" size={20} />;
}

function useQrCode(text, enabled) {
    const [src, setSrc] = useState(null);
    useEffect(() => {
        let alive = true;
        setSrc(null);
        if (!enabled || !text) {
            return () => { alive = false; };
        }
        QRCode.toDataURL(text, { width: 260, margin: 1, errorCorrectionLevel: 'M' })
            .then((dataUrl) => { if (alive) setSrc(dataUrl); })
            .catch(() => { if (alive) setSrc(null); });
        return () => { alive = false; };
    }, [text, enabled]);
    return src;
}

export default function PaymentModal({ open, onClose, invoice, projectId, onPaid }) {
    const [methods, setMethods] = useState({ manual: { enabled: true, account_name: '', groups: [] }, gateway: { enabled: false, channels: [] } });
    const [methodsLoaded, setMethodsLoaded] = useState(false);
    const [tab, setTab] = useState(null);
    const [openGroup, setOpenGroup] = useState(null);
    const [method, setMethod] = useState(null);
    const [form, setForm] = useState({ amount: '', notes: '', proof: null });
    const [saving, setSaving] = useState(false);
    const [gatewayState, setGatewayState] = useState(null);
    const proofRef = useRef(null);

    useEffect(() => {
        if (open) {
            setMethodsLoaded(false);
            setMethods({ manual: { enabled: true, account_name: '', groups: [] }, gateway: { enabled: false, channels: [] } });
            setTab(null);
            setOpenGroup(null);
            setMethod(null);
            setGatewayState(null);
            setForm({ amount: invoice ? String(invoice.remaining ?? invoice.price ?? '') : '', notes: '', proof: null });
            setSaving(false);
            api.get('/customer/payment-methods')
                .then(({ data }) => {
                    setMethods(data);
                    const manualOk = !!data.manual?.enabled && (data.manual?.groups || []).length > 0;
                    const gwOk = !!data.gateway?.enabled && (data.gateway?.channels || []).length > 0;
                    if (manualOk && gwOk) {
                        setTab('manual');
                    } else if (manualOk) {
                        setTab('manual');
                    } else if (gwOk) {
                        setTab('gateway');
                    } else {
                        setTab('none');
                    }
                    setMethodsLoaded(true);
                })
                .catch(() => setMethodsLoaded(true));
        }
    }, [open, invoice]);

    const amount = invoice ? Number(invoice.remaining ?? invoice.price ?? 0) : 0;
    const manualOk = !!methods.manual?.enabled && (methods.manual?.groups || []).length > 0;
    const gwOk = !!methods.gateway?.enabled && (methods.gateway?.channels || []).length > 0;

    const inferType = (g) => {
        if (g.type) return g.type;
        const lbl = (g.label || '').toLowerCase();
        if (lbl.includes('qris')) return 'qris';
        if (lbl.includes('wallet') || lbl.includes('e-wallet') || lbl.includes('dompet')) return 'wallet';
        return 'bank';
    };
    
    const types = methods.manual?.groups || [];
    const allAccounts = types.flatMap((g) => (g.accounts || []).map((a) => ({ ...a, __type: inferType(g) })));
    const selectedAccount = allAccounts.find((a) => a.key === method) || allAccounts[0];
    const selectedType = selectedAccount?.__type || 'bank';
    const accountName = methods.manual?.account_name || 'Studio';

    const qrisText = selectedType === 'qris' ? dynamicQris(selectedAccount?.qris, Number(form.amount) || amount) : '';
    const qrSrc = useQrCode(qrisText, selectedType === 'qris' && !!selectedAccount?.qris);

    if (!open || !invoice) return null;

    const copyRekening = async () => {
        if (!selectedAccount || selectedType === 'qris') return;
        try {
            await navigator.clipboard.writeText(selectedAccount.number);
            toast.success('Nomor rekening disalin.');
        } catch {
            toast.error('Gagal menyalin nomor rekening.');
        }
    };
    const copyQris = async () => {
        if (!selectedAccount?.qris) return;
        try {
            await navigator.clipboard.writeText(selectedAccount.qris);
            toast.success('String QRIS disalin.');
        } catch {
            toast.error('Gagal menyalin kode QRIS.');
        }
    };

    const submitGateway = async () => {
        if (!method) return;
        setSaving(true);
        setGatewayState(null);
        try {
            const { data } = await api.post(`/projects/${projectId}/payments/gateway`, {
                amount,
                method,
                return_url: window.location.origin + window.location.pathname,
            });
            if (data.checkout_url && data.checkout_url.startsWith('http')) {
                setGatewayState({ type: 'redirect', url: data.checkout_url, reference: data.reference });
            } else {
                setGatewayState({ type: 'paycode', payCode: data.pay_code, reference: data.reference });
            }
            toast.success('Instruksi pembayaran disiapkan.');
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal memproses pembayaran gateway.'));
        } finally {
            setSaving(false);
        }
    };

    const openCheckout = () => {
        if (gatewayState?.url) window.open(gatewayState.url, '_blank');
    };

    const submitManual = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = new FormData();
            data.append('amount', form.amount);
            data.append('method', 'manual_transfer');
            data.append('notes', form.notes || (
                selectedType === 'qris'
                    ? `Bayar via QRIS ${selectedAccount?.merchant || ''}`.trim()
                    : `Transfer ke ${selectedAccount.name} ${selectedAccount.number}`
            ));
            if (form.proof) data.append('proof_file', form.proof);
            await api.post(`/projects/${projectId}/payments`, data);
            toast.success('Pembayaran dikirim untuk dikonfirmasi.');
            onPaid?.();
            onClose();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal mengirim pembayaran.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Modal open={open} onClose={onClose} title="Bayar Tagihan" bodyClassName="p-0">
                <div className="border-b border-line bg-surface-muted/50 p-6">
                    <div>
                        <p className="font-mono text-xs font-semibold tracking-wide text-ink-muted">INV-{invoice.number}</p>
                        <h3 className="mt-1 text-xl font-bold text-ink">{invoice.project}</h3>
                    </div>
                    <div className="mt-5 space-y-2.5">
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-ink-muted">Total tagihan</span>
                            <span className="font-mono font-semibold text-ink">{formatRupiah(invoice.price)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-sm">
                            <span className="text-ink-muted">Jatuh tempo</span>
                            <span className={`font-medium ${dueColor(invoice.due_at)}`}>{dueLabel(invoice.due_at)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 border-t border-line pt-2.5">
                            <span className="font-medium text-ink">Sisa pembayaran</span>
                            <span className={`font-mono text-lg font-bold ${amount > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {formatRupiah(amount)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {!methodsLoaded ? (
                        <div className="flex justify-center py-8"><ButtonSpinner /></div>
                    ) : tab === 'none' ? (
                        <div className="flex flex-col items-center gap-2 py-8 text-center">
                            <Icon name="credit-card" size={28} className="text-ink-muted" />
                            <p className="text-sm text-ink-muted">Belum ada metode pembayaran yang tersedia saat ini.</p>
                        </div>
                    ) : (
                        <>
                            {manualOk && gwOk && (
                                <div className="grid grid-cols-2 gap-2 rounded-xl border border-line bg-surface p-1">
                                    <button
                                        type="button"
                                        onClick={() => setTab('manual')}
                                        className={`rounded-lg px-3 py-2 text-left transition-colors ${tab === 'manual' ? 'bg-brand-600 text-white shadow' : 'hover:bg-surface-muted'}`}
                                    >
                                        <span className="block text-sm font-semibold">Transfer Manual</span>
                                        <span className={`block text-xs ${tab === 'manual' ? 'text-white/70' : 'text-ink-muted'}`}>Verifikasi 1x24 jam</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTab('gateway')}
                                        className={`rounded-lg px-3 py-2 text-left transition-colors ${tab === 'gateway' ? 'bg-brand-600 text-white shadow' : 'hover:bg-surface-muted'}`}
                                    >
                                        <span className="flex items-center gap-1.5 text-sm font-semibold">
                                            Payment Gateway
                                            <span className="badge bg-amber-400/20 text-amber-600 dark:text-amber-400">AUTO</span>
                                        </span>
                                        <span className={`block text-xs ${tab === 'gateway' ? 'text-white/70' : 'text-ink-muted'}`}>Terverifikasi otomatis</span>
                                    </button>
                                </div>
                            )}

                            <div className={manualOk && gwOk ? 'mt-5' : ''}>
                                {tab === 'gateway' ? (
                                    gatewayState ? (
                                        <div className="space-y-4">
                                            {gatewayState.type === 'redirect' ? (
                                                <>
                                                    <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-600/20 bg-emerald-500/10 p-6 text-center">
                                                        <svg className="h-8 w-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M13 3 4 14h7l-1 7 9-11h-7l1-7z" />
                                                        </svg>
                                                        <p className="text-sm font-semibold text-ink">Halaman pembayaran disiapkan</p>
                                                        <p className="text-xs text-ink-muted">Buka halaman gateway untuk menyelesaikan pembayaran.</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button className="btn flex-1 justify-center bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600" onClick={openCheckout}>
                                                            Buka Halaman Pembayaran
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="rounded-xl border border-brand-600/30 bg-brand-600/5 p-4">
                                                        <p className="text-xs text-ink-muted">Kode pembayaran Anda</p>
                                                        <p className="mt-1 font-mono text-lg font-bold tracking-wide text-ink">{gatewayState.payCode}</p>
                                                        <p className="mt-2 text-xs text-ink-muted">Gunakan kode ini di channel yang dipilih (ATM/m-banking) untuk membayar.</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button className="btn flex-1 justify-center bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600" onClick={() => window.location.reload()}>
                                                            Saya Sudah Bayar
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                {(methods.gateway?.channels || []).map((ch) => (
                                                    <button
                                                        key={ch.code}
                                                        type="button"
                                                        onClick={() => setMethod(ch.code)}
                                                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                                                            method === ch.code
                                                                ? 'border-brand-600 bg-brand-600/5'
                                                                : 'border-line hover:border-ink-muted/40 hover:bg-surface-muted'
                                                        }`}
                                                    >
                                                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${method === ch.code ? 'bg-brand-600/10 text-brand-600 dark:text-brand-400' : 'bg-surface-muted text-ink-muted'}`}>
                                                            {channelIcon(ch)}
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block text-sm font-semibold text-ink">{ch.name}</span>
                                                            {ch.description && <span className="block text-xs text-ink-muted">{ch.description}</span>}
                                                        </span>
                                                        <span className={`h-4 w-4 shrink-0 rounded-full border-2 ${method === ch.code ? 'border-brand-600 bg-brand-600' : 'border-ink-muted/40'}`} />
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="mt-4 flex gap-2.5 rounded-xl border border-emerald-600/20 bg-emerald-500/10 p-3.5">
                                                <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M13 3 4 14h7l-1 7 9-11h-7l1-7z" />
                                                </svg>
                                                <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-300">
                                                    Status tagihan otomatis berubah menjadi <b>Lunas</b> begitu pembayaran berhasil — tanpa perlu menunggu konfirmasi admin.
                                                </p>
                                            </div>

                                            <button className="btn mt-5 w-full justify-center bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600" onClick={submitGateway} disabled={saving || !method}>
                                                {saving ? <ButtonSpinner /> : `Bayar Sekarang · ${formatRupiah(amount)}`}
                                            </button>
                                        </>
                                    )
                                ) : (
                                    <form onSubmit={submitManual} className="space-y-5">
                                        <Field label={selectedType === 'qris' ? 'Pilih merchant QRIS' : 'Pilih rekening tujuan'} required>
                                            <div className="space-y-2">
                                                {(methods.manual?.groups || []).map((group) => {
                                                    const gtype = inferType(group);
                                                    const label = group.label || (gtype === 'qris' ? 'QRIS Statis' : gtype === 'wallet' ? 'Dompet Digital' : 'Transfer Bank');
                                                    const icon = gtype === 'qris' ? <Icon name="qr" size={18} /> : gtype === 'wallet' ? WALLET_ICON : BANK_ICON;
                                                    const keyId = label + gtype;
                                                    return (
                                                        <div key={keyId} className="overflow-hidden rounded-xl border border-line">
                                                            <button
                                                                type="button"
                                                                onClick={() => setOpenGroup(openGroup === keyId ? null : keyId)}
                                                                className="flex w-full items-center gap-3 bg-surface-muted/50 px-3 py-2.5 text-left transition-colors hover:bg-surface-muted"
                                                                aria-expanded={openGroup === keyId}
                                                            >
                                                                <span className="text-ink-muted">{icon}</span>
                                                                <span className="flex-1 text-sm font-semibold text-ink">{label}</span>
                                                                <Icon name="chevron-down" size={16} className={`text-ink-muted transition-transform ${openGroup === keyId ? 'rotate-180' : ''}`} />
                                                            </button>
                                                            {openGroup === keyId && (
                                                                <div className="space-y-1 border-t border-line p-2">
                                                                    {(group.accounts || []).map((acc) => (
                                                                        <button
                                                                            key={acc.key}
                                                                            type="button"
                                                                            onClick={() => setMethod(acc.key)}
                                                                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                                                                                method === acc.key
                                                                                    ? 'bg-brand-600/10 ring-1 ring-brand-600'
                                                                                    : 'hover:bg-surface-muted'
                                                                            }`}
                                                                        >
                                                                            <span className="min-w-0 flex-1">
                                                                                {gtype === 'qris' ? (
                                                                                    <>
                                                                                        <span className="block text-sm font-semibold text-ink">{acc.merchant}</span>
                                                                                        <span className="block text-xs text-ink-muted">{acc.provider}</span>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <span className="block text-sm font-semibold text-ink">{acc.name}</span>
                                                                                        <span className="block font-mono text-xs text-ink-muted">{maskNumber(acc.number)}</span>
                                                                                    </>
                                                                                )}
                                                                            </span>
                                                                            <span className={`h-4 w-4 shrink-0 rounded-full border-2 ${method === acc.key ? 'border-brand-600 bg-brand-600' : 'border-ink-muted/40'}`} />
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </Field>

                                        {selectedAccount && selectedType === 'qris' ? (
                                            <div className="flex flex-col items-center gap-1 rounded-xl border border-brand-600/30 bg-brand-600/5 p-5 text-center">
                                                {qrSrc ? (
                                                    <img src={qrSrc} alt="QRIS" className="h-52 w-52 rounded-xl bg-white p-2" />
                                                ) : (
                                                    <div className="flex h-52 w-52 items-center justify-center rounded-xl bg-white">
                                                        <ButtonSpinner />
                                                    </div>
                                                )}
                                                <p className="mt-3 text-sm font-bold text-ink">{selectedAccount.merchant}</p>
                                                <p className="text-xs text-ink-muted">
                                                    Scan untuk membayar {formatRupiah(Number(form.amount) || amount)} — nominal terisi otomatis
                                                </p>
                                                <button type="button" className="btn-outline mt-2 px-2.5 py-1 text-xs" onClick={copyQris}>
                                                    <Icon name="copy" size={14} /> Salin kode QRIS
                                                </button>
                                            </div>
                                        ) : (
                                            selectedAccount && (
                                                <div className="rounded-xl border border-brand-600/30 bg-brand-600/5 p-4">
                                                    <p className="text-xs text-ink-muted">Transfer ke rekening berikut</p>
                                                    <div className="mt-2 flex items-center justify-between gap-3">
                                                        <span className="font-mono text-sm font-bold text-ink">
                                                            {selectedAccount.name} · {selectedAccount.number}
                                                        </span>
                                                        <button type="button" className="btn-outline shrink-0 px-2.5 py-1 text-xs" onClick={copyRekening}>
                                                            <Icon name="copy" size={14} /> Salin
                                                        </button>
                                                    </div>
                                                    <p className="mt-1.5 text-xs text-ink-muted">a.n. {accountName}</p>
                                                </div>
                                            )
                                        )}

                                        <Field label="Nominal yang ditransfer" required>
                                            <input className="input" type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                                        </Field>

                                        <Field label="Unggah bukti transfer">
                                            <button type="button" className="input flex flex-col items-center justify-center gap-1 py-6 text-center text-ink-muted" onClick={() => proofRef.current?.click()}>
                                                <Icon name="upload" size={20} />
                                                <span className="text-xs font-medium text-ink">
                                                    {form.proof ? form.proof.name : 'Klik untuk unggah screenshot/foto'}
                                                </span>
                                                <span className="text-[11px] text-ink-muted">JPG/PNG, maks. 5MB</span>
                                            </button>
                                            <input ref={proofRef} type="file" accept="image/*" className="hidden" onChange={(e) => setForm({ ...form, proof: e.target.files[0] })} />
                                        </Field>

                                        <div className="flex gap-2.5 rounded-xl border border-line bg-surface-muted p-3.5">
                                            <Icon name="alert-circle" size={16} className="mt-0.5 shrink-0 text-ink-muted" />
                                            <p className="text-xs leading-relaxed text-ink-muted">
                                                Setelah dikirim, status tagihan menjadi <b>Menunggu Konfirmasi</b>. Tim kami akan memverifikasi dalam 1x24 jam.
                                            </p>
                                        </div>

                                        <button className="btn w-full justify-center bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-600" disabled={saving || !selectedAccount}>
                                            {saving ? <ButtonSpinner /> : 'Kirim Bukti Pembayaran'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </>
    );
}
