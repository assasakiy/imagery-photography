import { useEffect, useState } from 'react';
import api from '../../api';
import Icon from '../../components/Icon';
import { PageHeader, Spinner, EmptyState, Modal, Confirm, Field, useToast } from '../../components/ui';

const emptyForm = { name: '' };

export default function BlogTags() {
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
        api.get('/blog-tags')
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
        setForm({ name: item.name });
        setErrors({});
        setOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (editing) {
                await api.put(`/blog-tags/${editing.id}`, form);
                show('Tag diperbarui.');
            } else {
                await api.post('/blog-tags', form);
                show('Tag ditambahkan.');
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
        await api.delete(`/blog-tags/${deleting.id}`);
        show('Tag dihapus.');
        setDeleting(null);
        load();
    };

    if (loading && !items.length) return <Spinner />;

    return (
        <>
            <PageHeader
                title="Tag Blog"
                subtitle="Kelola tag untuk artikel blog."
                action={
                    <button className="btn-primary" onClick={openCreate}>
                        <Icon name="plus" size={18} /> Tambah Tag
                    </button>
                }
            />

            {items.length ? (
                <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                        <span key={item.id} className="card group flex items-center gap-2 px-4 py-2 text-sm">
                            <span className="font-medium text-ink">#{item.name}</span>
                            <span className="text-xs text-ink-muted">{item.posts_count}</span>
                            <button onClick={() => openEdit(item)} className="rounded p-1 text-ink-muted hover:text-brand-600" aria-label="Edit">
                                <Icon name="edit" size={14} />
                            </button>
                            <button onClick={() => setDeleting(item)} className="rounded p-1 text-ink-muted hover:text-red-500" aria-label="Hapus">
                                <Icon name="trash" size={14} />
                            </button>
                        </span>
                    ))}
                </div>
            ) : (
                <EmptyState title="Belum ada tag" />
            )}

            <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Tag' : 'Tambah Tag'} footer={
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Batal</button>
                    <button type="submit" form="tag-form" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
            }>
                <form id="tag-form" onSubmit={handleSubmit} className="space-y-4">
                    <Field label="Nama" required error={errors.name?.[0]}>
                        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </Field>
                </form>
            </Modal>

            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} />
            {node}
        </>
    );
}
