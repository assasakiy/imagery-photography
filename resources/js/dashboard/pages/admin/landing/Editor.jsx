import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api';
import Icon from '../../../components/Icon';
import MediaPicker from '../../../components/MediaPicker';
import RichEditor from '../../../components/RichEditor';
import { PageHeader, Field, useToast } from '../../../components/ui';
import { normalizeBlogSections, normalizeGallerySections, normalizeSections } from './sections/normalize';
import BlogGallerySections from './sections/BlogGallerySections';
import FaqSections from './sections/FaqSections';
import HeroSection from './sections/HeroSection';
import HomeSections from './sections/HomeSections';
import KontakSections from './sections/KontakSections';
import LayananSections from './sections/LayananSections';
import TentangSections from './sections/TentangSections';

export default function Editor() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({});
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [mediaOpenFor, setMediaOpenFor] = useState(null);
    const [options, setOptions] = useState(null);
    const [blogCounts, setBlogCounts] = useState(null);
    const { show, node } = useToast();

    const updateSection = (sectionType, field, val) => {
        const newSections = { ...form.sections };
        if (!newSections[sectionType]) newSections[sectionType] = { type: sectionType };
        newSections[sectionType] = { ...newSections[sectionType], [field]: val };
        setForm({ ...form, sections: newSections });
    };

    const updateSectionMode = (sectionType, mode) => {
        const newSections = { ...form.sections };
        if (!newSections[sectionType]) newSections[sectionType] = { type: sectionType };
        newSections[sectionType] = {
            ...newSections[sectionType],
            mode,
            items: mode === 'ids' ? (newSections[sectionType].items || []) : [],
            categories: mode === 'category' ? (newSections[sectionType].categories || []) : [],
        };
        setForm({ ...form, sections: newSections });
    };

    const reviewIdsFor = (criteria) => (options?.reviews || []).filter((r) => criteria(r.rating)).map((r) => r.id);

    const setReviewsMode = (mode) => {
        const sec = { ...(form.sections.reviews || {}), mode };
        if (mode === 'all') sec.all_ratings = [1, 2, 3, 4, 5];
        if (mode === 'star') {
            sec.star = Number(sec.star) || 5;
            sec.items = reviewIdsFor((rating) => rating === sec.star);
        }
        if (mode === 'above') {
            sec.min_star = Number(sec.min_star) || 3;
            sec.items = reviewIdsFor((rating) => rating >= sec.min_star);
        }
        setForm({ ...form, sections: { ...form.sections, reviews: sec } });
    };

    const toggleReviewRating = (rating) => {
        const sec = { ...(form.sections.reviews || {}) };
        const arr = sec.all_ratings || [1, 2, 3, 4, 5];
        sec.all_ratings = arr.includes(rating) ? arr.filter((r) => r !== rating) : [...arr, rating];
        setForm({ ...form, sections: { ...form.sections, reviews: sec } });
    };

    const setReviewStar = (star) => {
        const sec = { ...(form.sections.reviews || {}), star: Number(star), items: reviewIdsFor((rating) => rating === Number(star)) };
        setForm({ ...form, sections: { ...form.sections, reviews: sec } });
    };

    const setReviewsMinStar = (min) => {
        const sec = { ...(form.sections.reviews || {}), min_star: Number(min), items: reviewIdsFor((rating) => rating >= Number(min)) };
        setForm({ ...form, sections: { ...form.sections, reviews: sec } });
    };

    const toggleReviewItem = (id) => {
        const sec = { ...(form.sections.reviews || {}) };
        const items = sec.items || [];
        sec.items = items.includes(id) ? items.filter((i) => i !== id) : [...items, id];
        setForm({ ...form, sections: { ...form.sections, reviews: sec } });
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
        api.get('/landing/options')
            .then(({ data }) => setOptions(data))
            .catch(() => setOptions(null));

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
                    button2_text: data.button2_text || '',
                    button2_link: data.button2_link || '',
                    content: data.content || '',
                    published: !!data.published,
                };

                if (data.slug === 'home') {
                    const sections = normalizeSections(data.sections);
                    initialForm.sections = sections;
                    initialForm.images = data.images || {};
                    initialForm.image_urls = data.image_urls || {};
                    initialForm.reset_images = {};
                }

                if (data.slug === 'tentang') {
                    initialForm.sections = normalizeSections(data.sections);
                    initialForm.images = data.images || {};
                    initialForm.image_urls = data.image_urls || {};
                    initialForm.reset_images = {};
                }

                if (data.slug === 'faq-page') {
                    initialForm.sections = normalizeSections(data.sections);
                }

                if (data.slug === 'blog') {
                    initialForm.sections = normalizeBlogSections(data.sections);
                }

                if (data.slug === 'gallery') {
                    initialForm.sections = normalizeGallerySections(data.sections);
                }

                if (data.slug === 'services') {
                    initialForm.sections = normalizeSections(data.sections);
                }

                if (data.slug === 'contact') {
                    const sec = normalizeSections(data.sections).kontak || {};
                    const rawSocials = sec.socials || {};
                    const socials = Array.isArray(rawSocials)
                        ? rawSocials
                        : [
                            ...Object.entries(rawSocials).filter(([k, v]) => !['extra'].includes(k) && v).map(([k, v]) => ({ type: k, label: k, url: v })),
                            ...(Array.isArray(rawSocials.extra) ? rawSocials.extra : []),
                        ];
                    initialForm.contact = {
                        phone: sec.phone || '',
                        email: sec.email || '',
                        address: sec.address || '',
                        socials: socials || [],
                        map_url: sec.map_url || '',
                    };
                }

                if (data.slug === 'blog') {
                    api.get('/blog/counts')
                        .then(({ data: c }) => setBlogCounts(c))
                        .catch(() => setBlogCounts(null));
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            if (form.slug === 'home' || form.slug === 'tentang') {
                const formData = new FormData();
                formData.append('_method', 'PUT');
                formData.append('title', form.title || '');
                formData.append('description', form.description || '');
                formData.append('hero_title', form.hero_title || '');
                formData.append('hero_subtitle', form.hero_subtitle || '');
                formData.append('badge', form.badge || '');
                formData.append('button_text', form.button_text || '');
                formData.append('button_link', form.button_link || '');
                formData.append('button2_text', form.button2_text || '');
                formData.append('button2_link', form.button2_link || '');
                formData.append('published', form.published ? '1' : '0');
                formData.append('content', form.content || '');

                if (form.slug === 'home') {
                    const cleanAbout = { ...(form.sections.about || {}) };
                    ['subtitle', 'title', 'content'].forEach((k) => {
                        const v = cleanAbout[k];
                        if (typeof v === 'string' && !v.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim()) {
                            cleanAbout[k] = undefined;
                        }
                    });
                    const cleanLayanan = { ...(form.sections.layanan || {}) };
                    if (typeof cleanLayanan.description === 'string' && !cleanLayanan.description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim()) {
                        cleanLayanan.description = undefined;
                    }

                    const sections = [
                        { type: 'hero', ...form.sections.hero },
                        { type: 'about', ...cleanAbout },
                        { type: 'reviews', ...form.sections.reviews },
                        { type: 'faq', ...form.sections.faq },
                        { type: 'stats', ...form.sections.stats },
                        { type: 'karya', ...form.sections.karya },
                        { type: 'layanan', ...cleanLayanan },
                        { type: 'blog', ...form.sections.blog },
                        { type: 'cta', ...form.sections.cta },
                    ];
                    formData.append('sections', JSON.stringify(sections));
                } else {
                    const cleanCerita = { ...(form.sections.cerita || {}) };
                    if (typeof cleanCerita.content === 'string' && !cleanCerita.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim()) {
                        cleanCerita.content = undefined;
                    }
                    const cleanPerjalanan = { ...(form.sections.perjalanan || {}) };
                    if (typeof cleanPerjalanan.history === 'string' && !cleanPerjalanan.history.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim()) {
                        cleanPerjalanan.history = undefined;
                    }

                    const cleanTim = { ...(form.sections.tim || {}) };
                    const rawMembers = Array.isArray(cleanTim.members) ? cleanTim.members : [];
                    cleanTim.members = rawMembers.filter((m) => {
                        if (m?.show === false) return true;
                        return ['name', 'position', 'bio', 'photo_url', 'social_facebook', 'social_instagram', 'social_tiktok', 'social_whatsapp'].some((k) => typeof m?.[k] === 'string' && m[k].trim() !== '');
                    });

                    const sections = [
                        { type: 'cerita', ...cleanCerita },
                        { type: 'perjalanan', ...cleanPerjalanan },
                        { type: 'timeline', data: form.sections.timeline?.data || [] },
                        { type: 'tim', ...cleanTim },
                        { type: 'karya', ...form.sections.karya },
                        { type: 'stats', ...form.sections.stats },
                    ];
                    formData.append('sections', JSON.stringify(sections));
                }

                const imageKeys = form.slug === 'home' ? ['hero_image', 'about_image'] : ['about_image'];
                if (form.images) {
                    imageKeys.forEach((key) => {
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

                await api.post(`/pages/${form.slug}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                const payload = {
                    title: form.title,
                    description: form.description,
                    hero_title: form.hero_title || null,
                    hero_subtitle: form.hero_subtitle || null,
                    badge: form.badge || null,
                    button_text: form.button_text || null,
                    button_link: form.button_link || null,
                    button2_text: form.button2_text || null,
                    button2_link: form.button2_link || null,
                    content: form.content,
                    published: form.published,
                };

                if (form.slug === 'faq-page') {
                    payload.sections = [{ type: 'faq', ...form.sections.faq }];
                }

                if (form.slug === 'blog' || form.slug === 'gallery') {
                    payload.sections = form.sections;
                }

                if (form.slug === 'services') {
                    payload.sections = form.sections;
                }

                if (form.slug === 'contact') {
                    const c = form.contact || {};
                    payload.sections = [{
                        type: 'kontak',
                        phone: c.phone || '',
                        email: c.email || '',
                        address: c.address || '',
                        socials: (c.socials || []).filter((s) => s.url),
                        map_url: c.map_url || '',
                    }];
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
    const isFaqPage = form.slug === 'faq-page';
    const isBlog = form.slug === 'blog';
    const isGallery = form.slug === 'gallery';
    const isContact = form.slug === 'contact';
    const isServices = form.slug === 'services';
    const isLegal = form.slug === 'privacy' || form.slug === 'terms';

    const renderImageUploader = (imageKey, label) => {
        const preview = form.images?.[imageKey]?.url || form.image_urls?.[imageKey] || form.images?.[imageKey] || '';
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
                {!isLegal && <HeroSection form={form} isHome={isHome} errors={errors} setForm={setForm} renderImageUploader={renderImageUploader} />}

                {isHome && <HomeSections form={form} options={options} updateSection={updateSection} updateSectionMode={updateSectionMode} setReviewsMode={setReviewsMode} toggleReviewRating={toggleReviewRating} setReviewStar={setReviewStar} setReviewsMinStar={setReviewsMinStar} toggleReviewItem={toggleReviewItem} renderImageUploader={renderImageUploader} />}

                {isTentang && <TentangSections form={form} options={options} updateSection={updateSection} updateSectionMode={updateSectionMode} updateTimeline={updateTimeline} addTimelinePoint={addTimelinePoint} removeTimelinePoint={removeTimelinePoint} setForm={setForm} renderImageUploader={renderImageUploader} />}

                {isFaqPage && <FaqSections form={form} options={options} updateSection={updateSection} updateSectionMode={updateSectionMode} />}

                {(isBlog || isGallery) && <BlogGallerySections form={form} slug={form.slug} blogCounts={blogCounts} updateSection={updateSection} />}

                {isContact && <KontakSections form={form} setForm={setForm} />}

                {isServices && <LayananSections form={form} options={options} updateSection={updateSection} updateSectionMode={updateSectionMode} />}

                {!isHome && !isBlog && !isGallery && !isTentang && !isFaqPage && !isContact && !isServices && (
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