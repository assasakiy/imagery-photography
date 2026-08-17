import Icon from '../../../../components/Icon';
import SearchableMultiSelect from '../../../../components/SearchableMultiSelect';
import { Field } from '../../../../components/ui';
import { statLabel } from './shared';

export default function TentangSections({ form, options, updateSection, updateSectionMode, updateTimeline, addTimelinePoint, removeTimelinePoint, setForm }) {
    const timelineSection = form.sections.timeline || { data: [] };
    const timeline = timelineSection.data || [];
    const historyText = form.history ?? '';
    const statsSec = form.sections.stats || {};

    return (
        <>
            <div className="card p-5 space-y-4">
                <div className="border-b border-line pb-3">
                    <h3 className="font-bold text-xl text-ink">Sejarah Situs</h3>
                </div>
                <Field label="Naratif Sejarah (opsional)" hint="Ditampilkan di halaman Tentang di bawah timeline.">
                    <textarea className="input min-h-[100px]" placeholder="Cerita latar belakang situs dan tim..." value={historyText} onChange={e => setForm({ ...form, history: e.target.value })} />
                </Field>
            </div>

            <div className="card p-5 space-y-4">
                <div className="border-b border-line pb-3">
                    <h3 className="font-bold text-xl text-ink">Timeline Perjalanan</h3>
                </div>
                <div className="space-y-3">
                    {timeline.map((t, tIdx) => (
                        <div key={tIdx} className="flex gap-2 items-start bg-surface p-3 rounded-lg ring-1 ring-line">
                            <input className="input w-28 shrink-0" placeholder="Tahun" value={t.year || ''} onChange={e => updateTimeline(0, tIdx, 'year', e.target.value)} />
                            <textarea className="input flex-1 min-h-[42px]" rows="2" placeholder="Cerita / Keterangan" value={t.text || ''} onChange={e => updateTimeline(0, tIdx, 'text', e.target.value)} />
                            <button type="button" className="btn-outline text-red-500 !px-3 !py-2 shrink-0" onClick={() => removeTimelinePoint(0, tIdx)} title="Hapus"><Icon name="trash" size={16}/></button>
                        </div>
                    ))}
                    <button type="button" className="btn-outline text-sm mt-2" onClick={() => addTimelinePoint(0)}><Icon name="plus" size={16}/> Tambah Tahun</button>
                </div>
            </div>

            <div className="card p-5 space-y-6">
                <div className="border-b border-line pb-3">
                    <h3 className="font-bold text-xl text-ink">Section Statistik</h3>
                    <p className="mt-1 text-sm text-ink-muted">Kartu angka di bagian bawah halaman Tentang. Jika tidak ada yang dipilih, baris ini disembunyikan.</p>
                </div>
                <Field label="Mode Tampilan">
                    <select className="input" value={statsSec.mode || 'ids'} onChange={(e) => updateSectionMode('stats', e.target.value)}>
                        <option value="ids">Hanya yang dipilih di bawah</option>
                        <option value="all">Semua statistik</option>
                    </select>
                </Field>
                {statsSec.mode !== 'all' && (
                    <Field label="Pilih Statistik" hint="Kosongkan untuk menyembunyikan baris statistik">
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
        </>
    );
}