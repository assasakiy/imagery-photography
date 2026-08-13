import { useEffect, useState } from 'react';
import api from '../../api';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import MediaPicker from '../../components/MediaPicker';
import RichEditor from '../../components/RichEditor';
import { PageHeader, Field, useToast } from '../../components/ui';
import Skeleton from '../../components/Skeleton';

const FIELD_SECTIONS = [
    { group: 'hero', title: 'Hero', fields: [
        { key: 'hero_title', label: 'Judul Utama', type: 'text', required: true },
        { key: 'hero_subtitle', label: 'Subjudul', type: 'mini' },
    ]},
    { group: 'about', title: 'Tentang', fields: [
        { key: 'about_title', label: 'Judul', type: 'text', required: true },
        { key: 'about_content', label: 'Konten', type: 'full' },
        { key: 'about_history', label: 'Sejarah / Perjalanan', type: 'full', hint: 'tampil di halaman Tentang sebelum tim' },
    ]},
    { group: 'gallery', title: 'Galeri', fields: [
        { key: 'gallery_intro', label: 'Pendahuluan Galeri', type: 'full' },
    ]},
    { group: 'services', title: 'Layanan', fields: [
        { key: 'services_intro', label: 'Pendahuluan Layanan', type: 'full' },
    ]},
    { group: 'contact', title: 'Kontak', fields: [
        { key: 'contact_address', label: 'Alamat', type: 'text' },
        { key: 'contact_phone', label: 'Telepon', type: 'text' },
        { key: 'contact_email', label: 'Email', type: 'text' },
    ]},
    { group: 'social', title: 'Sosial Media', fields: [
        { key: 'social_facebook', label: 'Facebook URL', type: 'url' },
        { key: 'social_instagram', label: 'Instagram URL', type: 'url' },
        { key: 'social_tiktok', label: 'TikTok URL', type: 'url' },
        { key: 'social_whatsapp', label: 'WhatsApp URL', type: 'url' },
    ]},
];

const IMAGE_FIELDS = [
    { key: 'hero_image', label: 'Gambar Hero' },
    { key: 'about_image', label: 'Gambar Tentang' },
];

function fieldInput(f, value, onChange) {
    if (f.type === 'text' || f.type === 'url') {
        return (
            <input
                className="input"
                type={f.type === 'url' ? 'url' : 'text'}
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value)}
            />
        );
    }
    if (f.type === 'mini') {
        return <RichEditor variant="mini" value={value ?? ''} onChange={onChange} minHeight={100} maxHeight={200} />;
    }
    return <RichEditor variant="full" value={value ?? ''} onChange={onChange} minHeight={180} maxHeight={420} />;
}

