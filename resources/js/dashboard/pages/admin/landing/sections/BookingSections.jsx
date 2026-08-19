import { Field } from '../../../../components/ui';
import SearchableMultiSelect from '../../../../components/SearchableMultiSelect';

const isEmptyStr = (s) => typeof s === 'string' && !s.trim();

export default function BookingSections({ form, options, updateSection }) {
    const b = form.sections?.booking_sidebar || {};
    const steps = Array.isArray(b.cara_steps) ? b.cara_steps : [];
    const faqMode = b.cara_faq_mode || 'all';
    const faqCats = (options?.categories || []).filter((c) =>
        (options?.faqs || []).some((f) => (f.categories || []).some((fc) => fc.id === c.id))
    );

    const setStep = (i, val) => {
        const next = [...steps];
        while (next.length <= i) next.push('');
        next[i] = val;
        updateSection('booking_sidebar', 'cara_steps', next);
    };

    const addStep = () => updateSection('booking_sidebar', 'cara_steps', [...steps, '']);
    const removeStep = (i) => updateSection('booking_sidebar', 'cara_steps', steps.filter((_, idx) => idx !== i));

    const setField = (field, val) => updateSection('booking_sidebar', field, val);
    const setMode = (mode) => updateSection('booking_sidebar', 'cara_faq_mode', mode);

    const Toggle = ({ label, field }) => (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input type="checkbox" className="h-4 w-4 rounded border-line text-brand-600" checked={b[field] !== false} onChange={(e) => setField(field, e.target.checked)} />
            {label}
        </label>
    );

    return (
        <>
            <div className="card p-5 space-y-6">
                <div className="border-b border-line pb-3">
                    <h3 className="font-bold text-xl text-ink">Sidebar Kontak</h3>
                    <p className="mt-1 text-sm text-ink-muted">Card di kolom kanan. Nomor WhatsApp, email, dan alamat diambil dari Pengaturan Kontak.</p>
                </div>
                <Toggle label="Tampilkan card kontak" field="show_kontak" />
                <Field label="Judul Card" hint="Kosongkan untuk memakai 'Kontak Kami'">
                    <input className="input" value={isEmptyStr(b.kontak_title) ? '' : (b.kontak_title || '')} onChange={(e) => updateSection('booking_sidebar', 'kontak_title', e.target.value)} />
                </Field>
            </div>

            <div className="card p-5 space-y-6">
                <div className="border-b border-line pb-3">
                    <h3 className="font-bold text-xl text-ink">Sidebar Paket Populer</h3>
                    <p className="mt-1 text-sm text-ink-muted">Card di kolom kanan. Menampilkan paket unggulan (⭐) yang paling laris, otomatis.</p>
                </div>
                <Toggle label="Tampilkan card paket populer" field="show_populer" />
                <Field label="Judul Card" hint="Kosongkan untuk memakai 'Paket Populer'">
                    <input className="input" value={isEmptyStr(b.populer_title) ? '' : (b.populer_title || '')} onChange={(e) => updateSection('booking_sidebar', 'populer_title', e.target.value)} />
                </Field>
            </div>

            <div className="card p-5 space-y-6">
                <div className="border-b border-line pb-3">
                    <h3 className="font-bold text-xl text-ink">Section Cara Booking</h3>
                    <p className="mt-1 text-sm text-ink-muted">Timeline langkah di bawah form.</p>
                </div>
                <Toggle label="Tampilkan section cara booking" field="show_cara" />
                <Field label="Judul Section" hint="Kosongkan untuk memakai 'Cara Booking'">
                    <input className="input" value={isEmptyStr(b.cara_title) ? '' : (b.cara_title || '')} onChange={(e) => updateSection('booking_sidebar', 'cara_title', e.target.value)} />
                </Field>
                {steps.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600/15 text-xs font-bold text-brand-600 dark:text-brand-400">{i + 1}</span>
                        <input
                            className="input flex-1"
                            value={s}
                            onChange={(e) => setStep(i, e.target.value)}
                            placeholder={`Langkah ${i + 1}`}
                        />
                        <button type="button" className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-500/10" onClick={() => removeStep(i)} aria-label="Hapus langkah">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                    </div>
                ))}
                <button type="button" className="btn-outline w-full text-sm" onClick={addStep}>
                    + Tambah Langkah
                </button>
            </div>

            <div className="card p-5 space-y-6">
                <div className="border-b border-line pb-3">
                    <h3 className="font-bold text-xl text-ink">Section FAQ</h3>
                    <p className="mt-1 text-sm text-ink-muted">Section tanya jawab di bawah Cara Booking.</p>
                </div>
                <Field label="Judul Section" hint="Kosongkan untuk memakai 'Pertanyaan Umum'">
                    <input className="input" value={isEmptyStr(b.cara_faq_title) ? '' : (b.cara_faq_title || '')} onChange={(e) => updateSection('booking_sidebar', 'cara_faq_title', e.target.value)} />
                </Field>
                <Field label="Mode Tampilan">
                    <select className="input" value={faqMode} onChange={(e) => setMode(e.target.value)}>
                        <option value="all">Semua FAQ</option>
                        <option value="ids">Hanya FAQ yang dipilih</option>
                        <option value="category">Berdasarkan kategori</option>
                    </select>
                </Field>
                {faqMode === 'ids' && (
                    <Field label="Pilih FAQ">
                        <SearchableMultiSelect
                            options={(options?.faqs || []).map((f) => ({ label: f.question, value: f.id }))}
                            value={b.cara_faq_items || []}
                            onChange={(val) => updateSection('booking_sidebar', 'cara_faq_items', val)}
                            placeholder="Pilih FAQ..."
                            searchPlaceholder="Cari FAQ..."
                            emptyMessage="Tidak ada FAQ."
                        />
                    </Field>
                )}
                {faqMode === 'category' && (
                    <Field label="Pilih Kategori">
                        <SearchableMultiSelect
                            options={faqCats.map((c) => ({ label: c.name, value: c.id }))}
                            value={b.cara_faq_categories || []}
                            onChange={(val) => updateSection('booking_sidebar', 'cara_faq_categories', val)}
                            placeholder="Pilih kategori..."
                            searchPlaceholder="Cari kategori..."
                            emptyMessage="Tidak ada kategori dengan FAQ."
                        />
                    </Field>
                )}
            </div>
        </>
    );
}