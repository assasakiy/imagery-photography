import RichEditor from '../../../../components/RichEditor';
import { Field } from '../../../../components/ui';

export default function HeroSection({ form, isHome, errors, setForm, renderImageUploader }) {
    return (
        <div className="card p-5 space-y-6">
            <div>
                <h3 className="font-bold text-xl text-ink border-b border-line pb-3">Section Hero / Title</h3>
                <p className="mt-2 text-sm text-ink-muted">Teks kecil (badge) di atas judul halaman. SEO di-generate otomatis dari judul & deskripsi di bawah ini.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field label="Judul Kecil (badge)" hint={isHome ? 'Default dari tagline situs' : 'Teks kecil di atas judul halaman'}>
                    <input className="input" value={form.badge || ''} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder={isHome ? 'Photography & Videography' : (form.title || '')} />
                </Field>
                <Field label="Judul Besar" error={errors.hero_title?.[0]}>
                    <input className="input" value={form.hero_title || ''} onChange={(e) => setForm({ ...form, hero_title: e.target.value })} placeholder={isHome ? 'Judul situs (default)' : 'Judul halaman ini'} />
                </Field>
            </div>

            <Field label={isHome ? 'Subjudul / Deskripsi' : 'Deskripsi'} error={errors.description?.[0]}>
                <RichEditor variant="mini" value={isHome ? (form.hero_subtitle || '') : (form.description || '')} onChange={(val) => setForm(isHome ? { ...form, hero_subtitle: val } : { ...form, description: val })} minHeight={100} maxHeight={200} />
            </Field>

            {isHome && (
                <>
                    <div className="rounded-xl border border-line bg-surface-muted/50 p-4 space-y-3">
                        <p className="text-sm font-semibold text-ink">Tombol Utama</p>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <Field label="Teks Tombol" hint="Kosongkan untuk tanpa tombol">
                                <input className="input" value={form.button_text || ''} onChange={(e) => setForm({ ...form, button_text: e.target.value })} placeholder="Lihat Galeri" />
                            </Field>
                            <Field label="Link Tombol">
                                <input className="input" value={form.button_link || ''} onChange={(e) => setForm({ ...form, button_link: e.target.value })} placeholder="/gallery" />
                            </Field>
                        </div>
                    </div>

                    <div className="rounded-xl border border-line bg-surface-muted/50 p-4 space-y-3">
                        <p className="text-sm font-semibold text-ink">Tombol Kedua</p>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <Field label="Teks Tombol" hint="Kosongkan untuk tanpa tombol">
                                <input className="input" value={form.button2_text || ''} onChange={(e) => setForm({ ...form, button2_text: e.target.value })} placeholder="Lihat Layanan" />
                            </Field>
                            <Field label="Link Tombol">
                                <input className="input" value={form.button2_link || ''} onChange={(e) => setForm({ ...form, button2_link: e.target.value })} placeholder="/services" />
                            </Field>
                        </div>
                    </div>
                </>
            )}

            {isHome && (
                <Field label="Gambar Latar / BG Hero">
                    {renderImageUploader('hero_image', 'Gambar Hero')}
                </Field>
            )}
        </div>
    );
}