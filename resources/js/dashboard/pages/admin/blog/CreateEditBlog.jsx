import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../../api';
import Icon from '../../../components/Icon';
import RichEditor from '../../../components/RichEditor';
import MediaPicker from '../../../components/MediaPicker';
import { useToast, ButtonSpinner } from '../../../components/ui';
import { SkeletonForm } from '../../../components/ui/skeleton';
import SearchableMultiSelect from '../../../components/SearchableMultiSelect';
import CustomSelect from '../../../components/CustomSelect';

export default function CreateEditBlog() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [errors, setErrors] = useState({});
    const { show, node } = useToast();

const [form, setForm] = useState({
        title: '',
        content: '',
        excerpt: '',
        category_ids: [],
        status: 'draft',
        is_featured: false,
        tags: [],
        media_id: null,
    });
    
    const [tagInput, setTagInput] = useState('');
    const [catSearch, setCatSearch] = useState('');
    const [tagSearch, setTagSearch] = useState('');
    const [availableTags, setAvailableTags] = useState([]);
    const [coverPreview, setCoverPreview] = useState('');
    const [mediaOpen, setMediaOpen] = useState(false);

    useEffect(() => {
        api.get('/categories').then(({ data }) => setCategories(data.filter((c) => !c.is_system)));
        api.get('/blog-tags').then(({ data }) => setAvailableTags(data));

        if (isEdit) {
            api.get(`/blog/${id}`).then(({ data }) => {
                setForm({
                    title: data.title || '',
                    content: data.content || '',
                    excerpt: data.excerpt || '',
                    category_ids: data.categories?.map(c => c.id) || [],
                    status: data.status || 'draft',
                    is_featured: data.is_featured || false,
                    tags: data.tags?.map(t => t.name) || [],
                    media_id: data.media_id || null,
                });
                setCoverPreview(data.thumbnail_url || data.cover_url || data.image_url || '');
            }).catch(() => {
                show('Gagal memuat artikel', 'error');
                navigate('/dashboard/blog');
            }).finally(() => setLoading(false));
        }
    }, [id, isEdit]);

    const stripHtml = (html) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        let finalExcerpt = form.excerpt;
        if (!finalExcerpt || finalExcerpt.trim() === '') {
            const rawText = stripHtml(form.content);
            finalExcerpt = rawText.substring(0, 160).trim();
            if (rawText.length > 160) finalExcerpt += '...';
        }

        const payload = {
            ...form,
            excerpt: finalExcerpt,
            tags: JSON.stringify(form.tags),
        };

        try {
            if (isEdit) {
                await api.put(`/blog/${id}`, payload);
                show('Artikel berhasil diperbarui.');
            } else {
                await api.post('/blog', payload);
                show('Artikel berhasil diterbitkan.');
            }
            navigate('/dashboard/blog');
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                show(err.response?.data?.message || 'Gagal menyimpan artikel.', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const addTag = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = tagInput.trim();
            if (val && !form.tags.includes(val)) {
                setForm(f => ({ ...f, tags: [...f.tags, val] }));
            }
            setTagInput('');
        }
    };

    const removeTag = (t) => {
        setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }));
    };

    const onSelectCover = (sel) => {
        if (!sel) return;
        if (sel.source === 'library') {
            setForm(f => ({ ...f, media_id: sel.mediaId }));
            setCoverPreview(sel.url);
        } else {
            setForm(f => ({ ...f, media_id: null, image_url: sel.url }));
            setCoverPreview(sel.url);
        }
        setMediaOpen(false);
    };

    if (loading) return <SkeletonForm />;

    return (
        <div className="flex-1 overflow-y-auto bg-surface/50 scroll-smooth relative h-[calc(100vh-64px)] -mx-4 sm:-mx-6 lg:-mx-8 -my-6">
            <div className="mx-auto max-w-7xl animate-in fade-in duration-500 slide-in-from-bottom-4 p-4 lg:p-8">
                <div className="space-y-5">
                    {/* Header Bar */}
                    <div className="flex items-center justify-end md:justify-between w-full">
                        <div className="flex items-center gap-3">
                            <Link to="/dashboard/blog" className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface-muted transition-colors">
                                <Icon name="arrow-left" size={16} />
                            </Link>
                            <div className="hidden md:block">
                                <h1 className="text-xl font-semibold tracking-tight">{isEdit ? 'Edit Postingan' : 'Tulis Postingan'}</h1>
                                <p className="hidden lg:block text-sm text-ink-muted mt-0.5">{isEdit ? 'Perbarui konten postingan' : 'Buat konten baru untuk blog'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isEdit && (
                                <a href={`/blog/${id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 h-8 px-3 text-xs border border-line rounded-md text-ink-muted hover:text-ink hover:bg-surface-muted transition-all">
                                    <Icon name="eye" size={14} /> Preview
                                </a>
                            )}
                            <button
                                type="button"
                                onClick={submit}
                                disabled={saving || !form.title.trim() || !form.content.trim()}
                                className="inline-flex items-center justify-center font-medium rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:opacity-50 disabled:cursor-not-allowed bg-brand-600 text-white hover:bg-brand-700 border border-transparent shadow-sm px-4 py-2 text-sm gap-2 h-9"
                            >
                                {saving ? <ButtonSpinner /> : <Icon name="save" size={16} />}
                                {isEdit ? 'Perbarui Postingan' : 'Terbitkan Postingan'}
                            </button>
                        </div>
                    </div>

                    <form onSubmit={submit}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            
                            {/* Kiri: Konten Utama (Col-Span 2) */}
                            <div className="lg:col-span-2 space-y-5 flex flex-col">
                                <div className="flex flex-1 flex-col bg-surface border border-line rounded-md">
                                    <div className="flex flex-col space-y-1.5 p-4 border-b border-line">
                                        <h3 className="font-semibold flex items-center gap-2 text-sm">
                                            <span className="w-5 h-5 rounded bg-surface-muted flex items-center justify-center">
                                                <Icon name="file-text" size={12} className="text-ink-muted" />
                                            </span>
                                            Konten
                                        </h3>
                                    </div>
                                    <div className="p-4 space-y-4 flex flex-1 flex-col">
                                        <div className="space-y-1.5">
                                            <label htmlFor="judul" className="text-sm font-medium">Judul</label>
                                            <input
                                                id="judul"
                                                className={`flex h-9 w-full rounded-sm border ${errors.title ? 'border-red-500' : 'border-line'} bg-surface px-3 py-1 text-sm transition-colors placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50`}
                                                required
                                                placeholder="Masukkan judul postingan"
                                                value={form.title}
                                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                                autoFocus
                                            />
                                            {errors.title && <p className="text-xs text-red-500">{errors.title[0]}</p>}
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className="text-sm font-medium block">Cuplikan (Opsional)</label>
                                            </div>
                                            <div className="space-y-1.5">
                                                <textarea
                                                    className={`flex min-h-[80px] w-full rounded-sm border ${errors.excerpt ? 'border-red-500' : 'border-line'} bg-surface px-3 py-2 text-sm transition-colors placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50`}
                                                    placeholder="Ringkasan untuk keperluan SEO dan cuplikan blog..."
                                                    rows="2"
                                                    value={form.excerpt}
                                                    onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                                                />
                                            </div>
                                            <p className="text-xs text-ink-muted mt-1.5">Kosongkan untuk menghasilkan otomatis dari konten artikel.</p>
                                        </div>
                                        <div className="flex flex-1 flex-col">
                                            <label className="text-sm font-medium mb-1.5 block">Isi</label>
                                            <RichEditor
                                                value={form.content}
                                                onChange={(v) => setForm({ ...form, content: v })}
                                                className="flex-1"
                                            />
                                            {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content[0]}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Kanan: Sidebar Kanan */}
                            <div className="space-y-5">
                                {/* Publikasi */}
                                <div className="bg-surface border border-line rounded-md">
                                    <div className="flex flex-col space-y-1.5 p-4 border-b border-line">
                                        <h3 className="font-semibold flex items-center gap-2 text-sm">
                                            <span className="w-5 h-5 rounded bg-surface-muted flex items-center justify-center">
                                                <Icon name="save" size={12} className="text-ink-muted" />
                                            </span>
                                            Publikasi
                                        </h3>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium">Status</label>
                                            <select
                                                className="flex h-9 w-full items-center justify-between rounded-md border border-line bg-surface px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 hover:border-brand-500"
                                                value={form.status}
                                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                                            >
                                                <option value="draft">Draf</option>
                                                <option value="published">Terbit</option>
                                            </select>
                                        </div>
                                        <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
                                            <input
                                                className="w-4 h-4 rounded border-line text-brand-600 focus:ring-brand-600"
                                                type="checkbox"
                                                checked={form.is_featured}
                                                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                                            />
                                            <span>Postingan unggulan</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Gambar Unggulan */}
                                <div className="bg-surface border border-line rounded-md">
                                    <div className="flex flex-col space-y-1.5 p-4 border-b border-line">
                                        <h3 className="font-semibold flex items-center gap-2 text-sm">
                                            <span className="w-5 h-5 rounded bg-surface-muted flex items-center justify-center">
                                                <Icon name="image" size={12} className="text-ink-muted" />
                                            </span>
                                            Gambar Unggulan
                                        </h3>
                                    </div>
                                    <div className="p-4">
                                        {coverPreview ? (
                                            <div className="relative rounded-lg overflow-hidden border border-line group bg-surface-muted/30">
                                                <img alt="Thumbnail preview" className="w-full h-40 object-cover" src={coverPreview} />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCoverPreview('');
                                                        setForm({ ...form, media_id: null, image_url: null });
                                                    }}
                                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-surface/80 backdrop-blur-sm text-ink-muted hover:text-ink opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Icon name="x" size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setMediaOpen(true)}
                                                className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-surface-muted/50 text-ink-muted transition-colors hover:border-brand-500 hover:bg-brand-500/5 hover:text-brand-600"
                                            >
                                                <Icon name="upload" size={24} />
                                                <span className="text-sm font-semibold">Pilih Gambar</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Kategori & Tag */}
                                <div className="bg-surface border border-line rounded-md">
                                    <div className="flex flex-col space-y-1.5 p-4 border-b border-line">
                                        <h3 className="font-semibold flex items-center gap-2 text-sm">
                                            <span className="w-5 h-5 rounded bg-surface-muted flex items-center justify-center">
                                                <Icon name="folder" size={12} className="text-ink-muted" />
                                            </span>
                                            Kategori & Tag
                                        </h3>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div className="space-y-3">
                                            <p className="text-xs font-semibold text-ink-muted">Pilih Kategori</p>
                                            <SearchableMultiSelect 
                                                options={categories.map(c => ({ label: c.name, value: c.id }))}
                                                value={form.category_ids}
                                                onChange={ids => setForm({ ...form, category_ids: ids })}
                                                placeholder="Pilih kategori..."
                                                searchPlaceholder="Cari kategori..."
                                                emptyMessage="Kategori tidak ditemukan."
                                            />
                                            {form.category_ids && form.category_ids.length > 0 && (
                                                <div className="mt-3 p-3 bg-surface-muted border border-line rounded-md">
                                                    <p className="text-xs font-semibold text-ink-muted mb-2">Pilih Kategori Utama</p>
                                                    <CustomSelect
                                                        options={form.category_ids.map(id => {
                                                            const cat = categories.find(c => c.id === id);
                                                            return cat ? { label: cat.name, value: id } : null;
                                                        }).filter(Boolean)}
                                                        value={form.category_ids[0]}
                                                        onChange={(primaryId) => {
                                                            const otherIds = form.category_ids.filter(id => id !== primaryId);
                                                            setForm({ ...form, category_ids: [primaryId, ...otherIds] });
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="h-px bg-line my-3"></div>

                                        <div className="space-y-3">
                                            <p className="text-xs font-semibold text-ink-muted">Topik (Tag)</p>
                                            <SearchableMultiSelect 
                                                options={availableTags.map(t => ({ label: t.name, value: t.name }))}
                                                value={form.tags}
                                                onChange={tags => setForm({ ...form, tags: tags })}
                                                placeholder="Pilih atau tambah tag..."
                                                searchPlaceholder="Cari / Enter untuk tambah..."
                                                emptyMessage="Tidak ada tag terkait."
                                                allowCreate={true}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <MediaPicker
                open={mediaOpen}
                onClose={() => setMediaOpen(false)}
                onSelect={onSelectCover}
                title="Pilih Gambar Cover"
            />
            {node}
        </div>
    );
}