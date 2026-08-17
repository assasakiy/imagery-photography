import { Field } from '../../../../components/ui';

export default function BlogGallerySections({ form, slug, blogCounts, updateSection }) {
    const cfg = form.sections || {};
    const isB = slug === 'blog';
    const sections = isB
        ? [
            { key: 'featured', label: 'Section Artikel Unggulan', fields: ['label', 'title', 'subtitle'], count: true },
            { key: 'latest', label: 'Section Artikel Terbaru', fields: ['label', 'title', 'subtitle'], count: true },
            { key: 'popular', label: 'Section Artikel Populer', fields: ['label', 'title', 'subtitle'], count: true },
            { key: 'tags', label: 'Section Topik', fields: ['label', 'title'], count: true },
        ]
        : [
            { key: 'featured', label: 'Section Karya Unggulan', fields: ['label', 'title', 'subtitle'], count: true },
            { key: 'latest', label: 'Section Galeri Terbaru', fields: ['label', 'title'], count: true },
            { key: 'tags', label: 'Section Topik (Kategori)', fields: ['label', 'title'], count: true },
        ];

    const countOptions = (key) => {
        if (key === 'featured') return isB ? [2, 5, 7, 10] : [3, 6, 9];
        if (key === 'latest' || key === 'popular') return [3, 6, 9];
        if (key === 'tags') return [6, 12, 18];
        return [2, 4, 6, 8, 10];
    };

    const isCountDisabled = (key, option) => {
        if (key === 'tags' || !blogCounts) return false;
        const total = blogCounts[key] ?? 0;
        return total < option - 1;
    };

    const availableCount = (key, options) => {
        const valid = options.filter((o) => !isCountDisabled(key, o));
        return valid.length ? valid : options[0];
    };

    return (
        <>
            {sections.map((sec) => {
                const v = cfg[sec.key] || {};
                return (
                    <div key={sec.key} className="card p-5 space-y-6">
                        <div className="border-b border-line pb-3">
                            <h3 className="font-bold text-xl text-ink">{sec.label}</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {sec.fields.includes('label') && (
                                <Field label="Label (teks kapitalisasi atas)">
                                    <input className="input" value={v.label || ''} onChange={(e) => updateSection(sec.key, 'label', e.target.value)} />
                                </Field>
                            )}
                            {sec.fields.includes('title') && (
                                <Field label="Judul Section">
                                    <input className="input" value={v.title || ''} onChange={(e) => updateSection(sec.key, 'title', e.target.value)} />
                                </Field>
                            )}
                            {sec.fields.includes('subtitle') && (
                                <Field label="Subjudul">
                                    <input className="input" value={v.subtitle || ''} onChange={(e) => updateSection(sec.key, 'subtitle', e.target.value)} />
                                </Field>
                            )}
                            {sec.count && (
                                <Field label="Jumlah Item yang Ditampilkan" hint={blogCounts && sec.key !== 'tags' ? `Tersedia ${blogCounts[sec.key] ?? 0} artikel. Opsi aktif bila total ≥ pilihan − 1 (slot terakhir terisi layanan/booking).` : undefined}>
                                    <select
                                        className="input"
                                        value={availableCount(sec.key, countOptions(sec.key)).includes(Number(v.count)) ? v.count : availableCount(sec.key, countOptions(sec.key))[0]}
                                        onChange={(e) => updateSection(sec.key, 'count', e.target.value)}
                                    >
                                        {countOptions(sec.key).map((o) => (
                                            <option key={o} value={o} disabled={isCountDisabled(sec.key, o)}>{o} Item</option>
                                        ))}
                                    </select>
                                </Field>
                            )}
                        </div>
                    </div>
                );
            })}
        </>
    );
}