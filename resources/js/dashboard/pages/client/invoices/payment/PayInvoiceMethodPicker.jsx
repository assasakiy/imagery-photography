import { useEffect, useState } from 'react';
import api from '../../../../api';
import Icon from '../../../../components/Icon';
import { ListSkeleton } from '../../../../components/Skeleton';
import { toast } from '../../../../lib/toast';
import { BANK_ICON, WALLET_ICON, channelIcon, inferType } from '../../../../lib/paymentHelpers';

function MethodOption({ selected, onClick, icon, title, subtitle, badge }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${
                selected
                    ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500 dark:bg-brand-500/10'
                    : 'border-line bg-surface hover:border-brand-500/40 hover:bg-surface-muted/60'
            }`}
        >
            <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-surface'
                }`}
            >
                {selected && <Icon name="check" size={11} />}
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink">
                {icon}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{title}</span>
                {subtitle && <span className="mt-0.5 block truncate font-mono text-xs text-ink-muted">{subtitle}</span>}
            </span>
            {badge}
        </button>
    );
}

function GroupLabel({ icon, children }) {
    return (
        <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
            <span className="flex h-4 w-4 items-center justify-center text-brand-500">{icon}</span>
            {children}
        </h3>
    );
}

const AUTO_BADGE = (
    <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
        Otomatis
    </span>
);

export default function PayInvoiceMethodPicker({ invoice, onSelectMethod, initialSelected }) {
    const [methods, setMethods] = useState({ manual: { enabled: true, groups: [] }, gateway: { enabled: false, channels: [] } });
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        api.get('/customer/payment-methods')
            .then(({ data }) => {
                setMethods(data);
                // Pre-select from initialSelected (reconstructed from channel fields)
                if (initialSelected && !selected) {
                    const gtype = initialSelected.data?.gtype;
                    const channelLabel = initialSelected.data?.item?.name || initialSelected.data?.item?.merchant;
                    const accountNumber = initialSelected.data?.item?.number;
                    if (gtype && channelLabel) {
                        // Search in manual groups
                        const groups = data?.manual?.groups || [];
                        for (let gi = 0; gi < groups.length; gi++) {
                            const g = groups[gi];
                            const gt = inferType(g);
                            if (gt !== gtype) continue;
                            const accounts = g.accounts || [];
                            for (let ai = 0; ai < accounts.length; ai++) {
                                const it = accounts[ai];
                                const match = gtype === 'qris'
                                    ? (it.merchant === channelLabel)
                                    : (it.number === accountNumber && (it.name || it.merchant) === channelLabel);
                                if (match) {
                                    setSelected({ key: `mn-${gi}-${ai}`, type: 'manual', data: { group: g, item: it, gtype: gt, account_name: it.holder } });
                                    return;
                                }
                            }
                        }
                    }
                }
            })
            .catch(() => toast.error('Gagal memuat metode pembayaran.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="space-y-4"><ListSkeleton rows={4} leading="icon" /></div>;
    }

    const gwEnabled = methods.gateway?.enabled && methods.gateway.channels?.length > 0;
    const manualGroups = (methods.manual?.enabled ? methods.manual.groups : []) || [];
    const hasAny = gwEnabled || manualGroups.length > 0;

    if (!hasAny) {
        return (
            <div className="card p-8 text-center">
                <Icon name="credit-card" size={28} className="mx-auto mb-3 text-ink-muted" />
                <p className="text-sm font-semibold text-ink">Belum ada metode pembayaran</p>
                <p className="mt-1 text-sm text-ink-muted">Metode pembayaran belum diaktifkan. Silakan hubungi kami.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="card divide-y divide-line p-0">
                {gwEnabled && (
                    <div className="p-5 sm:p-6">
                        <GroupLabel icon={<Icon name="zap" size={14} />}>Payment Gateway</GroupLabel>
                        <div className="space-y-2.5">
                            {methods.gateway.channels.map((ch) => {
                                const key = `gw-${ch.code}`;
                                return (
                                    <MethodOption
                                        key={key}
                                        selected={selected?.key === key}
                                        onClick={() => setSelected({ key, type: 'gateway', data: ch })}
                                        icon={channelIcon(ch)}
                                        title={ch.name}
                                        subtitle="Verifikasi otomatis oleh sistem"
                                        badge={AUTO_BADGE}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}

                {manualGroups.map((group, idx) => {
                    const gtype = inferType(group);
                    const label = group.label || (gtype === 'qris' ? 'QRIS Statis' : gtype === 'wallet' ? 'Dompet Digital' : 'Transfer Manual');
                    const gIcon = gtype === 'qris' ? <Icon name="qr" size={14} /> : gtype === 'wallet' ? WALLET_ICON : BANK_ICON;

                    return (
                        <div key={idx} className="p-5 sm:p-6">
                            <GroupLabel icon={gIcon}>{label}</GroupLabel>
                            <div className="space-y-2.5">
                                {(group.accounts || []).map((it, iIdx) => {
                                    const key = `mn-${idx}-${iIdx}`;
                                    return (
                                        <MethodOption
                                            key={key}
                                            selected={selected?.key === key}
                                            onClick={() => setSelected({ key, type: 'manual', data: { group, item: it, gtype, account_name: it.holder } })}
                                            icon={gtype === 'wallet' ? WALLET_ICON : gtype === 'qris' ? <Icon name="qr" size={16} /> : BANK_ICON}
                                            title={it.name || it.merchant || label}
                                            subtitle={it.number ? `${it.number}${it.holder ? ` · a.n. ${it.holder}` : ''}` : (it.holder || null)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="pb-2">
                <button
                    className="btn-primary w-full justify-center py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!selected}
                    onClick={() => selected && onSelectMethod({ type: selected.type, data: selected.data })}
                >
                    <Icon name="check" size={16} />
                    Konfirmasi
                </button>
                <p className="mt-2 text-center text-xs text-ink-muted">
                    {selected ? `Metode dipilih: ${selected.type === 'gateway' ? selected.data.name : (selected.data.item.name || selected.data.item.merchant || 'Transfer Manual')}` : 'Pilih metode pembayaran terlebih dahulu'}
                </p>
            </div>
        </div>
    );
}
