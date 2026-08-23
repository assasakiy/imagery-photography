import { useEffect, useState } from 'react';
import api from '../../api';
import Icon from '../../components/Icon';
import Skeleton from '../../components/Skeleton';
import { toast } from '../../lib/toast';
import { BANK_ICON, WALLET_ICON, channelIcon } from '../../lib/paymentHelpers';
import { formatRupiah } from '../../components/ui';

export default function PayInvoiceMethodPicker({ invoice, onSelectMethod }) {
    const [methods, setMethods] = useState({ manual: { enabled: true, account_name: '', groups: [] }, gateway: { enabled: false, channels: [] } });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/customer/payment-methods')
            .then(({ data }) => {
                setMethods(data);
            })
            .catch(() => toast.error('Gagal memuat metode pembayaran.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="space-y-4"><Skeleton variant="table" /></div>;
    }

    return (
        <div className="space-y-8">
            {methods.gateway?.enabled && methods.gateway.channels?.length > 0 && (
                <div>
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-ink-muted">Pembayaran Otomatis</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {methods.gateway.channels.map((ch) => (
                            <button
                                key={ch.code}
                                onClick={() => onSelectMethod({ type: 'gateway', data: ch })}
                                className="flex flex-col items-center gap-3 rounded-xl border border-line bg-surface p-4 text-center transition-all hover:-translate-y-1 hover:border-brand-500 hover:shadow-md"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted">
                                    {channelIcon(ch)}
                                </div>
                                <div>
                                    <p className="font-semibold text-ink">{ch.name}</p>
                                    <p className="text-xs text-ink-muted">Verifikasi Otomatis</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {methods.manual?.enabled && methods.manual.groups?.length > 0 && (
                <div>
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-ink-muted">Transfer Manual</h3>
                    <div className="space-y-6">
                        {methods.manual.groups.map((group, idx) => (
                            <div key={idx} className="rounded-xl border border-line p-5">
                                <h4 className="mb-4 flex items-center gap-2 font-bold text-ink">
                                    <span className="text-brand-500 w-5 h-5">
                                        {group.type === 'bank' ? BANK_ICON : WALLET_ICON}
                                    </span>
                                    {group.title}
                                </h4>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {group.items.map((it, iIdx) => (
                                        <button
                                            key={iIdx}
                                            onClick={() => onSelectMethod({ type: 'manual', data: { group, item: it } })}
                                            className="flex flex-col items-start gap-1 rounded-lg border border-line bg-surface p-4 text-left transition-all hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-brand-500/10"
                                        >
                                            <p className="font-semibold text-ink">{it.bank || it.name || it.merchant}</p>
                                            {it.account_number && (
                                                <p className="font-mono text-sm text-ink-muted">{it.account_number}</p>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
