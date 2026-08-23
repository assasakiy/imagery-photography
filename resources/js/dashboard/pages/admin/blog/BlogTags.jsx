import { useEffect, useState } from 'react';
import api from '../../../api';
import Icon from '../../../components/Icon';
import { PageHeader, EmptyState, Modal, Confirm, Field } from '../../../components/ui';
import Skeleton from '../../../components/Skeleton';
import Block from '../../../components/skeletons/Block';
import { toast } from '../../../lib/toast';
import { getApiErrorMessage } from '../../../lib/errors';

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

    const load = () => {
        setLoading(true);
        api.get('/blog-tags')
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
                toast.success('Tag diperbarui.');
            } else {
                await api.post('/blog-tags', form);
                toast.success('Tag ditambahkan.');
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
            await api.delete(`/blog-tags/${deleting.id}`);
            toast.success('Tag dihapus.');
            setDeleting(null);
            load();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal menghapus tag.'));
        }
    };

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

            {loading ? (
                (() => {
                    const skelHeader = (
                        <div className="grid grid-cols-[1fr_120px_80px] border-b border-line bg-surface-muted px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                            <span>Tag</span>
                            <span>Jumlah Artikel</span>
                            <span className="text-right">Aksi</span>
                        </div>
                    );
                    const skelRow = (i) => (
                        <div key={i} className="grid grid-cols-[1fr_120px_80px] items-center border-b border-line px-4 py-3 text-sm">
                            <Block className="h-4 w-3/4 rounded" />
                            <Block className="h-4 w-10 rounded" />
                            <div className="flex justify-end gap-2">
                                <Block className="h-7 w-7 rounded-lg" />
                                <Block className="h-7 w-7 rounded-lg" />
                            </div>
                        </div>
                    );
                    return (
                        <div className="card overflow-hidden">
                            {/* Mobile */}
                            <div className="md:hidden">
                                {skelHeader}
                                <div>{Array.from({ length: 4 }, (_, i) => skelRow(i))}</div>
                            </div>
                            {/* Desktop */}
                            <div className="hidden md:grid grid-cols-2 divide-x divide-line">
                                <div>
                                    {skelHeader}
                                    <div>{Array.from({ length: 4 }, (_, i) => skelRow(i))}</div>
                                </div>
                                <div>
                                    {skelHeader}
                                    <div>{Array.from({ length: 4 }, (_, i) => skelRow(i + 4))}</div>
                                </div>
                            </div>
                        </div>
                    );
                })()
            ) : items.length ? (
                (() => {
                    const half = Math.ceil(items.length / 2);
                    const leftItems = items.slice(0, half);
                    const rightItems = items.slice(half);

                    const ListHeader = () => (
                        <div className="grid grid-cols-[1fr_120px_80px] border-b border-line bg-surface-muted px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                            <span>Tag</span>
                            <span>Jumlah Artikel</span>
                            <span className="text-right">Aksi</span>
                        </div>
                    );

                    const renderRow = (item) => (
                        <div key={item.id} className="grid grid-cols-[1fr_120px_80px] items-center border-b border-line px-4 py-2.5 text-sm hover:bg-surface-muted/50 transition-colors">
                            <span className="font-medium text-ink">#{item.name}</span>
                            <span className="text-sm text-ink-muted">{item.posts_count || 0}</span>
                            <div className="flex justify-end gap-1">
                                <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface hover:text-brand-600" aria-label="Edit" title="Edit">
                                    <Icon name="edit" size={16} />
                                </button>
                                <button onClick={() => setDeleting(item)} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface hover:text-red-500" aria-label="Hapus" title="Hapus">
                                    <Icon name="trash" size={16} />
                                </button>
                            </div>
                        </div>
                    );

                    return (
                        <div className="card overflow-hidden">
                            {/* Mobile */}
                            <div className="md:hidden">
                                <ListHeader />
                                <div>{items.map(renderRow)}</div>
                            </div>
                            {/* Desktop */}
                            <div className="hidden md:grid grid-cols-2 divide-x divide-line">
                                <div>
                                    <ListHeader />
                                    <div>{leftItems.map(renderRow)}</div>
                                </div>
                                <div>
                                    <ListHeader />
                                    <div>{rightItems.map(renderRow)}</div>
                                </div>
                            </div>
                        </div>
                    );
                })()
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
        </>
    );
}
