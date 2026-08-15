import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api';
import Icon from '../../../components/Icon';
import MediaPicker from '../../../components/MediaPicker';
import RichEditor from '../../../components/RichEditor';
import { PageHeader, Field, useToast } from '../../../components/ui';

export default function Editor() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({});
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [mediaOpenFor, setMediaOpenFor] = useState(null);
    const { show, node } = useToast();

    const updateSection = (sectionType, field, val) => {
        const newSections = { ...form.sections };
        if (!newSections[sectionType]) newSections[sectionType] = { type: sectionType };
        newSections[sectionType] = { ...newSections[sectionType], [field]: val };
        setForm({ ...form, sections: newSections });
    };

    const updateStat = (idx, field, val) => {
        const about = { ...form.sections.about };
        about.stats = about.stats || [];
        about.stats[idx] = { ...about.stats[idx], [field]: val };
        setForm({ ...form, sections: { ...form.sections, about: about } });
    };

    const removeStat = (idx) => {
        const about = { ...form.sections.about };
        about.stats = about.stats.filter((_, i) => i !== idx);
        setForm({ ...form, sections: { ...form.sections, about: about } });
    };

    const addStat = () => {
        const about = { ...form.sections.about };
        about.stats = [...(about.stats || []), { label: '', value: '' }];
        setForm({ ...form, sections: { ...form.sections, about: about } });
    };

    const updateTimeline = (idx, tIdx, field, val) => {
        const newSecs = { ...form.sections };
        if (!newSecs.timeline) newSecs.timeline = { type: 'timeline', data: [] };
        const timelineData = [...(newSecs.timeline.data || [])];
        timelineData[tIdx] = { ...timelineData[tIdx], [field]: val };
        newSecs.timeline.data = timelineData;
        setForm({ ...form, sections: newSecs });
    };

    const addTimelinePoint = (idx) => {
        const newSecs = { ...form.sections };
        if (!newSecs.timeline) newSecs.timeline = { type: 'timeline', data: [] };
        const timelineData = [...(newSecs.timeline.data || []), { year: '', text: '' }];
        newSecs.timeline.data = timelineData;
        setForm({ ...form, sections: newSecs });
    };

    const removeTimelinePoint = (idx, tIdx) => {
        const newSecs = { ...form.sections };
        if (newSecs.timeline?.data) {
            const timelineData = newSecs.timeline.data.filter((_, i) => i !== tIdx);
            newSecs.timeline.data = timelineData;
            setForm({ ...form, sections: newSecs });
        }
    };

    useEffect(() => {
        setLoading(true);
        api.get(`/pages/${slug}`)
            .then(({ data }) => {
                let initialForm = {
                    id: data.id,
                    slug: data.slug,
                    title: data.title || '',
                    description: data.description || '',
                    hero_title: data.hero_title || '',
                    hero_subtitle: data.hero_subtitle || '',
                    badge: data.badge || '',
                    button_text: data.button_text || '',
                    button_link: data.button_link || '',
                    content: data.content || '',
                    published: !!data.published,
                };

                if (data.slug === 'home') {
                    const sections = normalizeSections(data.sections);
                    initialForm.sections = sections;
                    initialForm.images = data.images || {};
                    initialForm.reset_images = {};
                }

                if (data.slug === 'tentang') {
                    initialForm.sections = normalizeSections(data.sections);
                    const hs = Array.isArray(data.sections) ? data.sections.find((s) => s?.type === 'history') : null;
                    initialForm.history = (hs && typeof hs.text === 'string') ? hs.text : '';
                }

                if (data.slug === 'blog') {
                    initialForm.sections = normalizeBlogSections(data.sections);
                }

                if (data.slug === 'gallery') {
                    initialForm.sections = normalizeGallerySections(data.sections);
                }

                setForm(initialForm);
            })
            .catch(() => {
                show('Halaman tidak ditemukan', 'error');
                navigate('/dashboard/pages');
            })
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    const normalizeSections = (existing) => {
        const defaults = {
            hero: { type: 'hero', title: '', subtitle: '', button_text: '', button_link: '' },
            about: { type: 'about', subtitle: '', title: '', description: '', content: '', stats: [], button_text: '', button_link: '', image: '' },
            reviews: { type: 'reviews', subtitle: '', title: '', mode: '5star', limit: 6 },
            blog: { type: 'blog', subtitle: '', title: '', limit: 3 },
            cta: { type: 'cta', title: '', description: '', button_text: '', button_link: '' },
            timeline: { type: 'timeline', data: [] },
        };

        const normalized = { ...defaults };
        if (Array.isArray(existing)) {
            existing.forEach(sec => {
                if (sec.type && defaults[sec.type]) {
                    normalized[sec.type] = { ...defaults[sec.type], ...sec };
                }
            });
        }
        return normalized;
    };

    const normalizeBlogSections = (existing) => ({
        featured: { type: 'featured', label: 'Pilihan', title: 'Artikel Unggulan', subtitle: 'Pilihan Redaksi kami.', count: 4, ...(existing?.featured ?? {}) },
        latest: { type: 'latest', label: 'Terbaru', title: 'Artikel Terbaru', subtitle: 'Update terbaru dari kami.', count: 6, ...(existing?.latest ?? {}) },
        popular: { type: 'popular', label: 'Terpopuler', title: 'Artikel Populer', subtitle: 'Paling banyak dibaca.', count: 6, ...(existing?.popular ?? {}) },
        tags: { type: 'tags', label: 'Topik', title: 'Topik Populer', count: 12, ...(existing?.tags ?? {}) },
    });

    const normalizeGallerySections = (existing) => ({
        featured: { type: 'featured', label: 'Karya', title: 'Karya Unggulan', subtitle: 'Pilihan kami.', count: 6, ...(existing?.featured ?? {}) },
        latest: { type: 'latest', label: 'Galeri', title: 'Galeri Lengkap', count: 9, ...(existing?.latest ?? {}) },
        tags: { type: 'tags', label: 'Kategori', title: 'Kategori', count: 6, ...(existing?.tags ?? {}) },
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (form.slug === 'home') {
                const formData = new FormData();
                formData.append('_method', 'PUT');
                formData.append('title', form.title || '');
                formData.append('description', form.description || '');
                formData.append('hero_title', form.hero_title || '');
                formData.append('hero_subtitle', form.hero_subtitle || '');
                formData.append('badge', form.badge || '');
                formData.append('button_text', form.button_text || '');
                formData.append('button_link', form.button_link || '');
                formData.append('published', form.published ? '1' : '0');
                formData.append('content', form.content || '');

                const sections = [
                    { type: 'hero', ...form.sections.hero },
                    { type: 'about', ...form.sections.about },
                    { type: 'reviews', ...form.sections.reviews },
                    { type: 'blog', ...form.sections.blog },
                    { type: 'cta', ...form.sections.cta },
                ];
                sections.forEach((sec, i) => {
                    Object.entries(sec).forEach(([k, v]) => {
                        formData.append(`sections[${i}][${k}]`, v);
                    });
                });

                if (form.images) {
                    ['hero_image', 'about_image'].forEach((key) => {
                        const img = form.images[key];
                        if (img) {
                            if (img.source === 'url') {
                                formData.append(`images[${key}]`, img.url);
                            } else if (img.source === 'library') {
                                formData.append(`images[${key}]`, `media:${img.mediaId}`);
                            } else if (typeof img === 'string') {
                                formData.append(`images[${key}]`, img);
                            } else {
                                formData.append(`new_images[${key}]`, img);
                            }
                        }
                        if (form.reset_images?.[key]) {
                            formData.append(`reset_images[${key}]`, '1');
                        }
                    });
                }

                await api.put(`/pages/${form.slug}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                const payload = {
                    title: form.title,
                    description: form.description,
                    hero_title: form.hero_title || null,
                    hero_subtitle: form.hero_subtitle || null,
                    badge: form.badge || null,
                    button_text: form.button_text || null,
                    button_link: form.button_link || null,
                    content: form.content,
                    published: form.published,
                };

            if (form.slug === 'tentang') {
                const sections = [{ type: 'timeline', data: form.sections.timeline?.data || [] }];
                if (form.history != null && form.history !== '') {
                    sections.push({ type: 'history', text: form.history });
                }
                payload.sections = sections;
            }

            if (form.slug === 'blog' || form.slug === 'gallery') {
                payload.sections = form.sections;
            }

                await api.put(`/pages/${form.slug}`, payload);
            }

            show('Halaman diperbarui.');
            navigate('/dashboard/pages');
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
            else show('Gagal menyimpan.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-ink-muted">Memuat...</div>;

    const isHome = form.slug === 'home';
    const isTentang = form.slug === 'tentang';
    const isBlog = form.slug === 'blog';
    const isGallery = form.slug === 'gallery';

    const renderImageUploader = (imageKey, label) => {
        const preview = form.images?.[imageKey]?.url || form.images?.[imageKey] || '';
        return (
            <div className="card p-4">
                <label className="label">{label}</label>
                <div className="overflow-hidden rounded-xl border border-line mt-1">
                    {preview ? (
                        <img src={preview} alt={imageKey} className="h-40 w-full object-cover" />
                    ) : (
                        <div className="flex h-40 w-full items-center justify-center bg-surface-muted text-ink-muted">
                            <Icon name="image" size={24} />
                        </div>
                    )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                    <button type="button" className="btn-outline text-xs py-1.5 px-3" onClick={() => setMediaOpenFor(imageKey)}>Pilih Media</button>
                    {preview && (
                        <button type="button" className="btn-outline text-xs py-1.5 px-3 text-red-500" onClick={() => {
                            const newReset = { ...form.reset_images, [imageKey]: true };
                            const newImages = { ...form.images };
                            delete newImages[imageKey];
                            setForm({ ...form, images: newImages, reset_images: newReset });
                        }}>Hapus</button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            <PageHeader
                title={`Edit Halaman: ${form.title}`}
                subtitle="Sesuaikan konfigurasi dan isi section."
                onBack={() => navigate('/dashboard/pages')}
            />

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="card p-5 space-y-6">
                    <div>
                        <h3 className="font-bold text-xl text-ink border-b border-line pb-3">Section Hero / Title</h3>
                        <p className="mt-2 text-sm text-ink-muted">Judul kecil (badge/kategori halaman) tidak dapat diubah. SEO di-generate otomatis dari judul & deskripsi di bawah ini.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <Field label="Judul Besar" error={errors.hero_title?.[0]}>
                            <input className="input" value={form.hero_title || ''} onChange={(e) => setForm({ ...form, hero_title: e.target.value })} placeholder={isHome ? 'Judul situs (default)' : 'Judul halaman ini'} />
                        </Field>
                        <Field label="Judul Kecil (badge)" hint={form.slug === 'home' ? 'Default dari tagline situs' : 'Kunci halaman (mis. Galeri, Layanan)'}>
                            <input className="input" value={form.badge || ''} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder={isHome ? 'Photography & Videography' : (form.title || '')} disabled={!isHome} />
                        </Field>
                    </div>

                    <Field label={isHome ? 'Subjudul / Deskripsi' : 'Deskripsi'} error={errors.description?.[0]}>
                        {isHome ? (
                            <RichEditor variant="mini" value={form.hero_subtitle || ''} onChange={(val) => setForm({ ...form, hero_subtitle: val })} minHeight={100} maxHeight={200} />
                        ) : (
                            <textarea className="input min-h-[80px]" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        )}
                    </Field>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <Field label="Teks Tombol" hint="Kosongkan untuk tanpa tombol">
                            <input className="input" value={form.button_text || ''} onChange={(e) => setForm({ ...form, button_text: e.target.value })} placeholder="Lihat Galeri" />
                        </Field>
                        <Field label="Link Tombol">
                            <input className="input" value={form.button_link || ''} onChange={(e) => setForm({ ...form, button_link: e.target.value })} placeholder="/gallery" />
                        </Field>
                    </div>

                    {isHome && (
                        <Field label="Gambar Latar / BG Hero">
                            {renderImageUploader('hero_image', 'Gambar Hero')}
                        </Field>
                    )}
                </div>

                    {isHome && (() => {
                        const about = form.sections.about || {};
                        const reviews = form.sections.reviews || {};
                        const blog = form.sections.blog || {};
                        const cta = form.sections.cta || {};

                        return (
                            <>
                                <div className="space-y-4 pt-4">
                                    <h3 className="font-bold text-xl text-ink border-b border-line pb-3">Section Tentang Kami</h3>
                                </div>
                                <div className="card p-5 space-y-6">
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <Field label="Subjudul">
                                            <input className="input" value={about.subtitle || ''} onChange={(e) => updateSection('about', 'subtitle', e.target.value)} />
                                        </Field>
                                        <Field label="Judul">
                                            <input className="input" value={about.title || ''} onChange={(e) => updateSection('about', 'title', e.target.value)} />
                                        </Field>
                                    </div>
                                    <Field label="Deskripsi Singkat (akan tampil di home, sync otomatis dari halaman Tentang jika kosong)">
                                        <textarea className="input min-h-[80px]" value={about.description || ''} onChange={(e) => updateSection('about', 'description', e.target.value)} />
                                    </Field>
                                    <Field label="Konten Penuh (sync otomatis dari halaman Tentang jika kosong)">
                                        <textarea className="input min-h-[120px]" value={about.content || ''} onChange={(e) => updateSection('about', 'content', e.target.value)} />
                                    </Field>
                                    <Field label="Gambar Tentang">
                                        {renderImageUploader('about_image', 'Gambar Tentang')}
                                    </Field>
                                    <Field label="Stats (ikon + angka)">
                                        <div className="space-y-3">
                                            {(about.stats || []).map((stat, idx) => (
                                                <div key={idx} className="flex gap-2 items-center">
                                                    <input className="input w-24" placeholder="Nilai (misal: 500+)" value={stat.value || ''} onChange={(e) => updateStat(idx, 'value', e.target.value)} />
                                                    <input className="input flex-1" placeholder="Label (misal: Momen Terabadikan)" value={stat.label || ''} onChange={(e) => updateStat(idx, 'label', e.target.value)} />
                                                    <button type="button" className="btn-outline text-red-500 !px-2" onClick={() => removeStat(idx)}><Icon name="trash" size={14}/> Hapus</button>
                                                </div>
                                            ))}
                                            <button type="button" className="btn-outline text-sm" onClick={addStat}><Icon name="plus" size={14}/> Tambah Stat</button>
                                        </div>
                                    </Field>
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <Field label="Teks Tombol">
                                            <input className="input" value={about.button_text || ''} onChange={(e) => updateSection('about', 'button_text', e.target.value)} />
                                        </Field>
                                        <Field label="Link Tombol">
                                            <input className="input" value={about.button_link || ''} onChange={(e) => updateSection('about', 'button_link', e.target.value)} />
                                        </Field>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <h3 className="font-bold text-xl text-ink border-b border-line pb-3">Section Testimonial</h3>
                                </div>
                                <div className="card p-5 space-y-6">
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <Field label="Subjudul">
                                            <input className="input" value={reviews.subtitle || ''} onChange={(e) => updateSection('reviews', 'subtitle', e.target.value)} />
                                        </Field>
                                        <Field label="Judul">
                                            <input className="input" value={reviews.title || ''} onChange={(e) => updateSection('reviews', 'title', e.target.value)} />
                                        </Field>
                                    </div>
                                    <Field label="Filter Tampilan Review">
                                        <select className="input" value={reviews.mode || '5star'} onChange={(e) => {
                                            const mode = e.target.value;
                                            updateSection('reviews', 'mode', mode);
                                            if (mode !== 'star_above') updateSection('reviews', 'minimum_stars', null);
                                        }}>
                                            <option value="all">Semua Review yang Published</option>
                                            <option value="5star">Hanya Review 5 Bintang</option>
                                            <option value="star_above">Bintang Di-atas X</option>
                                        </select>
                                    </Field>
                                    {reviews.mode === 'star_above' && (
                                        <Field label="Bintang Minimum">
                                            <select className="input" value={reviews.minimum_stars || 3} onChange={(e) => updateSection('reviews', 'minimum_stars', parseInt(e.target.value))}>
                                                <option value="1">&gt;= 1 Bintang</option>
                                                <option value="2">&gt;= 2 Bintang</option>
                                                <option value="3">&gt;= 3 Bintang</option>
                                                <option value="4">&gt;= 4 Bintang</option>
                                            </select>
                                        </Field>
                                    )}
                                    <Field label="Jumlah Review">
                                        <input type="number" className="input" value={reviews.limit || ''} onChange={(e) => updateSection('reviews', 'limit', e.target.value)} />
                                    </Field>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <h3 className="font-bold text-xl text-ink border-b border-line pb-3">Section Artikel Blog</h3>
                                </div>
                                <div className="card p-5 space-y-6">
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <Field label="Subjudul">
                                            <input className="input" value={blog.subtitle || ''} onChange={(e) => updateSection('blog', 'subtitle', e.target.value)} />
                                        </Field>
                                        <Field label="Judul">
                                            <input className="input" value={blog.title || ''} onChange={(e) => updateSection('blog', 'title', e.target.value)} />
                                        </Field>
                                    </div>
                                    <Field label="Jumlah Artikel">
                                        <input type="number" className="input" value={blog.limit || ''} onChange={(e) => updateSection('blog', 'limit', e.target.value)} />
                                    </Field>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <h3 className="font-bold text-xl text-ink border-b border-line pb-3">Section CTA</h3>
                                </div>
                                <div className="card p-5 space-y-6">
                                    <Field label="Judul">
                                        <input className="input" value={cta.title || ''} onChange={(e) => updateSection('cta', 'title', e.target.value)} />
                                    </Field>
                                    <Field label="Deskripsi">
                                        <textarea className="input min-h-[80px]" value={cta.description || ''} onChange={(e) => updateSection('cta', 'description', e.target.value)} />
                                    </Field>
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <Field label="Teks Tombol">
                                            <input className="input" value={cta.button_text || ''} onChange={(e) => updateSection('cta', 'button_text', e.target.value)} />
                                        </Field>
                                        <Field label="Link Tombol">
                                            <input className="input" value={cta.button_link || ''} onChange={(e) => updateSection('cta', 'button_link', e.target.value)} />
                                        </Field>
                                    </div>
                                </div>
                            </>
                        );
                    })()}

                    {isTentang && (() => {
                        const timelineSection = form.sections.timeline || { data: [] };
                        const timeline = timelineSection.data || [];
                        const historyText = form.history ?? '';

                        return (
                            <>
                                <div className="card p-5 space-y-4">
                                    <h3 className="font-bold text-xl text-ink border-b border-line pb-3">Sejarah Situs</h3>
                                    <Field label="Naratif Sejarah (opsional)" hint="Ditampilkan di halaman Tentang di bawah timeline.">
                                        <textarea className="input min-h-[100px]" placeholder="Cerita latar belakang situs dan tim..." value={historyText} onChange={e => setForm({ ...form, history: e.target.value })} />
                                    </Field>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <h3 className="font-bold text-xl text-ink border-b border-line pb-3">Timeline Perjalanan</h3>
                                    <div className="space-y-3">
                                        {timeline.map((t, tIdx) => (
                                            <div key={tIdx} className="flex gap-2 items-start bg-surface p-3 rounded-lg ring-1 ring-line">
                                                <input className="input w-28 shrink-0" placeholder="Tahun" value={t.year || ''} onChange={e => updateTimeline(0, tIdx, 'year', e.target.value)} />
                                                <textarea className="input flex-1 min-h-[42px]" rows="2" placeholder="Cerita / Keterangan" value={t.text || ''} onChange={e => updateTimeline(0, tIdx, 'text', e.target.value)} />
                                                <button type="button" className="btn-outline text-red-500 !px-3 !py-2 shrink-0" onClick={() => removeTimelinePoint(0, tIdx)} title="Hapus"><Icon name="trash" size={16}/></button>
                                            </div>
                                        ))}
                                        <button type="button" className="btn-outline text-sm mt-2" onClick={() => addTimelinePoint(0)}><Icon name="plus" size={16}/> Tambah Tahun</button>
                                    </div>
                                </div>
                            </>
                        );
                    })()}

                    {(isBlog || isGallery) && (() => {
                        const cfg = form.sections || {};
                        const isB = form.slug === 'blog';
                        const sections = isB
                            ? [
                                { key: 'featured', label: 'Section Artikel Unggulan', fields: ['label', 'title', 'subtitle'], count: true },
                                { key: 'latest', label: 'Section Artikel Terbaru', fields: ['label', 'title', 'subtitle'], count: true },
                                { key: 'popular', label: 'Section Artikel Populer', fields: ['label', 'title', 'subtitle'], count: true },
                                { key: 'tags', label: 'Section Topik', fields: ['label', 'title'], count: true },
                            ]
                            : [
                                { key: 'featured', label: 'Section Karya Unggulan', fields: ['label', 'title', 'subtitle'], count: true },
                                { key: 'latest', label: 'Section Galeri Terbaru', fields: ['label', 'title'], count: true },
                                { key: 'tags', label: 'Section Topik (Kategori)', fields: ['label', 'title'], count: true },
                            ];

                        const countOptions = (key) => {
                            if (key === 'featured') return isB ? [2, 4, 6, 8, 10] : [3, 6, 9];
                            if (key === 'latest' || key === 'popular') return [3, 6, 9];
                            if (key === 'tags') return [6, 12, 18];
                            return [2, 4, 6, 8, 10];
                        };

                        return (
                            <>
                                {sections.map((sec) => {
                                    const v = cfg[sec.key] || {};
                                    return (
                                        <div key={sec.key} className="space-y-4 pt-4">
                                            <h3 className="font-bold text-xl text-ink border-b border-line pb-3">{sec.label}</h3>
                                            <div className="card p-5 space-y-6">
                                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                                    {sec.fields.includes('label') && (
                                                        <Field label="Label (teks kapitalisasi atas)">
                                                            <input className="input" value={v.label || ''} onChange={(e) => updateSection(sec.key, 'label', e.target.value)} />
                                                        </Field>
                                                    )}
                                                    {sec.fields.includes('title') && (
                                                        <Field label="Judul Section">
                                                            <input className="input" value={v.title || ''} onChange={(e) => updateSection(sec.key, 'title', e.target.value)} />
                                                        </Field>
                                                    )}
                                                    {sec.fields.includes('subtitle') && (
                                                        <Field label="Subjudul">
                                                            <input className="input" value={v.subtitle || ''} onChange={(e) => updateSection(sec.key, 'subtitle', e.target.value)} />
                                                        </Field>
                                                    )}
                                                    {sec.count && (
                                                        <Field label="Jumlah Item yang Ditampilkan">
                                                            <select className="input" value={countOptions(sec.key).includes(Number(v.count)) ? v.count : countOptions(sec.key)[0]} onChange={(e) => updateSection(sec.key, 'count', e.target.value)}>
                                                                {countOptions(sec.key).map((o) => (
                                                                    <option key={o} value={o}>{o} Item</option>
                                                                ))}
                                                            </select>
                                                        </Field>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        );
                    })()}

                    {!isHome && !isBlog && !isGallery && !isTentang && (
                        <div className="card p-5 space-y-4">
                            <Field label="Isi Konten Utama" error={errors.content?.[0]}>
                                <RichEditor variant="full" value={form.content || ''} onChange={val => setForm({ ...form, content: val })} minHeight={400} maxHeight={800} />
                            </Field>
                        </div>
                    )}

                    <div className="card p-5 space-y-4">
                        <Field label="Visibilitas">
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                                <input
                                    type="checkbox"
                                    checked={form.published}
                                    onChange={(e) => setForm({ ...form, published: e.target.checked })}
                                    className="h-4 w-4 rounded border-line text-brand-600"
                                />
                                Tampilkan halaman ini untuk publik
                            </label>
                        </Field>

                        <div className="flex justify-end gap-3 pt-4 border-t border-line">
                            <button type="button" className="btn-outline" onClick={() => navigate('/dashboard/pages')}>Kembali</button>
                            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
                        </div>
                    </div>
            </form>

            <MediaPicker
                open={!!mediaOpenFor}
                onClose={() => setMediaOpenFor(null)}
                onSelect={sel => {
                    if (mediaOpenFor) {
                        setForm({ ...form, images: { ...form.images, [mediaOpenFor]: sel } });
                        setMediaOpenFor(null);
                    }
                }}
                title="Pilih Gambar"
            />
            {node}
        </>
    );
}
