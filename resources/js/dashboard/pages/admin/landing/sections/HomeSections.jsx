import RichEditor from '../../../../components/RichEditor';
import SearchableMultiSelect from '../../../../components/SearchableMultiSelect';
import { Field } from '../../../../components/ui';
import { ReviewChecklist, statLabel } from './shared';

const isEmptyRich = (html) => !html || !String(html).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();

export default function HomeSections({ form, options, updateSection, updateSectionMode, setReviewsMode, toggleReviewRating, setReviewStar, setReviewsMinStar, toggleReviewItem, renderImageUploader }) {
    const about = form.sections.about || {};
    const fb = options?.about_fallbacks || {};
    const aboutSubtitle = about.subtitle || fb.subtitle || '';
    const aboutTitle = about.title || fb.title || '';
    const aboutContent = !isEmptyRich(about.content) ? about.content : (fb.content || '');
    const reviews = form.sections.reviews || {};
    const faqSec = form.sections.faq || {};
    const statsSec = form.sections.stats || {};
    const blog = form.sections.blog || {};
    const cta = form.sections.cta || {};

    return (
        <>
            <div className="card p-5 space-y-6">
                <div className="border-b border-line pb-3">
                    <h3 className="font-bold text-xl text-ink">Section Tentang Kami</h3>
                    <p className="mt-1 text-sm text-ink-muted">Nilai otomatis diambil dari halaman Tentang. Kosongkan Subjudul/Judul/Konten untuk kembali ke nilai otomatis; pratinjau mengambil 2 kalimat pertama Konten Penuh dan di-expand via tombol Selengkapnya.</p>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field label="Subjudul">
                        <input className="input" value={aboutSubtitle} onChange={(e) => updateSection('about', 'subtitle', e.target.value)} />
                    </Field>
                    <Field label="Judul">
                        <input className="input" value={aboutTitle} onChange={(e) => updateSection('about', 'title', e.target.value)} />
                    </Field>
                </div>
                <Field label="Konten Penuh" hint="Rich text seperti deskripsi; dipakai untuk pratinjau 2 kalimat & konten yang di-expand pada halaman beranda.">
                    <RichEditor variant="mini" value={aboutContent} onChange={(val) => updateSection('about', 'content', isEmptyRich(val) ? '' : val)} minHeight={150} maxHeight={300} />
                </Field>
                <Field label="Gambar Tentang">
                    {renderImageUploader('about_image', 'Gambar Tentang')}
                </Field>
                <div className="rounded-xl border border-line bg-surface-muted/50 p-4 space-y-4">
                    <p className="text-sm font-semibold text-ink">Kartu Angka / Statistik</p>
                    <Field label="Mode Tampilan">
                        <select className="input" value={statsSec.mode || 'ids'} onChange={(e) => updateSectionMode('stats', e.target.value)}>
                            <option value="ids">Hanya yang dipilih di bawah</option>
                            <option value="all">Semua statistik</option>
                        </select>
                    </Field>
                    {statsSec.mode !== 'all' && (
                        <Field label="Pilih Statistik" hint="Kosongkan untuk menyembunyikan kartu statistik">
                            <SearchableMultiSelect
                                options={(options?.stats || []).map((s) => ({ label: statLabel(s), value: s.id }))}
                                value={statsSec.items || []}
                                onChange={(val) => updateSection('stats', 'items', val)}
                                placeholder="Pilih statistik..."
                                searchPlaceholder="Cari statistik..."
                                emptyMessage="Tidak ada statistik. Tambahkan di menu FAQ & Stats."
                            />
                        </Field>
                    )}
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field label="Teks Tombol">
                        <input className="input" value={about.button_text || ''} onChange={(e) => updateSection('about', 'button_text', e.target.value)} />
                    </Field>
                    <Field label="Link Tombol">
                        <input className="input" value={about.button_link || ''} onChange={(e) => updateSection('about', 'button_link', e.target.value)} />
                    </Field>
                </div>
            </div>

            <div className="card p-5 space-y-6">
                <div className="border-b border-line pb-3">
                    <h3 className="font-bold text-xl text-ink">Section Testimonial</h3>
                    <p className="mt-1 text-sm text-ink-muted">Atur review yang tampil. Jika tidak ada yang tampil, section disembunyikan.</p>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field label="Subjudul">
                        <input className="input" value={reviews.subtitle || ''} onChange={(e) => updateSection('reviews', 'subtitle', e.target.value)} />
                    </Field>
                    <Field label="Judul">
                        <input className="input" value={reviews.title || ''} onChange={(e) => updateSection('reviews', 'title', e.target.value)} />
                    </Field>
                </div>
                <Field label="Mode Tampilan">
                    <select className="input" value={reviews.mode || 'all'} onChange={(e) => setReviewsMode(e.target.value)}>
                        <option value="all">Pilih Semua (tampilkan semua review)</option>
                        <option value="star">Hanya Bintang 5 / 4 / 3 / 2 / 1</option>
                        <option value="above">Hanya Tampilkan di Atas Bintang X</option>
                    </select>
                </Field>

                {reviews.mode === 'all' && (
                    <Field label="Tampilkan Bintang" hint="Hapus centang bintang yang tidak ingin ditampilkan. Tanpa centang, section disembunyikan.">
                        <div className="flex flex-wrap gap-3">
                            {[5, 4, 3, 2, 1].map((rating) => (
                                <label key={rating} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface-muted/50 px-3 py-2 text-sm text-ink">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-line text-brand-600"
                                        checked={(reviews.all_ratings || [1, 2, 3, 4, 5]).includes(rating)}
                                        onChange={() => toggleReviewRating(rating)}
                                    />
                                    {rating} Bintang
                                </label>
                            ))}
                        </div>
                    </Field>
                )}

                {reviews.mode === 'star' && (
                    <>
                        <Field label="Bintang">
                            <select className="input" value={reviews.star || 5} onChange={(e) => setReviewStar(e.target.value)}>
                                {[5, 4, 3, 2, 1].map((rating) => (
                                    <option key={rating} value={rating}>Bintang {rating}</option>
                                ))}
                            </select>
                        </Field>
                        <ReviewChecklist
                            reviews={(options?.reviews || []).filter((r) => r.rating === Number(reviews.star || 5))}
                            items={reviews.items || []}
                            onToggle={toggleReviewItem}
                            emptyHint={`Belum ada review bintang ${reviews.star || 5}.`}
                        />
                    </>
                )}

                {reviews.mode === 'above' && (
                    <>
                        <Field label="Bintang Minimum">
                            <select className="input" value={reviews.min_star || 3} onChange={(e) => setReviewsMinStar(e.target.value)}>
                                {[1, 2, 3, 4, 5].map((rating) => (
                                    <option key={rating} value={rating}>&gt;= {rating} Bintang</option>
                                ))}
                            </select>
                        </Field>
                        <ReviewChecklist
                            reviews={(options?.reviews || []).filter((r) => r.rating >= Number(reviews.min_star || 3))}
                            items={reviews.items || []}
                            onToggle={toggleReviewItem}
                            emptyHint={`Belum ada review dengan minimal ${reviews.min_star || 3} bintang.`}
                        />
                    </>
                )}
            </div>

            <div className="card p-5 space-y-6">
                <div className="border-b border-line pb-3">
                    <h3 className="font-bold text-xl text-ink">Section Artikel Blog</h3>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field label="Subjudul">
                        <input className="input" value={blog.subtitle || ''} onChange={(e) => updateSection('blog', 'subtitle', e.target.value)} />
                    </Field>
                    <Field label="Judul">
                        <input className="input" value={blog.title || ''} onChange={(e) => updateSection('blog', 'title', e.target.value)} />
                    </Field>
                </div>
                <Field label="Jumlah Artikel">
                    <select className="input" value={blog.limit || 3} onChange={(e) => updateSection('blog', 'limit', e.target.value)}>
                        {[3, 6, 9].map((n) => (
                            <option key={n} value={n}>{n} Artikel</option>
                        ))}
                    </select>
                </Field>
            </div>

            <div className="card p-5 space-y-6">
                <div className="border-b border-line pb-3">
                    <h3 className="font-bold text-xl text-ink">Section FAQ (Home)</h3>
                    <p className="mt-1 text-sm text-ink-muted">FAQ yang tampil di halaman beranda; jika tidak ada yang dipilih, section disembunyikan.</p>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field label="Subjudul">
                        <input className="input" value={faqSec.subtitle || ''} onChange={(e) => updateSection('faq', 'subtitle', e.target.value)} />
                    </Field>
                    <Field label="Judul">
                        <input className="input" value={faqSec.title || ''} onChange={(e) => updateSection('faq', 'title', e.target.value)} />
                    </Field>
                </div>
                <Field label="Mode Tampilan">
                    <select className="input" value={faqSec.mode || 'ids'} onChange={(e) => updateSectionMode('faq', e.target.value)}>
                        <option value="ids">Hanya FAQ yang dipilih</option>
                        <option value="category">Berdasarkan kategori</option>
                        <option value="all">Semua FAQ</option>
                    </select>
                </Field>
                {faqSec.mode === 'ids' && (
                    <Field label="Pilih FAQ">
                        <SearchableMultiSelect
                            options={(options?.faqs || []).map((f) => ({ label: f.question, value: f.id }))}
                            value={faqSec.items || []}
                            onChange={(val) => updateSection('faq', 'items', val)}
                            placeholder="Pilih FAQ..."
                            searchPlaceholder="Cari FAQ..."
                            emptyMessage="Tidak ada FAQ. Tambahkan di menu FAQ & Stats."
                        />
                    </Field>
                )}
                {faqSec.mode === 'category' && (
                    <Field label="Pilih Kategori">
                        <SearchableMultiSelect
                            options={(options?.categories || []).map((c) => ({ label: c.name, value: c.id }))}
                            value={faqSec.categories || []}
                            onChange={(val) => updateSection('faq', 'categories', val)}
                            placeholder="Pilih kategori FAQ..."
                            searchPlaceholder="Cari kategori..."
                            emptyMessage="Tidak ada kategori."
                        />
                    </Field>
                )}
            </div>

            <div className="card p-5 space-y-6">
                <div className="border-b border-line pb-3">
                    <h3 className="font-bold text-xl text-ink">Section CTA</h3>
                </div>
                <Field label="Judul">
                    <input className="input" value={cta.title || ''} onChange={(e) => updateSection('cta', 'title', e.target.value)} />
                </Field>
                <Field label="Deskripsi">
                    <textarea className="input min-h-[80px]" value={cta.description || ''} onChange={(e) => updateSection('cta', 'description', e.target.value)} />
                </Field>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field label="Teks Tombol">
                        <input className="input" value={cta.button_text || ''} onChange={(e) => updateSection('cta', 'button_text', e.target.value)} />
                    </Field>
                    <Field label="Link Tombol">
                        <input className="input" value={cta.button_link || ''} onChange={(e) => updateSection('cta', 'button_link', e.target.value)} />
                    </Field>
                </div>
            </div>
        </>
    );
}