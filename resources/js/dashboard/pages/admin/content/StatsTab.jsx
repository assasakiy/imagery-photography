import { useEffect, useImperativeHandle, useState } from 'react';
import api from '../../../api';
import Icon from '../../../components/Icon';
import { EmptyState, Modal, Confirm, Field } from '../../../components/ui';
import { CardListSkeleton } from '../../../components/Skeleton';
import { toast } from '../../../lib/toast';
import { getApiErrorMessage } from '../../../lib/errors';

const emptyForm = { label: '', value: '', suffix: '', order: 0, source: 'manual', metric: '' };

const SOURCES = {
    manual: 'Manual',
    auto: 'Otomatis',
    auto_offset: 'Otomatis + Nilai Awal',
};

const METRICS = [
    { value: 'projects_completed', label: 'Proyek Selesai' },
    { value: 'clients', label: 'Jumlah Klien' },
    { value: 'avg_rating', label: 'Rating Rata-rata' },
    { value: 'years_experience', label: 'Tahun Pengalaman' },
];

export default function StatsTab({ ref }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [previewValue, setPreviewValue] = useState(null);

    const load = () => {
        setLoading(true);
        api.get('/stats')
            .then(({ data }) => setItems(data))
            .catch(() => toast.error('Gagal memuat data.'))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    useEffect(() => {
        if (form.source === 'manual' || !form.metric) {
            setPreviewValue(null);
            return;
        }
        let cancelled = false;
        api.get('/stats/preview', { params: { metric: form.metric, base: form.source === 'auto_offset' ? form.value : undefined } })
            .then(({ data }) => {
                if (!cancelled) setPreviewValue(data.value);
            })
            .catch(() => {
                if (!cancelled) setPreviewValue(null);
            });
        return () => {
            cancelled = true;
        };
    }, [form.source, form.metric, form.value]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setErrors({});
        setOpen(true);
    };

    useImperativeHandle(ref, () => ({ openCreate }));

    const openEdit = (item) => {
        setEditing(item);
        setForm({ label: item.label, value: item.value || '', suffix: item.suffix || '', order: item.order || 0, source: item.source || 'manual', metric: item.metric || '' });
        setErrors({});
        setOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        const payload = {
            source: form.source,
            metric: form.source === 'manual' ? null : form.metric?.trim() || null,
            label: form.label,
            value: form.source === 'auto' ? null : form.value,
            suffix: form.suffix?.trim() || null,
            order: form.order,
        };
        try {
            if (editing) {
                await api.put(`/stats/${editing.id}`, payload);
                toast.success('Stat diperbarui.');
            } else {
                await api.post('/stats', payload);
                toast.success('Stat ditambahkan.');
            }
            load();
            setOpen(false);
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/stats/${deleting.id}`);
            toast.success('Stat dihapus.');
            setDeleting(null);
            load();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal menghapus stat.'));
        }
    };

    return (
        <>
            {loading ? (
                <CardListSkeleton count={4} />
            ) : items.length ? (
                <div className="space-y-3">
                    {items.map((item) => (
                        <div key={item.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-ink-muted">#{item.order}</span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-ink-muted">
                                        {SOURCES[item.source] || 'Manual'}
                                    </span>
                                </div>
                                <div className="mt-1 flex items-baseline gap-2">
                                    {item.source === 'manual' ? (
                                        <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">{item.value}{item.suffix}</span>
                                    ) : (
                                        <>
                                            <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                                                {item.resolved_value != null ? (
                                                    <>
                                                        {item.resolved_value}{item.suffix}
                                                        <span className="ml-2 align-middle text-xs font-semibold text-ink-muted">(dihitung otomatis)</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        {METRICS.find((m) => m.value === item.metric)?.label || item.metric}
                                                        <span className="ml-2 align-middle text-xs font-semibold text-ink-muted">(belum ada data)</span>
                                                    </>
                                                )}
                                            </span>
                                        </>
                                    )}
                                    <span className="font-medium text-ink">{item.label}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => openEdit(item)} className="rounded-lg p-2 text-ink-muted hover:bg-surface-muted hover:text-brand-600" aria-label="Edit">
                                    <Icon name="edit" size={18} />
                                </button>
                                <button onClick={() => setDeleting(item)} className="rounded-lg p-2 text-ink-muted hover:bg-surface-muted hover:text-red-500" aria-label="Hapus">
                                    <Icon name="trash" size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState title="Belum ada statistik" message="Tambahkan statistik seperti jumlah proyek, klien, atau tahun pengalaman." />
            )}

            <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Stat' : 'Tambah Stat'} wide footer={
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Batal</button>
                    <button type="submit" form="stat-form" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
            }>
                <form id="stat-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Label" required error={errors.label?.[0]} hint="Misal: Tahun Pengalaman">
                            <input className="input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
                        </Field>
                        <Field label="Sumber" error={errors.source?.[0]}>
                            <select className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                                <option value="manual">Manual (angka tetap)</option>
                                <option value="auto">Otomatis (murni hitung)</option>
                                <option value="auto_offset">Otomatis + Nilai Awal</option>
                            </select>
                        </Field>
                    </div>

                    {form.source !== 'manual' && (
                        <div className="rounded-xl border border-line bg-surface-muted/50 p-4 space-y-4">
                            <p className="text-sm font-semibold text-ink">Metrik Otomatis</p>
                            <Field label="Metrik" required error={errors.metric?.[0]}>
                                <select className="input" value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })}>
                                    <option value="">Pilih metrik…</option>
                                    {METRICS.map((m) => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </Field>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label={form.source === 'auto_offset' ? 'Nilai Awal (menambah hasil metrik)' : 'Nilai'} error={errors.value?.[0]}>
                                    {form.source === 'auto_offset' ? (
                                        <input className="input" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="misal 350" />
                                    ) : (
                                        <input className="input" value={form.value} disabled placeholder="Dihitung otomatis" />
                                    )}
                                </Field>
                                <Field label="Sufiks" error={errors.suffix?.[0]} hint="Tampil di belakang angka, misal + atau %">
                                    <input className="input" value={form.suffix} onChange={(e) => setForm({ ...form, suffix: e.target.value })} placeholder="+, %, dll" />
                                </Field>
                            </div>
                            {form.metric && (
                                <div className="flex items-center gap-3 rounded-xl border border-brand-500/25 bg-brand-500/10 px-4 py-3">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">Pratinjau</span>
                                    <span className="text-xl font-extrabold text-brand-600 dark:text-brand-400">
                                        {previewValue != null ? `${previewValue}${form.suffix}` : '…'}
                                    </span>
                                    <span className="text-sm text-ink-muted">{form.label || 'Label stat'}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {form.source === 'manual' && (
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Nilai" required error={errors.value?.[0]} hint="Angka yang ditampilkan, misal 15">
                                    <input className="input" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
                                </Field>
                                <Field label="Sufiks" error={errors.suffix?.[0]} hint="Opsional, misal + atau %">
                                    <input className="input" value={form.suffix} onChange={(e) => setForm({ ...form, suffix: e.target.value })} placeholder="+, %, dll" />
                                </Field>
                            </div>
                            <div className="flex items-center gap-3 rounded-xl border border-brand-500/25 bg-brand-500/10 px-4 py-3">
                                <span className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">Pratinjau</span>
                                <span className="text-xl font-extrabold text-brand-600 dark:text-brand-400">
                                    {form.value ? `${form.value}${form.suffix}` : '…'}
                                </span>
                                <span className="text-sm text-ink-muted">{form.label || 'Label stat'}</span>
                            </div>
                        </>
                    )}

                    <Field label="Urutan">
                        <input className="input" type="number" min="0" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
                    </Field>
                </form>
            </Modal>

            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} />
        </>
    );
}