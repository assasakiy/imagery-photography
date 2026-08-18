import { useState } from 'react';
import Icon from '../../../../components/Icon';
import { Field } from '../../../../components/ui';
import SocialSelect from './SocialSelect';
import { SocialLogo } from './socialPlatforms';

export default function KontakSections({ form, setForm }) {
    const c = form.contact || {};
    const [showEmbed, setShowEmbed] = useState(false);

    const set = (field, val) => setForm({ ...form, contact: { ...c, [field]: val } });
    const setSocials = (socials) => setForm({ ...form, contact: { ...c, socials } });
    const socials = Array.isArray(c.socials) ? c.socials : [];

    const updateSocial = (i, patch) => {
        const next = socials.slice();
        next[i] = { ...next[i], ...patch };
        setSocials(next);
    };

    const embedPreview = () => {
        const url = (c.map_url || '').trim();
        if (!url) return null;
        const m = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
        if (m) return `https://www.google.com/maps?q=${m[1]},${m[2]}&output=embed`;
        return `https://www.google.com/maps?q=${encodeURIComponent(url)}&output=embed`;
    };

    const embed = showEmbed ? embedPreview() : null;

    return (
        <div className="card p-5 space-y-6">
            <div className="border-b border-line pb-3">
                <h3 className="font-bold text-xl text-ink">Informasi Kontak</h3>
                <p className="mt-1 text-sm text-ink-muted">Telepon, email, alamat, sosial media, dan peta yang ditampilkan di halaman Kontak.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field label="Telepon / WhatsApp">
                    <input className="input" value={c.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder="08xxxxxxxxxx" />
                </Field>
                <Field label="Email">
                    <input className="input" type="email" value={c.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="email@contoh.com" />
                </Field>
            </div>
            <Field label="Alamat / Studio">
                <textarea className="input min-h-[70px]" value={c.address || ''} onChange={(e) => set('address', e.target.value)} placeholder="Alamat studio, contoh: Jl. ..." />
            </Field>

            <div className="border-t border-line pt-6">
                <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">Sosial Media</p>
                    <button type="button" className="btn-outline text-xs py-1.5 px-3" onClick={() => setSocials([...socials, { type: 'instagram', url: '' }])}>
                        <Icon name="plus" size={14} /> Tambah
                    </button>
                </div>
                {socials.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-line p-4 text-center text-sm text-ink-muted">
                        Kosong = pakai sosmed dari Pengaturan Branding.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {socials.map((row, i) => (
                            <div key={i} className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[200px_1fr_auto]">
                                <SocialSelect value={row.type || ''} onChange={(type) => updateSocial(i, { type })} />
                                <input className="input" placeholder="https://..." value={row.url || ''} onChange={(e) => updateSocial(i, { url: e.target.value })} />
                                <button type="button" className="btn-outline text-red-500 !px-2.5 !py-2" onClick={() => setSocials(socials.filter((_, x) => x !== i))} title="Hapus">
                                    <Icon name="trash" size={15} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {socials.length > 0 && socials.some((r) => r.url) && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {socials.filter((r) => r.url).map((r, i) => (
                            <span key={i} className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-ink-muted">
                                <SocialLogo type={r.type} size={14} className="text-ink" /> {r.type}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="border-t border-line pt-6">
                <Field
                    label="Peta (URL Google Maps)"
                    hint="Tempel URL dari tombol 'Bagikan' Google Maps atau alamat langsung. Embed dibuat otomatis, tak perlu cari kode embed."
                >
                    <input className="input" value={c.map_url || ''} onChange={(e) => { set('map_url', e.target.value); setShowEmbed(false); }} placeholder="https://maps.google.com/?q=... atau @lat,lng" />
                </Field>
                {(c.map_url || '').trim() ? (
                    <div className="mt-3">
                        <button type="button" className="btn-outline text-xs py-1.5 px-3" onClick={() => setShowEmbed((v) => !v)}>
                            <Icon name="map-pin" size={14} /> {embed ? 'Sembunyikan Pratinjau' : 'Pratinjau Peta'}
                        </button>
                    </div>
                ) : null}
                {embed && (
                    <div className="mt-4 overflow-hidden rounded-xl border border-line">
                        <iframe src={embed} className="h-64 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Pratinjau Peta" />
                    </div>
                )}
            </div>
        </div>
    );
}