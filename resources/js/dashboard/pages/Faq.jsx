import { useEffect, useState } from 'react';
import api from '../api';
import Icon from '../components/Icon';
import { PageHeader, Spinner, EmptyState, Modal, Confirm, Field, useToast } from '../components/ui';

const emptyForm = { question: '', answer: '', order: 0, published: true };

export default function Faq() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const { show, node } = useToast();

    const load = () => {
        setLoading(true);
        api.get('/faqs')
            .then(({ data }) => setItems(data))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setErrors({});
        setOpen(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm({ question: item.question, answer: item.answer, order: item.order || 0, published: !!item.published });
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
                show('FAQ diperbarui.');
            } else {
                await api.post('/faqs', form);
                show('FAQ ditambahkan.');
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
        show('FAQ dihapus.');
        setDeleting(null);
        load();
    };

    if (loading && !items.length) return <Spinner />;

    return (
        <>
            <PageHeader
                title="FAQ"
                subtitle="Kelola pertanyaan yang sering diajukan di halaman publik."
                action={
                    <button className="btn-primary" onClick={openCreate}>
                        <Icon name="plus" size={18} /> Tambah FAQ
                    </button>
                }
            />

            {items.length ? (
                <div className="space-y-3">
                    {items.map((item) => (
                        <div key={item.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-ink-muted">#{item.order}</span>
                                    {!item.published && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                            Tidak tampil
                                        </span>
                                    )}
                                </div>
                                <h3 className="mt-1 font-bold text-ink">{item.question}</h3>
                                <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{item.answer}</p>
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
                        <textarea className="input min-h-[140px]" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} required placeholder={'Pisahkan paragraf dengan baris kosong.'} />
                    </Field>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Urutan">
                            <input className="input" type="number" min="0" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
                        </Field>
                        <Field label="Tampilkan">
                            <label className="flex cursor-pointer items-center gap-2 pt-2 text-sm text-ink">
                                <input
                                    type="checkbox"
                                    checked={form.published}
                                    onChange={(e) => setForm({ ...form, published: e.target.checked })}
                                    className="h-4 w-4 rounded border-line text-brand-600"
                                />
                                Tampilkan di halaman FAQ
                            </label>
                        </Field>
                    </div>
                </form>
            </Modal>

            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} />
            {node}
        </>
    );
}
