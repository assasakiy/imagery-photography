import { useEffect, useState } from 'react';
import api from '../api';
import Icon from '../components/Icon';
import MediaPicker from '../components/MediaPicker';
import { PageHeader, Spinner, EmptyState, Modal, Confirm, Field, useToast, formatDate } from '../components/ui';

const emptyForm = {
    title: '',
    category_id: '',
    excerpt: '',
    content: '',
    status: 'draft',
    image_url: '',
    image_mode: 'url',
    image: null,
    media_id: '',
    use_image_url: false,
    is_featured: false,
    tags: [],
};

export default function Blog() {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [status, setStatus] = useState('');
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [preview, setPreview] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [mediaOpen, setMediaOpen] = useState(false);
    const { show, node } = useToast();

    const load = () => {
        setLoading(true);
        api.get('/blog', { params: { q: q || undefined, status: status || undefined, per_page: 20 } })
            .then(({ data }) => setItems(data.data))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    };

    useEffect(load, [q, status]);

    useEffect(() => {
        api.get('/blog-categories').then(({ data }) => setCategories(data)).catch(() => {});
    }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setPreview('');
        setTagInput('');
        setErrors({});
        setOpen(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm({
            title: item.title,
            category_id: item.category?.id ?? '',
            excerpt: item.excerpt || '',
            content: item.content || '',
            status: item.status || 'draft',
            image_url: item.image_url || '',
            image_mode: 'url',
            image: null,
            media_id: item.media_id || '',
            use_image_url: false,
            is_featured: !!item.is_featured,
            tags: (item.tags || []).map((t) => t.name),
        });
        setPreview(item.cover_url);
        setTagInput('');
        setErrors({});
        setOpen(true);
    };

    const onMediaSelect = (sel) => {
        setPreview(sel.url);
        if (sel.source === 'url') {
            setForm({ ...form, image_mode: 'url', image: null, media_id: '', image_url: sel.url, use_image_url: false });
        } else {
            setForm({ ...form, image_mode: 'upload', image: null, media_id: sel.mediaId, image_url: '', use_image_url: false });
        }
        setMediaOpen(false);
    };

    const addTag = () => {
        const name = tagInput.trim();
        if (!name) return;
        setForm({ ...form, tags: [...new Set([...form.tags, name])] });
        setTagInput('');
    };

    const removeTag = (name) => setForm({ ...form, tags: form.tags.filter((t) => t !== name) });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        const data = new FormData();
        data.append('title', form.title);
        data.append('category_id', form.category_id || '');
        data.append('excerpt', form.excerpt);
        data.append('content', form.content);
        data.append('status', form.status);
        data.append('is_featured', form.is_featured ? '1' : '0');
        data.append('image_url', form.image_url);
        data.append('use_image_url', form.use_image_url ? '1' : '0');
        data.append('tags', JSON.stringify(form.tags));
        if (form.image) data.append('cover', form.image);
        else if (form.media_id) data.append('media_id', form.media_id);

        try {
            if (editing) {
                await api.post(`/blog/${editing.id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
                show('Artikel diperbarui.');
            } else {
                await api.post('/blog', data, { headers: { 'Content-Type': 'multipart/form-data' } });
                show('Artikel ditambahkan.');
            }
            load();
            setOpen(false);
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
            else show('Gagal menyimpan artikel.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        await api.delete(`/blog/${deleting.id}`);
        show('Artikel dihapus.');
        setDeleting(null);
        load();
    };

    if (loading && !items.length) return <Spinner />;

    return (
        <>
            <PageHeader
                title="Blog"
                subtitle="Kelola artikel blog untuk website Anda."
                action={
                    <button className="btn-primary" onClick={openCreate}>
                        <Icon name="plus" size={18} /> Tulis Artikel
                    </button>
                }
            />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                    {[
                        { value: '', label: 'Semua' },
                        { value: 'published', label: 'Terbit' },
                        { value: 'draft', label: 'Draf' },
                    ].map((s) => (
                        <button
                            key={s.value}
                            onClick={() => setStatus(s.value)}
                            className={`chip ${status === s.value ? 'chip-active' : ''}`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input className="input pl-10" placeholder="Cari artikel..." value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
            </div>

            {items.length ? (
                <div className="space-y-3">
                    {items.map((item) => (
                        <div key={item.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                            <div className="h-20 w-full shrink-0 overflow-hidden rounded-xl sm:h-16 sm:w-24">
                                <img src={item.cover_url} alt={item.title} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${item.status === 'published' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'}`}>
                                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                        {item.status === 'published' ? 'Terbit' : 'Draf'}
                                    </span>
                                    {item.category && <span className="text-xs text-ink-muted">{item.category.name}</span>}
                                </div>
                                <h3 className="mt-1 truncate font-bold text-ink">{item.title}</h3>
                                <p className="mt-0.5 text-xs text-ink-muted">
                                    Author: {item.author?.name ?? '-'} · {item.published_at ? formatDate(item.published_at) : 'Belum terbit'}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <a href={`/blog/${item.slug}`} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-ink-muted hover:bg-surface-muted hover:text-brand-600" aria-label="Lihat">
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
                <EmptyState title="Belum ada artikel" message="Klik 'Tulis Artikel' untuk membuat postingan pertama." />
            )}

            <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Artikel' : 'Tulis Artikel'} wide>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Field label="Judul" required error={errors.title?.[0]}>
                        <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                    </Field>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Kategori">
                            <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                                <option value="">Tanpa kategori</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Status" required>
                            <div className="flex gap-2">
                                {['draft', 'published'].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setForm({ ...form, status: s })}
                                        className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                                            form.status === s
                                                ? s === 'published'
                                                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                                    : 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                                : 'border-line text-ink-muted hover:bg-surface-muted'
                                        }`}
                                    >
                                        {s === 'published' ? 'Terbit' : 'Draf'}
                                    </button>
                                ))}
                            </div>
                        </Field>
                        <label className="flex items-center gap-2 text-sm text-ink-muted">
                            <input
                                type="checkbox"
                                checked={form.is_featured}
                                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                                className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500/30"
                            />
                            Unggulan (ditampilkan di "Artikel Unggulan")
                        </label>
                    </div>

                    <Field label="Ringkasan (excerpt)" hint="opsional" error={errors.excerpt?.[0]}>
                        <textarea className="input min-h-[70px]" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Ringkasan singkat untuk kartu artikel" />
                    </Field>

                    <Field label="Isi Artikel" required error={errors.content?.[0]}>
                        <textarea
                            className="input min-h-[240px] font-mono text-sm"
                            value={form.content}
                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                            placeholder={'Tulis isi artikel...\n\nPisahkan paragraf dengan baris kosong.'}
                            required
                        />
                    </Field>

                    <Field label="Tag" hint="tekan Enter untuk menambah">
                        <div className="flex flex-wrap gap-2 rounded-xl border border-line bg-surface-muted/50 p-2">
                            {form.tags.map((tag) => (
                                <span key={tag} className="inline-flex items-center gap-1 rounded-lg bg-brand-500/15 px-2 py-1 text-sm text-brand-700 dark:text-brand-300">
                                    #{tag}
                                    <button type="button" onClick={() => removeTag(tag)} className="text-brand-700/70 hover:text-red-500 dark:text-brand-300/70" aria-label="Hapus tag">
                                        <Icon name="x" size={14} />
                                    </button>
                                </span>
                            ))}
                            <input
                                className="min-w-[120px] flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-ink-muted"
                                placeholder="mis. wedding, tips"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addTag();
                                    }
                                }}
                                onBlur={addTag}
                            />
                        </div>
                    </Field>

                    <Field label="Sampul">
                        {preview ? (
                            <img src={preview} alt="Pratinjau" className="mb-3 h-40 w-full rounded-xl object-cover" />
                        ) : (
                            <div className="mb-3 flex h-40 w-full items-center justify-center rounded-xl border border-dashed border-line bg-surface-muted text-ink-muted">
                                <Icon name="image" size={28} />
                            </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                            <button type="button" className="btn-outline" onClick={() => setMediaOpen(true)}>
                                <Icon name="image" size={16} /> {preview ? 'Ganti Sampul' : 'Pilih Sampul'}
                            </button>
                            {preview && (
                                <button
                                    type="button"
                                    className="btn-outline text-red-500"
                                    onClick={() => {
                                        setPreview('');
                                        setForm({ ...form, image: null, media_id: '', image_mode: 'url', image_url: '', use_image_url: false });
                                    }}
                                >
                                    <Icon name="x" size={16} /> Hapus
                                </button>
                            )}
                        </div>
                        <p className="mt-2 text-xs text-ink-muted">
                            Ambil dari Media Library, upload baru, atau tempel URL. Kosongkan untuk memakai placeholder.
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
                        {errors.cover && <p className="mt-1 text-xs text-red-500">{errors.cover[0]}</p>}
                        {errors.image_url && <p className="mt-1 text-xs text-red-500">{errors.image_url[0]}</p>}
                    </Field>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Batal</button>
                        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
                    </div>
                </form>
            </Modal>

            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} />
            <MediaPicker open={mediaOpen} onClose={() => setMediaOpen(false)} onSelect={onMediaSelect} title="Pilih Sampul" />
            {node}
        </>
    );
}
