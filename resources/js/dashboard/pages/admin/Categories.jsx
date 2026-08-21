import { useEffect, useState } from 'react';
import api from '../../api';
import { toast } from '../../lib/toast';
import { getApiErrorMessage } from '../../lib/errors';
import Icon from '../../components/Icon';
import { PageHeader, EmptyState, Modal, Confirm, Field } from '../../components/ui';
import Skeleton from '../../components/Skeleton';

const emptyForm = { name: '', description: '' };

export default function Categories() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);

    const load = () => {
        setLoading(true);
        api.get('/categories')
            .then(({ data }) => setItems(data))
            .catch(() => toast.error('Gagal memuat data.'))
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
        setForm({ name: item.name, description: item.description || '' });
        setErrors({});
        setOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (editing) {
                await api.put(`/categories/${editing.id}`, form);
                toast.success('Kategori diperbarui.');
            } else {
                await api.post('/categories', form);
                toast.success('Kategori ditambahkan.');
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
            await api.delete(`/categories/${deleting.id}`);
            toast.success('Kategori dihapus.');
            setDeleting(null);
            load();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal menghapus kategori.'));
        }
    };

    return (
        <>
            <PageHeader
                title="Kategori"
                subtitle="Kelompokkan konten (artikel & portofolio) berdasarkan kategori."
                action={
                    <button className="btn-primary" onClick={openCreate}>
                        <Icon name="plus" size={18} /> Tambah Kategori
                    </button>
                }
            />

            {loading ? (
                <Skeleton variant="card" />
            ) : items.length ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((item) => (
                        <div key={item.id} className="card p-5">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-bold text-ink">{item.name}</h3>
                                        {item.is_system && (
                                            <span className="badge bg-brand-500/15 text-brand-600 dark:text-brand-400">
                                                <Icon name="settings" size={11} /> Sistem
                                            </span>
                                        )}
                                    </div>
                                    {item.description && <p className="mt-1 text-sm text-ink-muted">{item.description}</p>}
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-brand-600" aria-label="Edit">
                                        <Icon name="edit" size={16} />
                                    </button>
                                    {!item.is_system && (
                                        <button onClick={() => setDeleting(item)} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-red-500" aria-label="Hapus">
                                            <Icon name="trash" size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className="mt-3 text-xs text-ink-muted">{item.blogs_count} artikel</p>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState title="Belum ada kategori" />
            )}

            <Modal open={open} onClose={() => setOpen(false)} title={editing ? (editing.is_system ? 'Deskripsi Kategori Sistem' : 'Edit Kategori') : 'Tambah Kategori'} footer={
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Batal</button>
                    <button type="submit" form="category-form" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
            }>
                <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
                    {editing?.is_system ? (
                        <>
                            <Field label="Nama">
                                <input className="input" value={form.name} disabled />
                            </Field>
                            <p className="text-xs text-ink-muted">Kategori sistem (Unggulan/Populer/Terbaru) otomatis. Nama tidak dapat diubah.</p>
                        </>
                    ) : (
                        <Field label="Nama" required error={errors.name?.[0]}>
                            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        </Field>
                    )}
                    <Field label="Deskripsi" hint="opsional" error={errors.description?.[0]}>
                        <textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </Field>
                </form>
            </Modal>

            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} />
        </>
    );
}
