import { useState } from 'react';
import Icon from '../../../components/Icon';
import Toggle from '../../../components/Toggle';
import { POPULAR_BANKS, POPULAR_WALLETS, QRIS_PROVIDERS } from './constants';

function BrandTile({ code, name, short, brandColor, dark, size = 'h-8 w-8 text-[10px]' }) {
    const fill = dark ? 'text-zinc-900' : 'text-white';
    return (
        <span
            className={`flex ${size} shrink-0 items-center justify-center rounded-lg font-bold ${fill}`}
            style={{ backgroundColor: brandColor }}
            aria-hidden="true"
        >
            {short || name?.slice(0, 2)?.toUpperCase() || code}
        </span>
    );
}

function ManualRulesCard({ form, toggleManualPayment, open, setOpen, set, save }) {
    const configured = Array.isArray(form.payment_manual_accounts) && form.payment_manual_accounts.some(g => g.accounts?.length);
    const enabled = form.payment_manual_enabled;

    const toggleAccount = async (key, checked) => {
        const active = form.payment_active_manuals || [];
        const next = checked ? [...active, key] : active.filter(k => k !== key);
        set('payment_active_manuals', next);
        await save(['payment_active_manuals'], { payment_active_manuals: next });
    };

    const toggleQris = async (key) => {
        set('payment_active_qris', key);
        await save(['payment_active_qris'], { payment_active_qris: key });
    };

    const badgeClass = !configured
        ? 'bg-zinc-500/15 text-ink-muted'
        : enabled
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            : 'bg-zinc-500/15 text-ink-muted';
    const badgeLabel = !configured ? 'Belum Dikonfigurasi' : enabled ? 'Aktif' : 'Nonaktif';

    const renderAccountList = () => {
        const banks = (form.payment_manual_accounts || []).find(g => g.type === 'bank')?.accounts || [];
        const wallets = (form.payment_manual_accounts || []).find(g => g.type === 'wallet')?.accounts || [];
        const qris = (form.payment_manual_accounts || []).find(g => g.type === 'qris')?.accounts || [];

        return (
            <div className="mt-4 border-t border-line pt-2">
                {banks.length > 0 && (
                    <div className="mb-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Transfer Bank</p>
                        {banks.map(acc => {
                            const meta = POPULAR_BANKS.find(b => b.code === acc.code) || { name: acc.name, short: acc.name?.slice(0, 2), brandColor: '#52525B' };
                            const isActive = (form.payment_active_manuals || []).includes(acc.key);
                            return (
                                <div key={acc.key} className="flex items-center justify-between gap-4 py-2">
                                    <div className="flex items-center gap-3">
                                        <BrandTile {...meta} size="h-6 w-6 text-[8px]" />
                                        <div>
                                            <p className="text-sm font-medium text-ink">{acc.name}</p>
                                            <p className="font-mono text-xs text-ink-muted">{acc.number} - {acc.holder}</p>
                                        </div>
                                    </div>
                                    <Toggle size="sm" checked={isActive} onChange={(v) => toggleAccount(acc.key, v)} />
                                </div>
                            );
                        })}
                    </div>
                )}

                {wallets.length > 0 && (
                    <div className="mb-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Dompet Digital</p>
                        {wallets.map(acc => {
                            const meta = POPULAR_WALLETS.find(w => w.code === acc.code) || { name: acc.name, short: acc.name?.slice(0, 2), brandColor: '#52525B' };
                            const isActive = (form.payment_active_manuals || []).includes(acc.key);
                            return (
                                <div key={acc.key} className="flex items-center justify-between gap-4 py-2">
                                    <div className="flex items-center gap-3">
                                        <BrandTile {...meta} size="h-6 w-6 text-[8px]" />
                                        <div>
                                            <p className="text-sm font-medium text-ink">{acc.name}</p>
                                            <p className="font-mono text-xs text-ink-muted">{acc.number} - {acc.holder}</p>
                                        </div>
                                    </div>
                                    <Toggle size="sm" checked={isActive} onChange={(v) => toggleAccount(acc.key, v)} />
                                </div>
                            );
                        })}
                    </div>
                )}

                {qris.length > 0 && (
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">QRIS Statis (Pilih Satu)</p>
                        <div className="space-y-2">
                            {qris.map(acc => {
                                const meta = QRIS_PROVIDERS.find(p => p.code === acc.providerCode) || { name: acc.provider, short: 'QR', brandColor: '#52525B' };
                                const isActive = form.payment_active_qris === acc.key;
                                return (
                                    <label key={acc.key} className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-colors ${isActive ? 'border-brand-600 bg-brand-600/5' : 'border-line hover:bg-surface-muted'}`}>
                                        <div className="flex items-center gap-3">
                                            <BrandTile {...meta} size="h-6 w-6 text-[8px]" />
                                            <div>
                                                <p className="text-sm font-medium text-ink">{acc.merchant}</p>
                                                <p className="text-xs text-ink-muted">{acc.provider}</p>
                                            </div>
                                        </div>
                                        <input
                                            type="radio"
                                            name="qris_active"
                                            checked={isActive}
                                            onChange={() => toggleQris(acc.key)}
                                            className="h-4 w-4 border-line text-brand-600 focus:ring-brand-600"
                                        />
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="card w-full p-6">
            <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4" aria-expanded={open}>
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-ink-muted">
                        <Icon name="landmark" size={20} />
                    </span>
                    <div className="text-left">
                        <h2 className="font-semibold text-ink">Transfer Manual</h2>
                        <p className="text-xs text-ink-muted">Pilih rekening yang tampil di popup pembayaran klien.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>{badgeLabel}</span>
                    <Icon name="chevron-down" size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {!configured && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
                    <Icon name="alert-triangle" size={16} className="mt-0.5 shrink-0" />
                    <p>
                        Transfer manual belum dikonfigurasi di tab Integrasi. Tambahkan rekening bank, dompet digital, atau QRIS terlebih dahulu.
                    </p>
                </div>
            )}

            {open && configured && renderAccountList()}
        </div>
    );
}

function GatewayRulesCard({ form, meta, toggleGatewayPayment, open, setOpen, set, save }) {
    const configured = meta.payment_gateway_configured;
    const enabled = form.payment_gateway_enabled;

    // Untuk mock UI jika API gateway belum benar-benar ada (sementara disimulasikan sebagai daftar fix)
    const channels = [
        { code: 'QRIS', name: 'QRIS', type: 'qris' },
        { code: 'BCAVA', name: 'BCA Virtual Account', type: 'va' },
        { code: 'MANDIRIVA', name: 'Mandiri Virtual Account', type: 'va' },
        { code: 'BRIVA', name: 'BRI Virtual Account', type: 'va' },
        { code: 'ALFAMART', name: 'Alfamart', type: 'retail' }
    ];

    const toggleChannel = async (code, checked) => {
        const active = form.payment_active_channels || [];
        const next = checked ? [...active, code] : active.filter(c => c !== code);
        set('payment_active_channels', next);
        await save(['payment_active_channels'], { payment_active_channels: next });
    };

    const badgeClass = !configured
        ? 'bg-zinc-500/15 text-ink-muted'
        : enabled
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            : 'bg-zinc-500/15 text-ink-muted';
    const badgeLabel = !configured ? 'Belum Dikonfigurasi' : enabled ? 'Aktif' : 'Nonaktif';

    return (
        <div className="card w-full p-6">
            <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4" aria-expanded={open}>
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-ink-muted">
                        <Icon name="credit-card" size={20} />
                    </span>
                    <div className="text-left">
                        <h2 className="font-semibold text-ink">Payment Gateway (TriPay)</h2>
                        <p className="text-xs text-ink-muted">Pilih metode pembayaran otomatis yang tampil di popup.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>{badgeLabel}</span>
                    <Icon name="chevron-down" size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {!configured && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
                    <Icon name="alert-triangle" size={16} className="mt-0.5 shrink-0" />
                    <p>
                        Kredensial Payment Gateway (TriPay) belum diisi di tab Integrasi. Konfigurasi terlebih dahulu untuk dapat mengaktifkan.
                    </p>
                </div>
            )}

            {open && configured && (
                <div className="mt-4 border-t border-line pt-2">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Metode Tersedia</p>
                    <div className="space-y-1">
                        {channels.map(ch => {
                            const isActive = (form.payment_active_channels || []).includes(ch.code);
                            return (
                                <div key={ch.code} className="flex items-center justify-between gap-4 py-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-ink-muted">
                                            <Icon name="credit-card" size={14} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-ink">{ch.name}</p>
                                            <p className="text-xs text-ink-muted uppercase">{ch.type}</p>
                                        </div>
                                    </div>
                                    <Toggle size="sm" checked={isActive} onChange={(v) => toggleChannel(ch.code, v)} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PaymentTab(props) {
    const { form, meta, set, save, toggleManualPayment, toggleGatewayPayment } = props;
    const [openManual, setOpenManual] = useState(true);
    const [openGateway, setOpenGateway] = useState(false);

    return (
        <div className="space-y-6">
            <ManualRulesCard
                form={form}
                set={set}
                save={save}
                toggleManualPayment={toggleManualPayment}
                open={openManual}
                setOpen={setOpenManual}
            />
            <GatewayRulesCard
                form={form}
                meta={meta}
                set={set}
                save={save}
                toggleGatewayPayment={toggleGatewayPayment}
                open={openGateway}
                setOpen={setOpenGateway}
            />
        </div>
    );
}