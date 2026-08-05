import { useEffect, useState } from 'react';
import api from '../api';
import Icon from '../components/Icon';
import IconPicker from '../components/IconPicker';
import { PageHeader, Spinner, EmptyState, Modal, Confirm, Field, useToast, formatRupiah } from '../components/ui';

const emptyForm = { title: '', description: '', icon: 'camera', starting_price: '', order: 0 };

export default function Services() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [iconOpen, setIconOpen] = useState(false);
    const { show, node } = useToast();

    const load = () => {
        setLoading(true);
        api.get('/services')
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
        setForm({ title: item.title, description: item.description || '', icon: item.icon || 'camera', starting_price: item.starting_price, order: item.order || 0 });
        setErrors({});
        setOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (editing) {
                await api.put(`/services/${editing.id}`, form);
                show('Layanan diperbarui.');
            } else {
                await api.post('/services', form);
                show('Layanan ditambahkan.');
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
        await api.delete(`/services/${deleting.id}`);
        show('Layanan dihapus.');
        setDeleting(null);
        load();
    };

    if (loading && !items.length) return <Spinner />;

    return (
        <>
            <PageHeader
                title="Layanan"
                subtitle="Kelola layanan dan harga yang tampil di halaman Layanan."
                action={
                    <button className="btn-primary" onClick={openCreate}>
                        <Icon name="plus" size={18} /> Tambah Layanan
                    </button>
                }
            />

            {items.length ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {items.map((item) => (
                        <div key={item.id} className="card p-5">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
                                <Icon name={item.icon} size={24} />
                            </div>
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h3 className="font-bold text-ink">{item.title}</h3>
                                    <p className="mt-1 text-sm text-ink-muted">{item.description}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-brand-600" aria-label="Edit">
                                        <Icon name="edit" size={16} />
                                    </button>
                                    <button onClick={() => setDeleting(item)} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-red-500" aria-label="Hapus">
                                        <Icon name="trash" size={16} />
                                    </button>
                                </div>
                            </div>
                            <p className="mt-3 font-bold text-brand-600 dark:text-brand-400">{formatRupiah(item.starting_price)}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState title="Belum ada layanan" />
            )}

            <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Layanan' : 'Tambah Layanan'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Field label="Nama Layanan" required error={errors.title?.[0]}>
                        <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                    </Field>
                    <Field label="Deskripsi" hint="opsional" error={errors.description?.[0]}>
                        <textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </Field>
                    <Field label="Ikon">
                        <button
                            type="button"
                            onClick={() => setIconOpen(true)}
                            className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-ink hover:bg-surface-muted"
                        >
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
                                <Icon name={form.icon} size={20} />
                            </span>
                            <span className="text-sm font-medium">{form.icon}</span>
                            <Icon name="edit" size={14} className="ml-auto text-ink-muted" />
                        </button>
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Harga Mulai" hint="opsional" error={errors.starting_price?.[0]}>
                            <input className="input" type="number" min="0" value={form.starting_price} onChange={(e) => setForm({ ...form, starting_price: e.target.value })} />
                        </Field>
                        <Field label="Urutan">
                            <input className="input" type="number" min="0" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
                        </Field>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Batal</button>
                        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
                    </div>
                </form>
            </Modal>

            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} />
            <IconPicker open={iconOpen} onClose={() => setIconOpen(false)} value={form.icon} onSelect={(name) => setForm({ ...form, icon: name })} />
            {node}
        </>
    );
}
