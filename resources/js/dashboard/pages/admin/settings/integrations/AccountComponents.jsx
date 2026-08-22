import { useState, useRef } from 'react';
import jsQR from 'jsqr';
import Icon from '../../../../components/Icon';
import Button from '../../../../components/Button';
import { Field } from '../../../../components/ui';
import { toast } from '../../../../lib/toast';
import { POPULAR_BANKS, POPULAR_WALLETS, QRIS_PROVIDERS } from '../constants';
import { validateQris } from '../../../../utils/qris';

const uid = () => Math.random().toString(36).slice(2, 10);

export function BrandTile({ code, name, short, brandColor, dark, size = 'h-8 w-8 text-[10px]' }) {
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

export function LogoSelect({ options, value, onChange, placeholder, error }) {
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
                <ul className="absolute z-20 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-xl" role="listbox">
                    {options.map((opt) => (
                        <li key={opt.code} role="option" aria-selected={value === opt.code}>
                            <button
                                type="button"
                                onClick={() => { onChange(opt.code); setOpen(false); }}
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
        onAcc({ ...acc, code, name: meta?.name || code, short: meta?.short || code, brandColor: meta?.brandColor || '#52525B', dark: meta?.dark || false });
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
        onAcc({ ...acc, code, name: meta?.name || code, short: meta?.short || code, brandColor: meta?.brandColor || '#52525B', dark: meta?.dark || false });
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

export function AccountsSection({ type, accounts, onAccs, onScanStart }) {
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

export { uid };
