import { useEffect, useImperativeHandle, useState } from 'react';
import api from '../../../api';
import Icon from '../../../components/Icon';
import SearchableMultiSelect from '../../../components/SearchableMultiSelect';
import RichEditor from '../../../components/RichEditor';
import { EmptyState, Modal, Confirm, Field } from '../../../components/ui';
import Skeleton from '../../../components/Skeleton';
import { toast } from '../../../lib/toast';

const emptyForm = { question: '', answer: '', order: 0, category_ids: [] };

export default function FaqTab({ ref }) {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);

    const load = () => {
        setLoading(true);
        api.get('/faqs')
            .then(({ data }) => setItems(data))
            .finally(() => setLoading(false));
    };

    const loadCategories = () => {
        api.get('/categories?exclude_system=1')
            .then(({ data }) => setCategories(Array.isArray(data) ? data : []))
            .catch(() => setCategories([]));
    };

    useEffect(() => {
        load();
        loadCategories();
    }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setErrors({});
        setOpen(true);
    };

    useImperativeHandle(ref, () => ({ openCreate }));

    const openEdit = (item) => {
        setEditing(item);
        setForm({ question: item.question, answer: item.answer, order: item.order || 0, category_ids: (item.categories || []).map((c) => c.id) });
        setErrors({});
        setOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (editing) {
                await api.put(`/faqs/${editing.id}`, form);
                toast.success('FAQ diperbarui.');
            } else {
                await api.post('/faqs', form);
                toast.success('FAQ ditambahkan.');
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
        await api.delete(`/faqs/${deleting.id}`);
        toast.success('FAQ dihapus.');
        setDeleting(null);
        load();
    };

    return (
        <>
            {loading ? (
                <Skeleton variant="table" />
            ) : items.length ? (
                <div className="space-y-3">
                    {items.map((item) => (
                        <div key={item.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-ink-muted">#{item.order}</span>
                                    {(item.categories || []).map((c) => (
                                        <span key={c.id} className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-semibold text-brand-600 dark:text-brand-300">{c.name}</span>
                                    ))}
                                </div>
                                <h3 className="mt-1 font-bold text-ink">{item.question}</h3>
                                <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{(item.answer || '').replace(/<[^>]*>/g, '')}</p>
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
                <EmptyState title="Belum ada FAQ" />
            )}

            <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit FAQ' : 'Tambah FAQ'} wide footer={
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Batal</button>
                    <button type="submit" form="faq-form" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
            }>
                <form id="faq-form" onSubmit={handleSubmit} className="space-y-4">
                    <Field label="Pertanyaan" required error={errors.question?.[0]}>
                        <input className="input" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required />
                    </Field>
                    <Field label="Jawaban" required error={errors.answer?.[0]}>
                        <RichEditor variant="basic" value={form.answer || ''} onChange={(val) => setForm({ ...form, answer: val })} minHeight={140} maxHeight={320} placeholder="Tulis jawaban..." />
                    </Field>
                    <Field label="Kategori" error={errors.category_ids?.[0]}>
                        <SearchableMultiSelect
                            options={categories.map((c) => ({ label: c.name, value: c.id }))}
                            value={form.category_ids}
                            onChange={(val) => setForm({ ...form, category_ids: val })}
                            placeholder="Pilih kategori FAQ..."
                            searchPlaceholder="Cari kategori..."
                            emptyMessage="Tidak ada kategori"
                        />
                    </Field>
                    <Field label="Urutan">
                        <input className="input" type="number" min="0" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
                    </Field>
                </form>
            </Modal>

            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} />
        </>
    );
}