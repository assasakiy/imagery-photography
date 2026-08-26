import Icon from '../../../components/Icon';
import Button from '../../../components/Button';
import RichEditor from '../../../components/RichEditor';
import { Field } from '../../../components/ui';
import { BRAND_PALETTES, BUSINESS_TIMEZONES, TAB_FIELDS, accessibleBackground, contrastText } from './constants';

export default function BrandingTab({ form, meta, errors, saving, set, save, dirty, mediaFor, setMediaFor, previewUrls, setPreviewUrls, dirtyColor }) {
    return (
        <div className="space-y-6">
            <div className="card w-full p-6">
                <div className="mb-5">
                    <h2 className="font-semibold text-ink">Branding</h2>
                    <p className="text-xs text-ink-muted">Nama situs, tagline, deskripsi, logo, dan favicon — tampil di seluruh website.</p>
                </div>
                <div className="space-y-5">
                    <Field label="Nama Situs" required error={errors.site_name?.[0]}>
                        <input className="input" value={form.site_name} onChange={(e) => set('site_name', e.target.value)} placeholder="Sopian Lalu Imagery" />
                    </Field>
                    <Field label="Tagline" hint="tampil di bawah nama situs" error={errors.site_tagline?.[0]}>
                        <input className="input" value={form.site_tagline} onChange={(e) => set('site_tagline', e.target.value)} placeholder="Abadi Setiap Momen" />
                    </Field>
                    <Field label="Deskripsi Situs" hint="tampil di footer & ringkasan SEO" error={errors.site_description?.[0]}>
                        <RichEditor variant="mini" value={form.site_description} onChange={(v) => set('site_description', v)} minHeight={120} maxHeight={200} placeholder="Deskripsi singkat situs…" />
                    </Field>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <Field label="Logo" hint="gambar persegi/transparan">
                            <div className="flex items-center gap-3">
                                {form.site_logo ? (
                                    <img src={previewUrls.site_logo || meta.site_logo_url} alt="Logo" className="h-16 w-16 rounded-xl border border-line bg-surface-muted object-cover" />
                                ) : (
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-line bg-surface-muted text-ink-muted">
                                        <Icon name="image" size={24} />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Button size="sm" variant="outline" icon="image" onClick={() => setMediaFor('site_logo')}>Pilih Logo</Button>
                                    {form.site_logo && (
                                        <Button size="xs" variant="ghost" icon="trash" onClick={() => { set('site_logo', ''); setPreviewUrls(p => ({ ...p, site_logo: null })); }}>Hapus</Button>
                                    )}
                                </div>
                            </div>
                        </Field>
                        <Field label="Favicon" hint="ikon kecil di tab browser">
                            <div className="flex items-center gap-3">
                                {form.site_favicon ? (
                                    <img src={previewUrls.site_favicon || meta.site_favicon_url} alt="Favicon" className="h-16 w-16 rounded-xl border border-line bg-surface-muted object-cover" />
                                ) : (
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-line bg-surface-muted text-ink-muted">
                                        <Icon name="image" size={24} />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Button size="sm" variant="outline" icon="image" onClick={() => setMediaFor('site_favicon')}>Pilih Favicon</Button>
                                    {form.site_favicon && (
                                        <Button size="xs" variant="ghost" icon="trash" onClick={() => { set('site_favicon', ''); setPreviewUrls(p => ({ ...p, site_favicon: null })); }}>Hapus</Button>
                                    )}
                                </div>
                            </div>
                        </Field>
                    </div>
                </div>
                <div className="mt-6 flex justify-end border-t border-line pt-5">
                    <Button icon="check" loading={saving} disabled={!dirty(TAB_FIELDS.branding)} onClick={() => save(TAB_FIELDS.branding)}>Simpan Branding</Button>
                </div>
            </div>

            <div className="card w-full p-6">
                <div className="mb-5">
                    <h2 className="font-semibold text-ink">Palet Brand</h2>
                    <p className="text-xs text-ink-muted">Pilih template siap pakai atau atur tiga warna sendiri.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {BRAND_PALETTES.map((palette) => (
                        <PaletteOption key={palette.key} palette={palette} form={form} set={set} />
                    ))}
                    <button
                        type="button"
                        onClick={() => set('brand_palette_template', 'custom')}
                        className={`rounded-xl border p-4 text-left transition-colors ${form.brand_palette_template === 'custom' ? 'border-brand-500 bg-brand-500/5' : 'border-line hover:bg-surface-muted'}`}
                    >
                        <div className="mb-3 flex h-7 items-center gap-1">
                            <span className="h-7 w-7 rounded-full border border-line bg-[conic-gradient(#e11d48,#d97706,#059669,#0284c7,#e11d48)]" />
                        </div>
                        <p className="text-sm font-semibold text-ink">Custom</p>
                        <p className="mt-1 text-xs text-ink-muted">Pilih warna sendiri</p>
                    </button>
                </div>

                {form.brand_palette_template === 'custom' && (
                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                        <ColorPicker label="Primary" hint="Tombol & navigasi aktif" field="brand_primary_color" form={form} set={set} error={errors.brand_primary_color?.[0]} />
                        <ColorPicker label="Secondary" hint="Background CTA & section" field="brand_secondary_color" form={form} set={set} error={errors.brand_secondary_color?.[0]} />
                        <ColorPicker label="Accent" hint="Ikon, label & highlight" field="brand_accent_color" form={form} set={set} error={errors.brand_accent_color?.[0]} />
                    </div>
                )}

                <div className="mt-5 overflow-hidden rounded-xl border border-line">
                    <div className="p-5" style={{ backgroundColor: form.brand_secondary_color, color: contrastText(form.brand_secondary_color) }}>
                        <p className="text-lg font-bold">Pratinjau CTA</p>
                        <p className="mt-1 text-sm opacity-75">Primary, secondary, dan accent bekerja sesuai perannya.</p>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <span className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: accessibleBackground(form.brand_primary_color) }}>Primary</span>
                            <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: accessibleBackground(form.brand_secondary_color) }}>Secondary</span>
                            <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: accessibleBackground(form.brand_accent_color) }}>Accent</span>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end border-t border-line pt-5">
                    <Button icon="check" loading={saving} disabled={!dirtyColor} onClick={() => save(['brand_palette_template', 'brand_primary_color', 'brand_secondary_color', 'brand_accent_color'])}>Simpan Palet</Button>
                </div>
            </div>

            <RegionalSettings form={form} errors={errors} saving={saving} set={set} save={save} dirty={dirty} />
        </div>
    );
}

