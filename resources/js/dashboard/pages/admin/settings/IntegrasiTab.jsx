import { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import Icon from '../../../components/Icon';
import Button from '../../../components/Button';
import Toggle from '../../../components/Toggle';
import { Field } from '../../../components/ui';
import { toast } from '../../../lib/toast';
import { SMTP_FIELDS, WA_FIELDS, TRIPAY_FIELDS, GOOGLE_FIELDS, MASK, POPULAR_BANKS, POPULAR_WALLETS, QRIS_PROVIDERS } from './constants';
import { validateQris } from '../../../utils/qris';

const uid = () => Math.random().toString(36).slice(2, 10);

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

function LogoSelect({ options, value, onChange, placeholder, error }) {
    const [open, setOpen] = useState(false);
    const selected = options.find((o) => o.code === value);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`input flex w-full items-center justify-between gap-2 ${error ? 'border-red-500' : ''}`}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className="flex min-w-0 items-center gap-2">
                    {selected ? (
                        <>
                            <BrandTile {...selected} />
                            <span className="truncate text-sm font-semibold text-ink">{selected.name}</span>
                        </>
                    ) : (
                        <span className="text-sm text-ink-muted">{placeholder || 'Pilih…'}</span>
                    )}
                </span>
                <Icon name="chevron-down" size={16} className={`shrink-0 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <ul
                    className="absolute z-20 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-xl"
                    role="listbox"
                >
                    {options.map((opt) => (
                        <li key={opt.code} role="option" aria-selected={value === opt.code}>
                            <button
                                type="button"
                                onClick={() => {
                                    onChange(opt.code);
                                    setOpen(false);
                                }}
                                className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors ${
                                    value === opt.code ? 'bg-brand-600/10 ring-1 ring-brand-600' : 'hover:bg-surface-muted'
                                }`}
                            >
                                <BrandTile size="h-8 w-8 text-[10px]" {...opt} />
                                <span className="min-w-0 flex-1 text-sm font-semibold text-ink">{opt.name}</span>
                                {value === opt.code && <Icon name="check" size={16} className="shrink-0 text-brand-600" />}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function BankRow({ acc, onAcc, onRemove }) {
    const setCode = (code) => {
        const meta = POPULAR_BANKS.find((b) => b.code === code);
        onAcc({
            ...acc,
            code,
            name: meta?.name || code,
            short: meta?.short || code,
            brandColor: meta?.brandColor || '#52525B',
            dark: meta?.dark || false,
        });
    };

    return (
        <div className="rounded-2xl border border-line p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <Field label="Bank" required>
                        <LogoSelect options={POPULAR_BANKS} value={acc.code} onChange={setCode} placeholder="Pilih bank…" />
                    </Field>
                </div>
                <Field label="Nomor rekening" required>
                    <input className="input font-mono" placeholder="8801234567" value={acc.number || ''} onChange={(e) => onAcc({ ...acc, number: e.target.value })} />
                </Field>
                <Field label="Atas nama" required>
                    <input className="input" placeholder="Sopian Lalu Imagery" value={acc.holder || ''} onChange={(e) => onAcc({ ...acc, holder: e.target.value })} />
                </Field>
            </div>
            <div className="mt-3 flex justify-end">
                <button type="button" onClick={onRemove} className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-red-500">
                    <Icon name="trash" size={14} /> Hapus
                </button>
            </div>
        </div>
    );
}

function WalletRow({ acc, onAcc, onRemove }) {
    const setCode = (code) => {
        const meta = POPULAR_WALLETS.find((w) => w.code === code);
        onAcc({
            ...acc,
            code,
            name: meta?.name || code,
            short: meta?.short || code,
            brandColor: meta?.brandColor || '#52525B',
            dark: meta?.dark || false,
        });
    };

    return (
        <div className="rounded-2xl border border-line p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <Field label="Dompet digital" required>
                        <LogoSelect options={POPULAR_WALLETS} value={acc.code} onChange={setCode} placeholder="Pilih e-wallet…" />
                    </Field>
                </div>
                <Field label="Nomor HP / ID" required>
                    <input className="input font-mono" placeholder="0812xxxxxx" value={acc.number || ''} onChange={(e) => onAcc({ ...acc, number: e.target.value })} />
                </Field>
                <Field label="Atas nama" required>
                    <input className="input" placeholder="Sopian Lalu Imagery" value={acc.holder || ''} onChange={(e) => onAcc({ ...acc, holder: e.target.value })} />
                </Field>
            </div>
            <div className="mt-3 flex justify-end">
                <button type="button" onClick={onRemove} className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-red-500">
                    <Icon name="trash" size={14} /> Hapus
                </button>
            </div>
        </div>
    );
}

function QrisRow({ acc, onAcc, onRemove, onScanStart }) {
    const fileRef = useRef(null);
    const setProvider = (code) => {
        const meta = QRIS_PROVIDERS.find((p) => p.code === code);
        onAcc({ ...acc, providerCode: code, provider: meta?.name || code });
    };
    const isOther = acc.providerCode === 'other';

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        onScanStart(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, img.width, img.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                if (code && code.data) {
                    onAcc({ ...acc, qris: code.data.trim() });
                } else {
                    toast.error('Gagal mendeteksi kode QR dari gambar.');
                }
                onScanStart(false);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const val = validateQris(acc.qris);

    return (
        <div className="rounded-2xl border border-line p-4">
            <div className="grid grid-cols-1 gap-3">
                <Field label="Penyedia" required>
                    <LogoSelect options={QRIS_PROVIDERS} value={acc.providerCode || 'gopay'} onChange={setProvider} placeholder="Pilih penyedia…" />
                </Field>
                {isOther && (
                    <Field label="Nama penyedia" required>
                        <input className="input" placeholder="GoPay Merchant / lainnya" value={acc.provider || ''} onChange={(e) => onAcc({ ...acc, provider: e.target.value })} />
                    </Field>
                )}
                <Field label="Nama merchant / usaha" required>
                    <input className="input" placeholder="Sopian Lalu Imagery" value={acc.merchant || ''} onChange={(e) => onAcc({ ...acc, merchant: e.target.value })} />
                </Field>
                <div className="sm:col-span-1">
                    <Field label="Data QRIS Statis" required hint="Upload gambar atau paste string 000201...">
                        <div className="flex flex-col gap-2">
                            <textarea
                                className="input min-h-[70px] resize-y font-mono text-xs"
                                placeholder="0002010102112676…"
                                value={acc.qris || ''}
                                onChange={(e) => onAcc({ ...acc, qris: e.target.value.trim() })}
                            />
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-muted/50 p-3">
                                <div className="text-xs">
                                    {!acc.qris ? (
                                        <span className="text-ink-muted">Belum ada data QRIS.</span>
                                    ) : val.valid ? (
                                        <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                                            <Icon name="check" size={14} /> Valid | {val.name} ({val.type})
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 font-medium text-red-600 dark:text-red-400">
                                            <Icon name="alert-triangle" size={14} /> {val.error}
                                        </span>
                                    )}
                                </div>
                                <button type="button" onClick={() => fileRef.current?.click()} className="btn-outline shrink-0 !px-2.5 !py-1.5 !text-xs">
                                    <Icon name="upload" size={14} /> Upload QR
                                </button>
                                <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleFile} />
                            </div>
                        </div>
                    </Field>
                </div>
            </div>
            <div className="mt-3 flex justify-end">
                <button type="button" onClick={onRemove} className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-red-500">
                    <Icon name="trash" size={14} /> Hapus
                </button>
            </div>
        </div>
    );
}

const GROUP_DEFS = {
    bank: { label: 'Transfer Bank', icon: 'landmark', desc: 'Rekening bank untuk transfer manual.' },
    wallet: { label: 'Dompet Digital', icon: 'wallet', desc: 'E-wallet Indonesia untuk pembayaran.' },
    qris: { label: 'QRIS Statis', icon: 'qr', desc: 'QRIS statis — nominal diisi otomatis saat scan (dinamis).' },
};

function AccountsSection({ type, accounts, onAccs, onScanStart }) {
    const def = GROUP_DEFS[type];

    const add = () => {
        if (type === 'qris') {
            onAccs([...(accounts || []), { type, key: uid(), providerCode: 'gopay', provider: 'GoPay Merchant', merchant: '', qris: '' }]);
        } else {
            onAccs([...(accounts || []), { type, key: uid(), code: '', name: '', short: '', number: '', holder: '' }]);
        }
    };
    const upd = (key, acc) => onAccs((accounts || []).map((a) => (a.key === key ? acc : a)));

    const Row = type === 'bank' ? BankRow : type === 'wallet' ? WalletRow : QrisRow;

    return (
        <div className="flex items-start gap-3">
            <div className="w-full">
                <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-ink-muted">
                        <Icon name={def.icon} size={16} />
                    </span>
                    <div>
                        <h4 className="text-sm font-semibold text-ink">{def.label}</h4>
                        <p className="text-xs text-ink-muted">{def.desc}</p>
                    </div>
                </div>
                <div className="space-y-3">
                    {(accounts || []).map((acc) => (
                        <Row key={acc.key} acc={acc} onAcc={(a) => upd(acc.key, a)} onRemove={() => onAccs((accounts || []).filter((x) => x.key !== acc.key))} onScanStart={onScanStart} />
                    ))}
                </div>
                <Button variant="outline" size="sm" icon="plus" className="mt-3" onClick={add}>
                    Tambah {def.label}
                </Button>
            </div>
        </div>
    );
}

export default function IntegrasiTab({
    form, meta, errors, saving, set, save, dirty,
    openEmail, setOpenEmail, openWa, setOpenWa, openTripay, setOpenTripay, openGoogle, setOpenGoogle, openManual, setOpenManual,
    toggleEmailChannel, toggleWaChannel, togglePaymentGateway, toggleGoogleAuth, toggleManualPayment,
    testEmail, testWhatsapp, testGateway, testingEmail, testingWhatsapp, testingTripay,
    waDrivers, waDriver, waFields, waConfig, setWaDriver,
    webhookConfigured, webhookEnabled, toggleWebhookChannel, testWebhook, testingWebhook,
}) {
    const [loaded, setLoaded] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [groups, setGroups] = useState([]);
    const [openWebhook, setOpenWebhook] = useState(false);

    const inferType = (label) => {
        const lbl = (label || '').toLowerCase();
        if (lbl.includes('qris')) return 'qris';
        if (lbl.includes('wallet') || lbl.includes('e-wallet') || lbl.includes('dompet')) return 'wallet';
        return 'bank';
    };
    const matchBank = (name) => {
        const n = (name || '').toLowerCase();
        return POPULAR_BANKS.find((b) => b.name.toLowerCase() === n || b.code === n)
            || POPULAR_BANKS.find((b) => n.includes(b.code) || b.name.toLowerCase().includes(n));
    };
    const matchWallet = (name) => {
        const n = (name || '').toLowerCase();
        return POPULAR_WALLETS.find((w) => w.name.toLowerCase() === n || w.code === n)
            || POPULAR_WALLETS.find((w) => n.includes(w.code) || w.name.toLowerCase().includes(n));
    };

    useEffect(() => {
        if (loaded) return;
        const raw = Array.isArray(form.payment_manual_accounts) ? form.payment_manual_accounts : [];
        const seed = { bank: [], wallet: [], qris: [] };
        for (const gr of raw) {
            const type = gr.type || inferType(gr.label);
            for (const acc of gr.accounts || []) {
                if (type === 'qris') {
                    seed.qris.push({ type: 'qris', key: acc.key || uid(), providerCode: 'gopay', provider: 'GoPay Merchant', merchant: acc.merchant || acc.name || '', qris: acc.qris || '' });
                    continue;
                }
                if (type === 'wallet') {
                    const m = matchWallet(acc.code || acc.name);
                    seed.wallet.push({ type: 'wallet', key: acc.key || uid(), code: m?.code || acc.code || uid(), name: m?.name || acc.name || '', short: m?.short || '', brandColor: m?.brandColor || '#52525B', dark: m?.dark || false, number: acc.number || '', holder: acc.holder || '' });
                    continue;
                }
                const m = matchBank(acc.code || acc.name);
                seed.bank.push({ type: 'bank', key: acc.key || uid(), code: m?.code || acc.code || uid(), name: m?.name || acc.name || '', short: m?.short || '', brandColor: m?.brandColor || '#52525B', dark: m?.dark || false, number: acc.number || '', holder: acc.holder || '' });
            }
        }
        setGroups([
            ...Object.entries(seed).map(([type, accounts]) => ({ type, accounts })),
        ]);
        setLoaded(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loaded]);

    const accountsOf = (type) => groups.find((gr) => gr.type === type)?.accounts || [];
    const updateAccounts = (type, next) => {
        const newGroups = [...groups.filter((gr) => gr.type !== type), { type, accounts: next }];
        setGroups(newGroups);
        set('payment_manual_accounts', newGroups);
    };

    const tripayCfg = form.payment_tripay_config || { mode: 'sandbox', api_key: '', private_key: '', merchant_code: '' };
    const tripayConfigured = meta.payment_gateway_configured;
    const googleConfigured = !!(form.google_client_id || '').trim();
    const manualConfigured = Array.isArray(form.payment_manual_accounts) && form.payment_manual_accounts.some(g => g.accounts?.length);

    return (
        <>
        <div className="space-y-6">
            <div className="card w-full p-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-ink">Transfer Manual</h2>
                        <p className="text-xs text-ink-muted">Kelola rekening bank, dompet digital, dan QRIS statis.</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setOpenManual((v) => !v)}
                            className={`badge cursor-pointer transition-colors ${
                                !manualConfigured
                                    ? 'bg-red-500/15 text-red-600 hover:bg-red-500/25 dark:text-red-400'
                                    : form.payment_manual_enabled
                                      ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400'
                                      : 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 dark:text-amber-400'
                            }`}
                        >
                            <Icon name="chevron-down" size={12} className={`transition-transform ${openManual ? 'rotate-180' : ''}`} />
                            {!manualConfigured ? 'Belum Dikonfigurasi' : form.payment_manual_enabled ? 'Aktif' : 'Nonaktif'}
                        </button>
                    </div>
                </div>

                {manualConfigured && (
                    <div className="mt-4 border-b border-line pb-4">
                        <Toggle
                            checked={form.payment_manual_enabled}
                            onChange={(v) => toggleManualPayment(v)}
                            label="Aktifkan pembayaran transfer manual"
                            desc={form.payment_manual_enabled
                                ? 'Klien dapat memilih rekening yang diaktifkan di tab Pembayaran.'
                                : 'Metode transfer manual disembunyikan dari pop-up pembayaran.'}
                        />
                    </div>
                )}

                {openManual && (
                    <div className="mt-5 border-t border-line pt-5">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <AccountsSection type="bank" accounts={accountsOf('bank')} onAccs={(u) => updateAccounts('bank', u)} />
                            <AccountsSection type="wallet" accounts={accountsOf('wallet')} onAccs={(u) => updateAccounts('wallet', u)} />
                            <div className="lg:col-span-2">
                                <AccountsSection type="qris" accounts={accountsOf('qris')} onAccs={(u) => updateAccounts('qris', u)} onScanStart={setScanning} />
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-line pt-5">
                            <Button
                                icon="check"
                                loading={saving || scanning}
                                disabled={!dirty(['payment_manual_accounts']) || scanning}
                                onClick={() => save(['payment_manual_accounts'])}
                            >
                                Simpan Transfer Manual
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="card w-full p-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-ink">Email (SMTP)</h2>
                        <p className="text-xs text-ink-muted">Dipakai untuk notifikasi email, OTP login, dan email uji.</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setOpenEmail((v) => !v)}
                            className={`badge cursor-pointer transition-colors ${
                                !meta.email_configured
                                    ? 'bg-red-500/15 text-red-600 hover:bg-red-500/25 dark:text-red-400'
                                    : form.notif_email_enabled
                                      ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400'
                                      : 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 dark:text-amber-400'
                            }`}
                        >
                            <Icon name="chevron-down" size={12} className={`transition-transform ${openEmail ? 'rotate-180' : ''}`} />
                            {!meta.email_configured ? 'Belum Dikonfigurasi' : form.notif_email_enabled ? 'Aktif' : 'Nonaktif'}
                        </button>
                    </div>
                </div>

                {meta.email_configured && (
                    <div className="mt-4 border-b border-line pb-4">
                        <Toggle
                            checked={form.notif_email_enabled}
                            onChange={(v) => toggleEmailChannel(v)}
                            label="Aktifkan integrasi Email"
                            desc={form.notif_email_enabled
                                ? 'Integrasi aktif — notifikasi email dikirim.'
                                : 'Integrasi nonaktif. Konfigurasi tetap tersimpan.'}
                        />
                    </div>
                )}

                {meta.env_mail_configured && (
                    <p className="mt-4 rounded-lg bg-sky-500/10 px-3 py-2 text-xs text-sky-600 dark:text-sky-400">
                        SMTP juga dikonfigurasi di file <code>.env</code>. Nilai di dashboard ini menimpa konfigurasi tersebut.
                    </p>
                )}

                {openEmail && (
                    <div className="mt-5">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Host" hint="wajib" error={errors.mail_host?.[0]}>
                                <input className="input" placeholder="smtp.gmail.com" value={form.mail_host} onChange={(e) => set('mail_host', e.target.value)} />
                            </Field>
                            <Field label="Port" hint="wajib" error={errors.mail_port?.[0]}>
                                <input className="input" type="number" placeholder="587" value={form.mail_port} onChange={(e) => set('mail_port', e.target.value)} />
                            </Field>
                            <Field label="Username" hint="opsional">
                                <input className="input" autoComplete="off" value={form.mail_username} onChange={(e) => set('mail_username', e.target.value)} />
                            </Field>
                            <Field label="Password" hint="opsional">
                                <input className="input" type="password" autoComplete="new-password" placeholder={form.mail_password === MASK ? '••••••••' : ''} value={form.mail_password === MASK ? '' : form.mail_password} onChange={(e) => set('mail_password', e.target.value)} />
                            </Field>
                            <Field label="Dari (email)" hint="opsional" error={errors.mail_from_address?.[0]}>
                                <input className="input" type="email" value={form.mail_from_address} onChange={(e) => set('mail_from_address', e.target.value)} />
                            </Field>
                            <Field label="Dari (nama)" hint="opsional">
                                <input className="input" value={form.mail_from_name} onChange={(e) => set('mail_from_name', e.target.value)} />
                            </Field>
                        </div>
                        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-line pt-5">
                            <Button variant="outline" icon="send" loading={testingEmail} disabled={!meta.email_configured} onClick={testEmail}>
                                Tes Koneksi
                            </Button>
                            <Button icon="check" loading={saving} disabled={!dirty(SMTP_FIELDS)} onClick={() => save(SMTP_FIELDS)}>Simpan SMTP</Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="card w-full p-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-ink">WhatsApp</h2>
                        <p className="text-xs text-ink-muted">Pilih driver, isi konfigurasinya, lalu tes koneksi.</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setOpenWa((v) => !v)}
                            className={`badge cursor-pointer transition-colors ${
                                !meta.whatsapp_configured
                                    ? 'bg-red-500/15 text-red-600 hover:bg-red-500/25 dark:text-red-400'
                                    : form.notif_wa_enabled
                                      ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400'
                                      : 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 dark:text-amber-400'
                            }`}
                        >
                            <Icon name="chevron-down" size={12} className={`transition-transform ${openWa ? 'rotate-180' : ''}`} />
                            {!meta.whatsapp_configured ? 'Belum Dikonfigurasi' : form.notif_wa_enabled ? 'Aktif' : 'Nonaktif'}
                        </button>
                    </div>
                </div>

                {meta.whatsapp_configured && (
                    <div className="mt-4 border-b border-line pb-4">
                        <Toggle
                            checked={form.notif_wa_enabled}
                            onChange={(v) => toggleWaChannel(v)}
                            label="Aktifkan integrasi WhatsApp"
                            desc={form.notif_wa_enabled
                                ? 'Integrasi aktif — pesan WhatsApp dikirim.'
                                : 'Integrasi nonaktif. Konfigurasi tetap tersimpan.'}
                        />
                    </div>
                )}

                {openWa && (
                    <div className="mt-5">
                        <Field label="Driver" required>
                            <div className="space-y-2">
                                <select className="input" value={waDriver} onChange={(e) => setWaDriver(e.target.value)}>
                                    {(waDrivers || []).map((d) => (
                                        <option key={d.key} value={d.key}>{d.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-ink-muted">
                                    {waDrivers.find((d) => d.key === waDriver)?.description || ''}
                                </p>
                            </div>
                        </Field>

                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {waFields.map((f) => {
                                const val = waConfig[f.key] ?? '';
                                const masked = val === MASK;
                                const setVal = (v) => set('whatsapp_config', { ...form.whatsapp_config, config: { ...waConfig, [f.key]: v } });

                                if (f.type === 'select') {
                                    return (
                                        <Field key={f.key} label={f.label} required={f.required} hint={f.help}>
                                            <select className="input" value={val} onChange={(e) => setVal(e.target.value)}>
                                                {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </Field>
                                    );
                                }

                                if (f.type === 'password') {
                                    return (
                                        <Field key={f.key} label={f.label} required={f.required} hint={f.help}>
                                            <input
                                                className="input"
                                                type="password"
                                                autoComplete="new-password"
                                                placeholder={masked ? MASK : ''}
                                                value={masked ? '' : val}
                                                onChange={(e) => setVal(e.target.value)}
                                            />
                                        </Field>
                                    );
                                }

                                if (f.type === 'textarea') {
                                    return (
                                        <Field key={f.key} label={f.label} required={f.required} hint={f.help}>
                                            <textarea className="input min-h-[150px] resize-y font-mono text-xs" value={val} onChange={(e) => setVal(e.target.value)} />
                                        </Field>
                                    );
                                }

                                return (
                                    <Field key={f.key} label={f.label} required={f.required} hint={f.help}>
                                        <input className="input" type={f.type === 'url' ? 'url' : 'text'} placeholder={f.placeholder} value={val} onChange={(e) => setVal(e.target.value)} />
                                    </Field>
                                );
                            })}
                        </div>

                        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-line pt-5">
                            <Button variant="outline" icon="send" loading={testingWhatsapp} disabled={!meta.whatsapp_configured} onClick={testWhatsapp}>
                                Tes Koneksi
                            </Button>
                            <Button icon="check" loading={saving} disabled={!dirty(WA_FIELDS)} onClick={() => save(WA_FIELDS)}>Simpan WhatsApp</Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="card w-full p-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-ink">Webhook</h2>
                        <p className="text-xs text-ink-muted">Kirim notifikasi event ke URL eksternal (satu URL per baris).</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setOpenWebhook((v) => !v)}
                            className={`badge cursor-pointer transition-colors ${
                                !webhookConfigured
                                    ? 'bg-red-500/15 text-red-600 hover:bg-red-500/25 dark:text-red-400'
                                    : webhookEnabled
                                      ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400'
                                      : 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 dark:text-amber-400'
                            }`}
                        >
                            <Icon name="chevron-down" size={12} className={`transition-transform ${openWebhook ? 'rotate-180' : ''}`} />
                            {!webhookConfigured ? 'Belum Dikonfigurasi' : webhookEnabled ? 'Aktif' : 'Nonaktif'}
                        </button>
                    </div>
                </div>

                {webhookConfigured && (
                    <div className="mt-4 border-b border-line pb-4">
                        <Toggle
                            checked={webhookEnabled}
                            onChange={(v) => toggleWebhookChannel(v)}
                            label="Aktifkan integrasi webhook"
                            desc={webhookEnabled
                                ? 'Integrasi aktif — event terpilih dikirim ke URL webhook.'
                                : 'Integrasi nonaktif. Konfigurasi tetap tersimpan.'}
                        />
                    </div>
                )}

                {openWebhook && (
                    <div className="mt-5">
                        <Field label="URL Webhook" hint="Satu URL per baris. Hanya http/https ke alamat publik (IP internal diblokir demi keamanan)." error={errors.webhook_urls?.[0]}>
                            <textarea className="input min-h-[180px] font-mono text-xs" placeholder={'https://example.com/hooks/imager\nhttps://hook.site/...'} value={form.webhook_urls || ''} onChange={(e) => set('webhook_urls', e.target.value)} />
                        </Field>
                        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-line pt-5">
                            <Button variant="outline" icon="send" loading={testingWebhook} disabled={!webhookConfigured} onClick={testWebhook}>
                                Tes Koneksi
                            </Button>
                            <Button icon="check" loading={saving} disabled={!dirty(['webhook_urls'])} onClick={() => save(['webhook_urls', 'notif_webhook_enabled'])}>
                                Simpan Webhook
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="card w-full p-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-ink">Payment Gateway (TriPay)</h2>
                        <p className="text-xs text-ink-muted">Terima pembayaran otomatis via channel TriPay.</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setOpenTripay((v) => !v)}
                            className={`badge cursor-pointer transition-colors ${
                                !tripayConfigured
                                    ? 'bg-red-500/15 text-red-600 hover:bg-red-500/25 dark:text-red-400'
                                    : form.payment_gateway_enabled
                                      ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400'
                                      : 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 dark:text-amber-400'
                            }`}
                        >
                            <Icon name="chevron-down" size={12} className={`transition-transform ${openTripay ? 'rotate-180' : ''}`} />
                            {!tripayConfigured ? 'Belum Dikonfigurasi' : form.payment_gateway_enabled ? 'Aktif' : 'Nonaktif'}
                        </button>
                    </div>
                </div>

                {tripayConfigured && (
                    <div className="mt-4 border-b border-line pb-4">
                        <Toggle
                            checked={form.payment_gateway_enabled}
                            onChange={(v) => togglePaymentGateway(v)}
                            label="Aktifkan payment gateway"
                            desc={form.payment_gateway_enabled
                                ? 'Channel TriPay tampil di pop-up pembayaran klien.'
                                : 'Payment gateway disembunyikan dari pop-up pembayaran.'}
                        />
                    </div>
                )}

                {openTripay && (
                    <div className="mt-5">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Mode" required>
                                <select className="input" value={tripayCfg.mode} onChange={(e) => set('payment_tripay_config', { ...tripayCfg, mode: e.target.value })}>
                                    <option value="sandbox">Sandbox (uji coba)</option>
                                    <option value="production">Produksi</option>
                                </select>
                            </Field>
                            <Field label="Merchant Code" required>
                                <input className="input" value={tripayCfg.merchant_code} onChange={(e) => set('payment_tripay_config', { ...tripayCfg, merchant_code: e.target.value })} />
                            </Field>
                            <Field label="API Key" required>
                                <input
                                    className="input"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder={tripayCfg.api_key === MASK ? '••••••••' : ''}
                                    value={tripayCfg.api_key === MASK ? '' : tripayCfg.api_key}
                                    onChange={(e) => set('payment_tripay_config', { ...tripayCfg, api_key: e.target.value })}
                                />
                            </Field>
                            <Field label="Private Key" required>
                                <input
                                    className="input"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder={tripayCfg.private_key === MASK ? '••••••••' : ''}
                                    value={tripayCfg.private_key === MASK ? '' : tripayCfg.private_key}
                                    onChange={(e) => set('payment_tripay_config', { ...tripayCfg, private_key: e.target.value })}
                                />
                            </Field>
                        </div>

                        <p className="mt-3 rounded-lg bg-sky-500/10 px-3 py-2 text-xs text-sky-600 dark:text-sky-400">
                            Whitelist IP callback TriPay: <code>95.111.200.230</code>. Callback URL:
                            <code className="ml-1 break-all">{window.location.origin}/api/webhook/tripay</code>
                        </p>

                        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-line pt-5">
                            <Button variant="outline" icon="send" loading={testingTripay} disabled={!tripayConfigured} onClick={testGateway}>
                                Tes Koneksi
                            </Button>
                            <Button icon="check" loading={saving} disabled={!dirty(TRIPAY_FIELDS)} onClick={() => save(TRIPAY_FIELDS)}>Simpan TriPay</Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="card w-full p-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-ink">Masuk dengan Google</h2>
                        <p className="text-xs text-ink-muted">Izinkan admin masuk lewat akun Google.</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setOpenGoogle((v) => !v)}
                            className={`badge cursor-pointer transition-colors ${
                                !googleConfigured
                                    ? 'bg-red-500/15 text-red-600 hover:bg-red-500/25 dark:text-red-400'
                                    : form.google_auth_enabled
                                      ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400'
                                      : 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 dark:text-amber-400'
                            }`}
                        >
                            <Icon name="chevron-down" size={12} className={`transition-transform ${openGoogle ? 'rotate-180' : ''}`} />
                            {!googleConfigured ? 'Belum Dikonfigurasi' : form.google_auth_enabled ? 'Aktif' : 'Nonaktif'}
                        </button>
                    </div>
                </div>

                {googleConfigured && (
                    <div className="mt-4 border-b border-line pb-4">
                        <Toggle
                            checked={form.google_auth_enabled}
                            onChange={(v) => toggleGoogleAuth(v)}
                            label="Aktifkan tombol 'Masuk dengan Google'"
                            desc={form.google_auth_enabled
                                ? 'Tombol login Google tersedia di halaman masuk.'
                                : 'Tombol login Google disembunyikan.'}
                        />
                    </div>
                )}

                {openGoogle && (
                    <div className="mt-5">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Client ID" hint="opsional" error={errors.google_client_id?.[0]}>
                                <input className="input" autoComplete="off" value={form.google_client_id} onChange={(e) => set('google_client_id', e.target.value)} placeholder="xxxxxxxx.apps.googleusercontent.com" />
                            </Field>
                            <Field label="Client Secret" hint="opsional" error={errors.google_client_secret?.[0]}>
                                <input className="input" type="password" autoComplete="new-password" placeholder={form.google_client_secret === MASK ? '••••••••' : ''} value={form.google_client_secret === MASK ? '' : form.google_client_secret} onChange={(e) => set('google_client_secret', e.target.value)} />
                            </Field>
                            <div className="sm:col-span-2">
                                <Field label="URL Redirect (Callback)" hint="opsional" error={errors.google_redirect_url?.[0]}>
                                    <input className="input" value={form.google_redirect_url} onChange={(e) => set('google_redirect_url', e.target.value)} placeholder="https://imagery.my.id/auth/google/callback" />
                                </Field>
                                <p className="mt-1 text-xs text-ink-muted">
                                    Kosongkan untuk memakai otomatis: <code className="font-mono">{meta.google_redirect_url || '-'}</code>
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-line pt-5">
                            <Button icon="check" loading={saving} disabled={!dirty(GOOGLE_FIELDS)} onClick={() => save(GOOGLE_FIELDS)}>Simpan Login Google</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
        </>
    );
}