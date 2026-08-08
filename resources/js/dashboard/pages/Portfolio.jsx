import { useEffect, useState } from 'react';
import api from '../api';
import Icon from '../components/Icon';
import MediaPicker from '../components/MediaPicker';
import { PageHeader, Spinner, EmptyState, Modal, Confirm, Field, useToast, formatDate } from '../components/ui';

const emptyForm = {
    title: '',
    category: '',
    description: '',
    is_featured: false,
    order: 0,
    image_mode: 'upload',
    image: null,
    media_id: '',
    image_url: '',
    use_image_url: false,
};

export default function Portfolio() {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [preview, setPreview] = useState('');
    const [mediaOpen, setMediaOpen] = useState(false);
    const { show, node } = useToast();

    const load = (page = 1) => {
        setLoading(true);
        api.get('/portfolios', { params: { page } })
            .then(({ data }) => {
                setItems(data.data);
                setMeta(data);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => load(), []);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setPreview('');
        setErrors({});
        setOpen(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm({
            title: item.title,
            category: item.category || '',
            description: item.description || '',
            is_featured: Boolean(item.is_featured),
            order: item.order || 0,
            image_mode: item.has_local_media ? 'upload' : 'url',
            image: null,
            media_id: item.media_id || '',
            image_url: item.image_url || '',
            use_image_url: false,
        });
        setPreview(item.cover_url);
        setErrors({});
        setOpen(true);
    };

    const onMediaSelect = (sel) => {
        setPreview(sel.url);
        if (sel.source === 'url') {
            setForm({ ...form, image_mode: 'url', image: null, media_id: '', image_url: sel.url });
        } else {
            setForm({ ...form, image_mode: 'upload', image: null, media_id: sel.mediaId, image_url: '' });
        }
        setMediaOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            const data = new FormData();
            data.append('title', form.title);
            data.append('category', form.category);
            data.append('description', form.description);
            data.append('is_featured', form.is_featured ? '1' : '0');
            data.append('order', String(form.order || 0));

            if (form.image_mode === 'upload' && form.image) {
                data.append('image', form.image);
            } else if (form.image_mode === 'upload' && form.media_id) {
                data.append('media_id', form.media_id);
            } else if (form.image_mode === 'url') {
                data.append('image_url', form.image_url);
            }
            data.append('use_image_url', form.use_image_url ? '1' : '0');

            if (editing) {
                await api.post(`/portfolios/${editing.id}?_method=PUT`, data);
                show('Portofolio diperbarui.');
            } else {
                await api.post('/portfolios', data);
                show('Portofolio ditambahkan.');
            }
            load(meta.current_page);
            setEditing(null);
            setOpen(false);
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
            else show('Gagal menyimpan portofolio.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        await api.delete(`/portfolios/${deleting.id}`);
        show('Portofolio dihapus.');
        setDeleting(null);
        load(meta.current_page);
    };

    if (loading && !items.length) return <Spinner />;

    return (
        <>
            <PageHeader
                title="Portofolio"
                subtitle="Kelola galeri karya. Gambar bisa diupload atau memakai URL."
                action={
                    <button className="btn-primary" onClick={openCreate}>
                        <Icon name="plus" size={18} />
                        Tambah Portofolio
                    </button>
                }
            />

            {items.length ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {items.map((item) => (
                        <div key={item.id} className="card group overflow-hidden">
                            <div className="relative aspect-[4/3] overflow-hidden">
                                <img src={item.cover_url} alt={item.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                {item.is_featured && (
                                    <span className="badge absolute left-3 top-3 bg-amber-400 text-amber-950 shadow">
                                        <Icon name="star" size={12} /> Unggulan
                                    </span>
                                )}
                                {!item.has_local_media && item.image_url && (
                                    <span className="badge absolute right-3 top-3 bg-white/90 text-zinc-700 shadow">
                                        <Icon name="link" size={12} /> WordPress
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between gap-2 p-4">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
                                    <p className="text-xs text-ink-muted">{item.category || 'Tanpa kategori'}</p>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                    <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-brand-600" aria-label="Edit">
                                        <Icon name="edit" size={16} />
                                    </button>
                                    <button onClick={() => setDeleting(item)} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted hover:text-red-500" aria-label="Hapus">
                                        <Icon name="trash" size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState title="Belum ada portofolio" message="Tambahkan karya pertama Anda." />
            )}

            {meta.links && (
                <div className="mt-6 flex items-center justify-between">
                    <button className="btn-outline disabled:opacity-40" disabled={!meta.prev_page_url} onClick={() => load(meta.current_page - 1)}>
                        <Icon name="arrow-left" size={16} /> Sebelumnya
                    </button>
                    <span className="text-sm text-ink-muted">
                        Halaman {meta.current_page} dari {meta.last_page}
                    </span>
                    <button className="btn-outline disabled:opacity-40" disabled={!meta.next_page_url} onClick={() => load(meta.current_page + 1)}>
                        Berikutnya <Icon name="arrow-right" size={16} />
                    </button>
                </div>
            )}

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title={editing ? 'Edit Portofolio' : 'Tambah Portofolio'}
                footer={
                    <div className="flex justify-end gap-2">
                        <button type="button" className="btn-outline" onClick={() => setOpen(false)}>
                            Batal
                        </button>
                        <button type="submit" form="portfolio-form" className="btn-primary" disabled={saving}>
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                }
            >
                <form id="portfolio-form" onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label">
                            Judul <span className="text-red-500">*</span>
                        </label>
                        <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Judul karya" required />
                        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title[0]}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Kategori</label>
                            <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Wedding & Event" />
                        </div>
                        <div>
                            <label className="label">Urutan</label>
                            <input className="input" type="number" min="0" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label className="label">
                            Deskripsi <span className="text-xs font-normal text-ink-muted">(opsional)</span>
                        </label>
                        <textarea className="input min-h-[90px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Cerita singkat karya ini" />
                    </div>

                    <div>
                        <label className="label">Gambar</label>
                        {preview ? (
                            <img src={preview} alt="Pratinjau" className="mb-3 h-40 w-full rounded-xl object-cover" />
                        ) : (
                            <div className="mb-3 flex h-40 w-full items-center justify-center rounded-xl border border-dashed border-line bg-surface-muted text-ink-muted">
                                <Icon name="image" size={28} />
                            </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                            <button type="button" className="btn-outline" onClick={() => setMediaOpen(true)}>
                                <Icon name="image" size={16} /> {preview ? 'Ganti Gambar' : 'Pilih Gambar'}
                            </button>
                            {preview && (
                                <button
                                    type="button"
                                    className="btn-outline text-red-500"
                                    onClick={() => {
                                        setPreview('');
                                        setForm({ ...form, image: null, media_id: '', image_mode: 'url', image_url: '' });
                                    }}
                                >
                                    <Icon name="x" size={16} /> Hapus
                                </button>
                            )}
                        </div>
                        <p className="mt-2 text-xs text-ink-muted">
                            Ambil dari Media Library, upload baru, atau tempel URL.
                        </p>
                        {editing?.has_local_media && (
                            <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
                                <input
                                    type="checkbox"
                                    checked={form.use_image_url}
                                    onChange={(e) => setForm({ ...form, use_image_url: e.target.checked, image: null, media_id: '', image_mode: 'url' })}
                                    className="text-brand-600"
                                />
                                Hapus media lokal (kembali pakai URL/placeholder)
                            </label>
                        )}
                        {errors.image && <p className="mt-1 text-xs text-red-500">{errors.image[0]}</p>}
                        {errors.image_url && <p className="mt-1 text-xs text-red-500">{errors.image_url[0]}</p>}
                    </div>

                    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                        <input
                            type="checkbox"
                            checked={form.is_featured}
                            onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                            className="text-brand-600"
                        />
                        Tampilkan di halaman utama (unggulan)
                    </label>
                </form>
            </Modal>

            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title="Hapus portofolio?" message="Karya ini akan dihapus dari galeri." />
            <MediaPicker open={mediaOpen} onClose={() => setMediaOpen(false)} onSelect={onMediaSelect} />
            {node}
        </>
    );
}