function PaletteOption({ palette, form, set }) {
    const active = form.brand_palette_template === palette.key;
    const select = () => {
        set('brand_palette_template', palette.key);
        set('brand_primary_color', palette.primary);
        set('brand_secondary_color', palette.secondary);
        set('brand_accent_color', palette.accent);
    };

    return (
        <button type="button" onClick={select} className={`rounded-xl border p-4 text-left transition-colors ${active ? 'border-brand-500 bg-brand-500/5' : 'border-line hover:bg-surface-muted'}`}>
            <div className="mb-3 flex -space-x-1">
                {[palette.primary, palette.secondary, palette.accent].map((color) => (
                    <span key={color} className="h-7 w-7 rounded-full border-2 border-surface" style={{ backgroundColor: color }} />
                ))}
            </div>
            <p className="text-sm font-semibold text-ink">{palette.label}</p>
            <p className="mt-1 text-xs text-ink-muted">{palette.description}</p>
        </button>
    );
}

function ColorPicker({ label, hint, field, form, set, error }) {
    return (
        <Field label={label} hint={hint} error={error}>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 hover:bg-surface-muted">
                <span className="h-8 w-8 shrink-0 rounded-lg border border-line" style={{ backgroundColor: form[field] }} />
                <span className="min-w-0 flex-1 truncate font-mono text-sm text-ink">{form[field]}</span>
                <input type="color" className="h-0 w-0 opacity-0" value={form[field]} onChange={(e) => set(field, e.target.value)} />
                <Icon name="edit-3" size={15} className="text-ink-muted" />
            </label>
        </Field>
    );
}

function RegionalSettings({ form, errors, saving, set, save, dirty }) {
    return (
        <div className="card w-full p-6">
            <div className="mb-5">
                <h2 className="font-semibold text-ink">Regional</h2>
                <p className="text-xs text-ink-muted">Timezone bisnis global — jam acara diinput dan ditampilkan sesuai zona ini.</p>
            </div>
            <Field label="Timezone Bisnis" hint="jadwal acara & semua tampilan waktu disesuaikan ke zona ini" error={errors.timezone?.[0]}>
                <select className="input" value={form.timezone || ''} onChange={(e) => set('timezone', e.target.value)}>
                    {BUSINESS_TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                </select>
            </Field>
            <div className="mt-6 flex justify-end border-t border-line pt-5">
                <Button icon="check" loading={saving} disabled={!dirty(['timezone'])} onClick={() => save(['timezone'])}>Simpan Timezone</Button>
            </div>
        </div>
    );
}