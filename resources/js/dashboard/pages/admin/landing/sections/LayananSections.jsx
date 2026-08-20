import RichEditor from '../../../../components/RichEditor';
import SearchableMultiSelect from '../../../../components/SearchableMultiSelect';
import { Field } from '../../../../components/ui';

const isEmptyRich = (html) => !html || !String(html).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();

export default function LayananSections({ form, options, updateSection, updateSectionMode }) {
    const populer = form.sections?.layanan_populer || {};
    const satuan = form.sections?.layanan_satuan || {};
    const premium = form.sections?.layanan_premium || {};
    const ultimate = form.sections?.layanan_ultimate || {};
    const catatan = form.sections?.layanan_catatan || {};
    const faqSec = form.sections?.layanan_faq || {};
    const cta = form.sections?.layanan_cta || {};

    const allPackages = options?.packages || [];
    const bundlingPackages = allPackages.filter((p) => p.type === 'bundling');
    const comboPackages = allPackages.filter((p) => p.type === 'combo');
    const allServices = options?.services || [];

    const pkgLabel = (p) => `${p.name}${p.is_featured ? ' ⭐' : ''}`;
    const svcLabel = (s) => `${s.event} · ${s.media}${s.duration ? ' · ' + s.duration : ''}`;

    const faqCats = (options?.categories || []).filter((c) =>
        (options?.faqs || []).some((f) => (f.categories || []).some((fc) => fc.id === c.id))
    );

    const showPopular = populer.use_popular !== false;
    const showFeatured = populer.use_featured !== false;

    const setPopulerMode = (mode) => {
        updateSection('layanan_populer', 'use_popular', mode !== 'featured');
        updateSection('layanan_populer', 'use_featured', mode !== 'popular');
    };

    return (
        <>
            <div className="card p-5 space-y-6">
                <div className="border-b border-line pb-3">
                    <h3 className="font-bold text-xl text-ink">Section Paket Populer / Unggulan</h3>
                    <p className="mt-1 text-sm text-ink-muted">Pilih tampilkan paket populer, unggulan, atau keduanya sekaligus.</p>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field label="Judul Kecil">
                        <input className="input" value={populer.subtitle || ''} onChange={(e) => updateSection('layanan_populer', 'subtitle', e.target.value)} />
                    </Field>
                    <Field label="Judul">
                        <input className="input" value={populer.title || ''} onChange={(e) => updateSection('layanan_populer', 'title', e.target.value)} />
                    </Field>
                </div>
                <div className="space-y-4">
                    <Field label="Mode Tampilan">
                        <select className="input" value={showPopular && showFeatured ? 'both' : showPopular ? 'popular' : 'featured'} onChange={(e) => setPopulerMode(e.target.value)}>
                            <option value="popular">Populer saja</option>
                            <option value="featured">Unggulan saja</option>
                            <option value="both">Populer + Unggulan</option>
                        </select>
                    </Field>
                    <div className={`grid grid-cols-1 gap-4 ${showPopular && showFeatured ? 'sm:grid-cols-2' : ''}`}>
                        {showPopular && (
                            <Field label="Jumlah Paket Populer Tampil">
                                <select className="input" value={populer.popular_limit || 3} onChange={(e) => updateSection('layanan_populer', 'popular_limit', e.target.value)}>
                                    {[3, 6].map((n) => (
                                        <option key={n} value={n}>{n} Paket</option>
                                    ))}
                                </select>
                            </Field>
                        )}
                        {showFeatured && (
                            <Field label="Jumlah Paket Unggulan Tampil">
                                <select className="input" value={populer.featured_limit || 3} onChange={(e) => updateSection('layanan_populer', 'featured_limit', e.target.value)}>
                                    {[3, 6].map((n) => (
                                        <option key={n} value={n}>{n} Paket</option>
                                    ))}
                                </select>
                            </Field>
                        )}
                    </div>
                </div>
            </div>

            <div className="card p-5 space-y-6">
                <div className="border-b border-line pb-3">
                    <h3 className="font-bold text-xl text-ink">Section Paket Satuan</h3>
                    <p className="mt-1 text-sm text-ink-muted">Pilih mode: tampilkan semua layanan satuan, atau pilih paket tertentu.</p>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field label="Judul Kecil">
                        <input className="input" value={satuan.subtitle || ''} onChange={(e) => updateSection('layanan_satuan', 'subtitle', e.target.value)} />
                    </Field>
                    <Field label="Judul">
                        <input className="input" value={satuan.title || ''} onChange={(e) => updateSection('layanan_satuan', 'title', e.target.value)} />
                    </Field>
                </div>
                <Field label="Mode Tampilan">
                    <select className="input" value={satuan.mode || 'all'} onChange={(e) => updateSectionMode('layanan_satuan', e.target.value)}>
                        <option value="all">Tampilkan semua</option>
                        <option value="ids">Pilih paket</option>
                    </select>
                </Field>
                {(satuan.mode || 'all') === 'ids' && (
                    <Field label="Pilih Layanan">
                        <SearchableMultiSelect
                            options={allServices.map((s) => ({ label: svcLabel(s), value: s.id }))}
                            value={satuan.items || []}
                            onChange={(val) => updateSection('layanan_satuan', 'items', val)}
                            placeholder="Pilih layanan..."
                            searchPlaceholder="Cari layanan..."
                            emptyMessage="Tidak ada layanan satuan."
                        />
                    </Field>
                )}
            </div>

            <div className="card p-5 space-y-6">
                <div className="border-b border-line pb-3">
                    <h3 className="font-bold text-xl text-ink">Section Paket Premium (Bundling)</h3>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field label="Judul Kecil">
                        <input className="input" value={premium.subtitle || ''} onChange={(e) => updateSection('layanan_premium', 'subtitle', e.target.value)} />
                    </Field>
                    <Field label="Judul">
                        <input className="input" value={premium.title || ''} onChange={(e) => updateSection('layanan_premium', 'title', e.target.value)} />
                    </Field>
                </div>
                <Field label="Mode Tampilan">
                    <select className="input" value={premium.mode || 'all'} onChange={(e) => updateSectionMode('layanan_premium', e.target.value)}>
                        <option value="all">Tampilkan semua</option>
                        <option value="ids">Pilih paket</option>
                    </select>
                </Field>
                {(premium.mode || 'all') === 'ids' && (
                    <Field label="Pilih Paket Premium">
                        <SearchableMultiSelect
                            options={bundlingPackages.map((p) => ({ label: pkgLabel(p), value: p.id }))}
                            value={premium.items || []}
                            onChange={(val) => updateSection('layanan_premium', 'items', val)}
                            placeholder="Pilih paket..."
                            searchPlaceholder="Cari paket..."
                            emptyMessage="Belum ada paket bundling."
                        />
                    </Field>
                )}
            </div>

            <div className="card p-5 space-y-6">
                <div className="border-b border-line pb-3">
                    <h3 className="font-bold text-xl text-ink">Section Paket Ultimate (Combo Foto + Video)</h3>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field label="Judul Kecil">
                        <input className="input" value={ultimate.subtitle || ''} onChange={(e) => updateSection('layanan_ultimate', 'subtitle', e.target.value)} />
                    </Field>
                    <Field label="Judul">
                        <input className="input" value={ultimate.title || ''} onChange={(e) => updateSection('layanan_ultimate', 'title', e.target.value)} />
                    </Field>
                </div>
                <Field label="Pilih Paket Ultimate">
                    <SearchableMultiSelect
                        options={comboPackages.map((p) => ({ label: pkgLabel(p), value: p.id }))}
                        value={ultimate.items || []}
                        onChange={(val) => updateSection('layanan_ultimate', 'items', val)}
                        placeholder="Pilih paket..."
                        searchPlaceholder="Cari paket..."
                        emptyMessage="Belum ada paket combo."
                    />
                </Field>
            </div>

            <div className="card p-5 space-y-6">
                <div className="border-b border-line pb-3">
                    <h3 className="font-bold text-xl text-ink">Section Judul & Catatan</h3>
                    <p className="mt-1 text-sm text-ink-muted">Catatan penting / ketentuan di bawah daftar harga.</p>
                </div>
                <Field label="Judul">
                    <input className="input" value={catatan.title || ''} onChange={(e) => updateSection('layanan_catatan', 'title', e.target.value)} />
                </Field>
                <Field label="Catatan" hint="Rich text; kosong untuk menyembunyikan section">
                    <RichEditor variant="mini" value={catatan.content || ''} onChange={(val) => updateSection('layanan_catatan', 'content', isEmptyRich(val) ? '' : val)} minHeight={120} maxHeight={220} />
                </Field>
            </div>

            <div className="card p-5 space-y-6">
                <div className="border-b border-line pb-3">
                    <h3 className="font-bold text-xl text-ink">Section Tanya Jawab (FAQ)</h3>
                    <p className="mt-1 text-sm text-ink-muted">Pakai daftar FAQ yang sudah ada. Kosong = section disembunyikan.</p>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field label="Judul Kecil">
                        <input className="input" value={faqSec.subtitle || ''} onChange={(e) => updateSection('layanan_faq', 'subtitle', e.target.value)} />
                    </Field>
                    <Field label="Judul">
                        <input className="input" value={faqSec.title || ''} onChange={(e) => updateSection('layanan_faq', 'title', e.target.value)} />
                    </Field>
                </div>
                <Field label="Mode Tampilan">
                    <select className="input" value={faqSec.mode || 'all'} onChange={(e) => updateSectionMode('layanan_faq', e.target.value)}>
                        <option value="all">Semua FAQ</option>
                        <option value="ids">Hanya FAQ yang dipilih</option>
                        <option value="category">Berdasarkan kategori</option>
                    </select>
                </Field>
                {faqSec.mode === 'ids' && (
                    <Field label="Pilih FAQ">
                        <SearchableMultiSelect
                            options={(options?.faqs || []).map((f) => ({ label: f.question, value: f.id }))}
                            value={faqSec.items || []}
                            onChange={(val) => updateSection('layanan_faq', 'items', val)}
                            placeholder="Pilih FAQ..."
                            searchPlaceholder="Cari FAQ..."
                            emptyMessage="Tidak ada FAQ."
                        />
                    </Field>
                )}
                {faqSec.mode === 'category' && (
                    <Field label="Pilih Kategori">
                        <SearchableMultiSelect
                            options={faqCats.map((c) => ({ label: c.name, value: c.id }))}
                            value={faqSec.categories || []}
                            onChange={(val) => updateSection('layanan_faq', 'categories', val)}
                            placeholder="Pilih kategori..."
                            searchPlaceholder="Cari kategori..."
                            emptyMessage="Tidak ada kategori dengan FAQ."
                        />
                    </Field>
                )}
            </div>

            <div className="card p-5 space-y-6">
                <div className="border-b border-line pb-3">
                    <h3 className="font-bold text-xl text-ink">Section CTA</h3>
                </div>
                <Field label="Judul">
                    <input className="input" value={cta.title || ''} onChange={(e) => updateSection('layanan_cta', 'title', e.target.value)} />
                </Field>
                <Field label="Deskripsi">
                    <textarea className="input min-h-[70px]" value={cta.description || ''} onChange={(e) => updateSection('layanan_cta', 'description', e.target.value)} />
                </Field>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field label="Teks Tombol">
                        <input className="input" value={cta.button_text || ''} onChange={(e) => updateSection('layanan_cta', 'button_text', e.target.value)} />
                    </Field>
                    <Field label="Link Tombol">
                        <input className="input" value={cta.button_link || ''} onChange={(e) => updateSection('layanan_cta', 'button_link', e.target.value)} placeholder="https://wa.me/..." />
                    </Field>
                </div>
            </div>
        </>
    );
}