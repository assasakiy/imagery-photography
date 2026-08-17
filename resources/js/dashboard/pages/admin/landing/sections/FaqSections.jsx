import SearchableMultiSelect from '../../../../components/SearchableMultiSelect';
import { Field } from '../../../../components/ui';

export default function FaqSections({ form, options, updateSection, updateSectionMode }) {
    const faqSec = form.sections.faq || {};

    return (
        <div className="card p-5 space-y-6">
            <div className="border-b border-line pb-3">
                <h3 className="font-bold text-xl text-ink">Pengaturan Daftar FAQ</h3>
                <p className="mt-1 text-sm text-ink-muted">Atur FAQ yang tampil di halaman ini (mode "ids" tanpa pilihan = daftar kosong).</p>
            </div>
            <Field label="Mode Tampilan">
                <select className="input" value={faqSec.mode || 'all'} onChange={(e) => updateSectionMode('faq', e.target.value)}>
                    <option value="all">Tampilkan semua FAQ</option>
                    <option value="ids">Hanya FAQ yang dipilih</option>
                    <option value="category">Berdasarkan kategori</option>
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
    );
}