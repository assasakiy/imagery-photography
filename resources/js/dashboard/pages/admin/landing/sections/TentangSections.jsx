import Icon from '../../../../components/Icon';
import RichEditor from '../../../../components/RichEditor';
import SearchableMultiSelect from '../../../../components/SearchableMultiSelect';
import { Field } from '../../../../components/ui';
import TeamSection from './TeamSection';
import { statLabel } from './shared';

const isEmptyRich = (html) => !html || !String(html).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();

export default function TentangSections({ form, options, updateSection, updateSectionMode, updateTimeline, addTimelinePoint, removeTimelinePoint, renderImageUploader }) {
    const cerita = form.sections.cerita || {};
    const perjalanan = form.sections.perjalanan || {};
    const timelineSection = form.sections.timeline || { data: [] };
    const timeline = timelineSection.data || [];
    const tim = form.sections.tim || {};
    const karya = form.sections.karya || {};
    const statsSec = form.sections.stats || {};

    const ceritaContent = !isEmptyRich(cerita.content) ? cerita.content : (form.content || '');
    const perjalananHistory = !isEmptyRich(perjalanan.history) ? perjalanan.history : '';

    return (
        <>
            <div className="card p-5 space-y-6">
                <div className="border-b border-line pb-3">
                    <h3 className="font-bold text-xl text-ink">Section Cerita Kami</h3>
                    <p className="mt-1 text-sm text-ink-muted">Bagian intro kedua setelah judul. Jika Konten dikosongkan, kembali ke isi halaman (deskripsi) Tentang.</p>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field label="Judul Kecil">
                        <input className="input" value={cerita.subtitle || ''} onChange={(e) => updateSection('cerita', 'subtitle', e.target.value)} />
                    </Field>
                    <Field label="Judul">
                        <input className="input" value={cerita.title || ''} onChange={(e) => updateSection('cerita', 'title', e.target.value)} />
                    </Field>
                </div>
                <Field label="Konten" hint="Rich text; dipakai juga sebagai cadangan konten Section Tentang Kami di halaman beranda.">
                    <RichEditor variant="mini" value={ceritaContent} onChange={(val) => updateSection('cerita', 'content', isEmptyRich(val) ? '' : val)} minHeight={150} maxHeight={300} />
                </Field>
                <Field label="Gambar Cerita Kami">
                    {renderImageUploader('about_image', 'Gambar Cerita Kami')}
                </Field>
            </div>

            <div className="card p-5 space-y-6">
                <div className="border-b border-line pb-3">
                    <h3 className="font-bold text-xl text-ink">Section Perjalanan</h3>
                    <p className="mt-1 text-sm text-ink-muted">Judul kecil, judul, deskripsi naratif, dan timeline perjalanan.</p>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field label="Judul Kecil">
                        <input className="input" value={perjalanan.subtitle || ''} onChange={(e) => updateSection('perjalanan', 'subtitle', e.target.value)} />
                    </Field>
                    <Field label="Judul">
                        <input className="input" value={perjalanan.title || ''} onChange={(e) => updateSection('perjalanan', 'title', e.target.value)} />
                    </Field>
                </div>
                <Field label="Deskripsi / Naratif Sejarah">
                    <RichEditor variant="mini" value={perjalananHistory} onChange={(val) => updateSection('perjalanan', 'history', isEmptyRich(val) ? '' : val)} minHeight={100} maxHeight={200} />
                </Field>
                <div className="rounded-xl border border-line bg-surface-muted/50 p-4 space-y-3">
                    <p className="text-sm font-semibold text-ink">Timeline Perjalanan</p>
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
            </div>

            <div className="card p-5 space-y-6">
                <div className="border-b border-line pb-3">
                    <h3 className="font-bold text-xl text-ink">Section Tim</h3>
                    <p className="mt-1 text-sm text-ink-muted">Tim tampil otomatis dari akun admin & owner (profil mereka). Atur pilihan anggota & override tampilan card di bawah.</p>
                </div>
                <TeamSection tim={tim} team={options?.team || []} updateSection={updateSection} />
            </div>

            <div className="card p-5 space-y-6">
                <div className="border-b border-line pb-3">
                    <h3 className="font-bold text-xl text-ink">Section Karya</h3>
                    <p className="mt-1 text-sm text-ink-muted">Pilih dari Karya Unggulan, Terbaru, atau berdasarkan kategori.</p>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field label="Judul Kecil">
                        <input className="input" value={karya.subtitle || ''} onChange={(e) => updateSection('karya', 'subtitle', e.target.value)} />
                    </Field>
                    <Field label="Judul">
                        <input className="input" value={karya.title || ''} onChange={(e) => updateSection('karya', 'title', e.target.value)} />
                    </Field>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field label="Sumber Karya">
                        <select className="input" value={karya.mode || 'featured'} onChange={(e) => updateSection('karya', 'mode', e.target.value)}>
                            <option value="featured">Karya Unggulan</option>
                            <option value="latest">Terbaru</option>
                            <option value="category">Berdasarkan kategori</option>
                        </select>
                    </Field>
                    <Field label="Jumlah Tampilan">
                        <select className="input" value={karya.limit || 3} onChange={(e) => updateSection('karya', 'limit', e.target.value)}>
                            {[3, 6, 9].map((n) => (
                                <option key={n} value={n}>{n} Karya</option>
                            ))}
                        </select>
                    </Field>
                </div>
                {karya.mode === 'category' && (
                    <Field label="Pilih Kategori">
                        <SearchableMultiSelect
                            options={(options?.categories || []).map((c) => ({ label: c.name, value: c.id }))}
                            value={karya.category_ids || []}
                            onChange={(val) => updateSection('karya', 'category_ids', val)}
                            placeholder="Pilih kategori..."
                            searchPlaceholder="Cari kategori..."
                            emptyMessage="Tidak ada kategori."
                        />
                    </Field>
                )}
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
