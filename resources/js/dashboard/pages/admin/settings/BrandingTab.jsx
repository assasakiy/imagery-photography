import Icon from '../../../components/Icon';
import Button from '../../../components/Button';
import RichEditor from '../../../components/RichEditor';
import { Field } from '../../../components/ui';
import { BRAND_PRESETS, BUSINESS_TIMEZONES, TAB_FIELDS } from './constants';

export default function BrandingTab({ form, meta, errors, saving, set, save, dirty, mediaFor, setMediaFor, dirtyColor }) {
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
                                <img src={meta.site_logo_url} alt="Logo" className="h-16 w-16 rounded-xl border border-line bg-surface-muted object-cover" />
                                <div className="space-y-2">
                                    <Button size="sm" variant="outline" icon="image" onClick={() => setMediaFor('site_logo')}>Pilih Logo</Button>
                                    {form.site_logo && (
                                        <Button size="xs" variant="ghost" icon="trash" onClick={() => set('site_logo', '')}>Hapus</Button>
                                    )}
                                </div>
                            </div>
                        </Field>
                        <Field label="Favicon" hint="ikon kecil di tab browser">
                            <div className="flex items-center gap-3">
                                <img src={meta.site_favicon_url} alt="Favicon" className="h-16 w-16 rounded-xl border border-line bg-surface-muted object-cover" />
                                <div className="space-y-2">
                                    <Button size="sm" variant="outline" icon="image" onClick={() => setMediaFor('site_favicon')}>Pilih Favicon</Button>
                                    {form.site_favicon && (
                                        <Button size="xs" variant="ghost" icon="trash" onClick={() => set('site_favicon', '')}>Hapus</Button>
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
                    <h2 className="font-semibold text-ink">Warna Brand</h2>
                    <p className="text-xs text-ink-muted">Warna utama website & dashboard.</p>
                </div>
                <Field label="Warna Brand" error={errors.brand_color?.[0]}>
                    <div className="flex flex-wrap items-center gap-3">
                        {BRAND_PRESETS.map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => set('brand_color', color)}
                                className={`h-9 w-9 rounded-full ring-2 transition-transform ${
                                    form.brand_color === color ? 'ring-ink scale-110' : 'ring-transparent hover:scale-105'
                                }`}
                                style={{ backgroundColor: color }}
                                aria-label={color}
                            />
                        ))}
                        <label className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm text-ink-muted hover:bg-surface-muted">
                            <span className="h-5 w-5 rounded-md border border-line" style={{ backgroundColor: form.brand_color }} />
                            <input
                                type="color"
                                className="h-0 w-0 opacity-0"
                                value={/^#[0-9a-f]{6}$/i.test(form.brand_color) ? form.brand_color : '#7c3aed'}
                                onChange={(e) => set('brand_color', e.target.value)}
                            />
                            <span className="font-mono">{form.brand_color}</span>
                        </label>
                    </div>
                </Field>
                <div className="mt-4 rounded-xl border border-line bg-surface-muted/50 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Pratinjau</p>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: form.brand_color }}>Tombol</span>
                        <span className="rounded-lg px-3 py-1.5 text-sm font-semibold" style={{ backgroundColor: 'color-mix(in srgb, ' + form.brand_color + ' 15%, transparent)', color: form.brand_color }}>Chip</span>
                        <span className="text-sm font-medium text-ink-muted">Teks <span style={{ color: form.brand_color }}>berwarna</span></span>
                    </div>
                </div>
                <div className="mt-6 flex justify-end border-t border-line pt-5">
                    <Button icon="check" loading={saving} disabled={!dirtyColor} onClick={() => save(['brand_color'])}>Simpan Warna</Button>
                </div>
            </div>

            <RegionalSettings form={form} errors={errors} saving={saving} set={set} save={save} dirty={dirty} />
        </div>
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