export default function Landing() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [content, setContent] = useState({});
    const [baseContent, setBaseContent] = useState({});
    const [images, setImages] = useState({});
    const [reset, setReset] = useState({});
    const [mediaOpenFor, setMediaOpenFor] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [baseTimeline, setBaseTimeline] = useState('[]');
    const { show, node } = useToast();

    useEffect(() => {
        api.get('/landing')
            .then(({ data }) => {
                setData(data);
                const flat = {};
                FIELD_SECTIONS.forEach((section) => {
                    section.fields.forEach((f) => {
                        flat[f.key] = data[section.group]?.[f.key] ?? '';
                    });
                });
                setContent(flat);
                setBaseContent(flat);
                try {
                    const raw = data.about?.about_timeline;
                    const arr = raw ? JSON.parse(raw) : [];
                    setTimeline(arr);
                    setBaseTimeline(JSON.stringify(arr));
                } catch {
                    setTimeline([]);
                    setBaseTimeline('[]');
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const contentDirty = Object.keys(baseContent).some((k) => JSON.stringify(content[k] ?? '') !== JSON.stringify(baseContent[k] ?? ''));
    const timelineDirty = JSON.stringify(timeline) !== baseTimeline;
    const mediaDirty = Object.keys(images).length > 0 || Object.keys(reset).length > 0;
    const dirty = contentDirty || timelineDirty || mediaDirty;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const form = new FormData();
            Object.entries(content).forEach(([key, value]) => {
                form.append(`content[${key}]`, value ?? '');
            });
            form.append('content[about_timeline]', JSON.stringify(timeline));

            IMAGE_FIELDS.forEach(({ key }) => {
                if (images[key]) {
                    const sel = images[key];
                    form.append(`content[${key}]`, sel.source === 'url' ? sel.url : `media:${sel.mediaId}`);
                }
                if (reset[key]) form.append(`reset_images[${key}]`, '1');
            });
            await api.post('/landing', form, { headers: { 'Content-Type': 'multipart/form-data' } });
            show('Konten beranda disimpan.');
            setReset({});
            setImages({});
            const reload = await api.get('/landing');
            setData(reload.data);
            const flat = {};
            FIELD_SECTIONS.forEach((section) => {
                section.fields.forEach((f) => {
                    flat[f.key] = reload.data[section.group]?.[f.key] ?? '';
                });
            });
            setContent(flat);
            setBaseContent(flat);
            try {
                const arr = JSON.parse(reload.data.about?.about_timeline || '[]');
                setTimeline(arr);
                setBaseTimeline(JSON.stringify(arr));
            } catch {
                setTimeline([]);
                setBaseTimeline('[]');
            }
        } catch (err) {
            show('Gagal menyimpan. Periksa kembali input Anda.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const onMediaSelect = (sel) => {
        if (!mediaOpenFor) return;
        setImages({ ...images, [mediaOpenFor]: sel });
        setMediaOpenFor(null);
    };

    const updateTimeline = (i, field, value) => {
        setTimeline(timeline.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));
    };

    return (
        <>
            <PageHeader title="Landing" subtitle="Atur konten halaman beranda. Branding (logo, favicon, tagline, deskripsi) ada di Pengaturan." />

            {loading ? (
                <Skeleton variant="form" />
            ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        {FIELD_SECTIONS.map((section) => (
                            <div key={section.group} className="card p-5">
                                <h2 className="mb-4 font-semibold text-ink">{section.title}</h2>
                                <div className="space-y-4">
                                    {section.fields.map((f) => (
                                        <Field key={f.key} label={f.label} required={f.required} hint={f.hint}>
                                            {fieldInput(f, content[f.key], (v) => setContent({ ...content, [f.key]: v }))}
                                        </Field>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="card p-5">
                            <h2 className="mb-1 font-semibold text-ink">Timeline Perjalanan</h2>
                            <p className="mb-4 text-xs text-ink-muted">Tampil di halaman Tentang (tahun + keterangan).</p>
                            <div className="space-y-3">
                                {timeline.map((t, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <input
                                            className="input w-28 shrink-0"
                                            placeholder="2020"
                                            value={t.year || ''}
                                            onChange={(e) => updateTimeline(i, 'year', e.target.value)}
                                        />
                                        <input
                                            className="input flex-1"
                                            placeholder="Keterangan…"
                                            value={t.text || ''}
                                            onChange={(e) => updateTimeline(i, 'text', e.target.value)}
                                        />
                                        <Button size="sm" variant="ghost" icon="trash" onClick={() => setTimeline(timeline.filter((_, idx) => idx !== i))}>
                                            Hapus
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="outline" icon="plus" onClick={() => setTimeline([...timeline, { year: '', text: '' }])}>
                                    Tambah titik
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="card p-5">
                            <h2 className="mb-4 font-semibold text-ink">Gambar</h2>
                            <p className="mb-4 text-xs text-ink-muted">
                                Pilih dari Media Library, upload baru, atau tempel URL.
                            </p>
                            {IMAGE_FIELDS.map(({ key, label }) => {
                                const current = images[key];
                                const preview = current?.url || data.images?.[key] || '';
                                return (
                                    <div key={key} className="mb-5">
                                        <label className="label">{label}</label>
                                        <div className="overflow-hidden rounded-xl border border-line">
                                            {preview ? (
                                                <img src={preview} alt={label} className="h-32 w-full object-cover" />
                                            ) : (
                                                <div className="flex h-32 w-full items-center justify-center bg-surface-muted text-ink-muted">
                                                    <Icon name="image" size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <Button size="sm" variant="outline" icon="image" onClick={() => setMediaOpenFor(key)}>
                                                {current ? 'Ganti' : 'Pilih'}
                                            </Button>
                                            {current && (
                                                <Button size="sm" variant="ghost" icon="x" onClick={() => setImages({ ...images, [key]: null })}>
                                                    Batalkan
                                                </Button>
                                            )}
                                        </div>
                                        <label className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
                                            <input
                                                type="checkbox"
                                                checked={!!reset[key]}
                                                onChange={(e) => setReset({ ...reset, [key]: e.target.checked })}
                                            />
                                            Kembalikan ke gambar default
                                        </label>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" icon="check" loading={saving} disabled={!dirty}>
                        {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
                    </Button>
                </div>
            </form>
            )}

            <MediaPicker
                open={!!mediaOpenFor}
                onClose={() => setMediaOpenFor(null)}
                onSelect={onMediaSelect}
                title={mediaOpenFor ? `Pilih ${IMAGE_FIELDS.find((f) => f.key === mediaOpenFor)?.label}` : 'Pilih Media'}
            />
            {node}
        </>
    );
}