import { useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import { copyToClipboard } from '../../lib/clipboard';
import { useQrCode, BANK_ICON, WALLET_ICON } from '../../lib/paymentHelpers';
import { dynamicQris } from '../../utils/qris';
import { formatRupiah, ButtonSpinner } from '../../components/ui';

export default function PayInvoiceInstructions({ invoice, method, onProceed }) {
    const isManual = method.type === 'manual';
    const isGateway = method.type === 'gateway';
    
    // QRIS state (jika manual QRIS)
    const isQris = isManual && !!method.data.item.qris_data;
    const qrisData = isQris ? dynamicQris(method.data.item.qris_data, Number(invoice.remaining)) : null;
    const qrSrc = useQrCode(qrisData, isQris);
    const [copied, setCopied] = useState(false);
    
    const handleCopy = (text) => {
        copyToClipboard(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="mx-auto max-w-xl">
            <div className="card overflow-hidden">
                <div className="bg-brand-50 p-6 text-center dark:bg-brand-900/20">
                    <p className="text-sm font-medium text-brand-600 dark:text-brand-400">Total yang harus dibayar</p>
                    <h2 className="mt-2 text-3xl font-bold text-ink">{formatRupiah(invoice.remaining)}</h2>
                </div>

                <div className="p-6">
                    {isGateway && (
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted">
                                <Icon name="credit-card" size={28} className="text-ink" />
                            </div>
                            <h3 className="text-lg font-bold text-ink">Pembayaran Otomatis via {method.data.name}</h3>
                            <p className="mt-2 text-sm text-ink-muted">
                                Anda akan diarahkan ke halaman pembayaran eksternal yang aman. Bukti pembayaran akan diverifikasi secara otomatis oleh sistem.
                            </p>
                        </div>
                    )}

                    {isManual && !isQris && (
                        <div>
                            <h3 className="text-lg font-bold text-ink mb-6 text-center">Transfer ke Rekening Berikut</h3>
                            <div className="rounded-xl border border-line p-5">
                                <div className="flex items-center gap-3 border-b border-line pb-4 mb-4">
                                    <span className="text-brand-500 w-6 h-6">
                                        {method.data.group.type === 'bank' ? BANK_ICON : WALLET_ICON}
                                    </span>
                                    <div>
                                        <p className="font-bold text-ink">{method.data.item.bank || method.data.item.name}</p>
                                        <p className="text-xs text-ink-muted">a.n. {method.data.item.account_name || 'Owner'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-4 bg-surface-muted p-4 rounded-lg">
                                    <div>
                                        <p className="text-xs text-ink-muted">Nomor Rekening</p>
                                        <p className="font-mono text-lg font-bold text-ink tracking-widest">{method.data.item.account_number}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleCopy(method.data.item.account_number)}
                                        className="flex items-center gap-1 rounded bg-white px-3 py-1.5 text-xs font-semibold text-brand-600 shadow-sm border border-line hover:bg-brand-50 dark:bg-zinc-800 dark:text-brand-400"
                                    >
                                        <Icon name={copied ? 'check' : 'copy'} size={14} />
                                        {copied ? 'Tersalin!' : 'Salin'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {isQris && (
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-ink mb-2">Scan QRIS</h3>
                            <p className="text-sm text-ink-muted mb-6">Buka aplikasi m-banking atau e-wallet Anda dan scan kode di bawah ini.</p>
                            
                            <div className="mx-auto inline-block rounded-2xl bg-white p-4 shadow-sm border border-line">
                                {qrSrc ? (
                                    <img src={qrSrc} alt="QRIS" className="h-64 w-64 object-contain" />
                                ) : (
                                    <div className="flex h-64 w-64 items-center justify-center bg-gray-100 text-gray-400">
                                        <Icon name="loader" size={24} className="animate-spin" />
                                    </div>
                                )}
                            </div>
                            <p className="mt-4 font-bold text-ink">{method.data.item.merchant || 'Merchant QRIS'}</p>
                        </div>
                    )}
                </div>

                <div className="border-t border-line bg-surface p-6 flex flex-col gap-3">
                    <button className="btn-primary w-full justify-center py-3 text-sm" onClick={onProceed}>
                        {isGateway ? 'Lanjut ke Halaman Pembayaran' : 'Saya Sudah Transfer'}
                    </button>
                    {!isGateway && (
                        <p className="text-center text-xs text-ink-muted">
                            Siapkan bukti screenshot/foto struk transfer Anda.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
