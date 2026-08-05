import { useEffect, useState } from 'react';
import api from '../api';
import Icon from '../components/Icon';
import { PageHeader, Spinner, EmptyState, Modal, Confirm, Field, useToast } from '../components/ui';

const emptyForm = { slug: '', title: '', content: '', published: true };

export default function Pages() {
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
        api.get('/pages')
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
        setForm({ slug: item.slug, title: item.title, content: item.content, published: !!item.published });
        setErrors({});
        setOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (editing) {
                await api.put(`/pages/${editing.id}`, form);
                show('Halaman diperbarui.');
            } else {
                await api.post('/pages', form);
                show('Halaman ditambahkan.');
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
        await api.delete(`/pages/${deleting.id}`);
        show('Halaman dihapus.');
        setDeleting(null);
        load();
    };

    if (loading && !items.length) return <Spinner />;

    return (
        <>
            <PageHeader
                title="Halaman"
                subtitle="Kelola halaman statis seperti Kebijakan Privasi dan Syarat & Ketentuan."
                action={
                    <button className="btn-primary" onClick={openCreate}>
                        <Icon name="plus" size={18} /> Tambah Halaman
                    </button>
                }
            />

            {items.length ? (
                <div className="space-y-3">
                    {items.map((item) => (
                        <div key={item.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-lg bg-surface-muted px-2 py-0.5 font-mono text-xs text-ink-muted">/{item.slug}</span>
                                    {!item.published && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                            Tidak tampil
                                        </span>
                                    )}
                                </div>
                                <h3 className="mt-1 font-bold text-ink">{item.title}</h3>
                            </div>
                            <div className="flex items-center gap-1">
                                <a href={`/${item.slug}`} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-ink-muted hover:bg-surface-muted hover:text-brand-600" aria-label="Lihat">
                                    <Icon name="eye" size={18} />
                                </a>
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
                <EmptyState title="Belum ada halaman" />
            )}

            <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Halaman' : 'Tambah Halaman'} wide>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Field label="Slug" required hint="a-z, 0-9, tanda hubung" error={errors.slug?.[0]}>
                            <input className="input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required placeholder="kebijakan-privasi" />
                        </Field>
                        <div className="sm:col-span-2">
                            <Field label="Judul" required error={errors.title?.[0]}>
                                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                            </Field>
                        </div>
                    </div>
                    <Field label="Konten" required error={errors.content?.[0]}>
                        <textarea
                            className="input min-h-[260px] font-mono text-sm"
                            value={form.content}
                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                            required
                            placeholder={'Pisahkan paragraf dengan baris kosong.'}
                        />
                    </Field>
                    <Field label="Tampilkan">
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                            <input
                                type="checkbox"
                                checked={form.published}
                                onChange={(e) => setForm({ ...form, published: e.target.checked })}
                                className="h-4 w-4 rounded border-line text-brand-600"
                            />
                            Tampilkan di halaman publik
                        </label>
                    </Field>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Batal</button>
                        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
                    </div>
                </form>
            </Modal>

            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} />
            {node}
        </>
    );
}
