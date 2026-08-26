import { useEffect, useRef, useState } from 'react';
import api from '../api';
import Icon from './Icon';
import { Modal, Spinner, EmptyState, ButtonSpinner } from './ui';
import { toast } from '../lib/toast';

const TABS = [
    { key: 'library', label: 'Media Library', icon: 'images' },
    { key: 'upload', label: 'Upload', icon: 'upload' },
    { key: 'url', label: 'URL', icon: 'link' },
];

export default function MediaPicker({ open, onClose, onSelect, title = 'Pilih Media', accept = 'image/*' }) {
    const [tab, setTab] = useState('library');
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [search, setSearch] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [urlText, setUrlText] = useState('');
    const [selected, setSelected] = useState(null);
    const fileRef = useRef(null);

    const loadLibrary = (page = 1) => {
        setLoading(true);
        api.get('/media', { params: { page, per_page: 24, type: 'image', q: search || undefined } })
            .then(({ data }) => {
                setItems(data.data);
                setMeta(data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (open) {
            setTab('library');
            setSelected(null);
            setUrlText('');
            setSearch('');
            loadLibrary(1);
        }
    }, [open]);

    const upload = async (file) => {
        if (!file) return;
        setUploading(true);
        try {
            const data = new FormData();
            data.append('file', file);
            const { data: media } = await api.post('/media', data);
            setSelected({ source: 'upload', mediaId: media.id, url: media.url, thumbnail_url: media.thumbnail_url });
            loadLibrary(1);
            toast.success('File diupload.');
        } catch (e) {
            const msg = e?.response?.data?.errors?.file?.[0] || e?.response?.data?.message || 'Gagal upload file.';
            console.error('[media-picker upload]', e?.response?.status, e?.response?.data);
            toast.error(msg);
        } finally {
            setUploading(false);
        }
    };

    const use = () => {
        if (!selected) return;
        onSelect?.(selected);
        onClose();
    };

    const importUrl = async () => {
        if (!urlText.trim()) return;
        setImporting(true);
        try {
            const { data: media } = await api.post('/media/import', { url: urlText.trim() });
            setSelected({ source: 'url', mediaId: media.id, url: media.url, thumbnail_url: media.thumbnail_url });
            loadLibrary(1);
            toast.success('Media diimpor ke Library.');
        } catch (e) {
            const msg = e?.response?.data?.message || 'Gagal mengimpor URL.';
            toast.error(msg);
        } finally {
            setImporting(false);
        }
    };

    const previewUrl = selected?.url || (tab === 'url' && urlText.trim());

    return (
        <Modal open={open} onClose={onClose} title={title} wide>
            <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-surface-muted p-1">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setTab(t.key)}
                        className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                            tab === t.key ? 'bg-surface text-ink shadow' : 'text-ink-muted hover:text-ink'
                        }`}
                    >
                        <Icon name={t.icon} size={16} />
                        <span className="hidden sm:inline">{t.label}</span>
                    </button>
                ))}
            </div>

            {tab === 'library' && (
                <>
                    <div className="mb-3 flex gap-2">
                        <div className="relative flex-1">
                            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                            <input
                                className="input pl-9"
                                placeholder="Cari media…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && loadLibrary(1)}
                            />
                        </div>
                        <button className="btn-outline" onClick={() => loadLibrary(1)}>Cari</button>
                    </div>

                    {loading ? (
                        <Spinner />
                    ) : items.length ? (
                        <>
                            <div className="grid max-h-[44vh] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4 md:grid-cols-5">
                                {items.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() =>
                                            setSelected({ source: 'library', mediaId: item.id, url: item.url, thumbnail_url: item.thumbnail_url })
                                        }
                                        className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-all ${
                                            selected?.mediaId === item.id ? 'border-brand-500 ring-2 ring-brand-500/30' : 'border-line'
                                        }`}
                                    >
                                        <img src={item.thumbnail_url || item.url} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
                                        {selected?.mediaId === item.id && (
                                            <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full action-surface">
                                                <Icon name="check" size={14} />
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            {meta.last_page > 1 && (
                                <div className="mt-4 flex items-center justify-between">
                                    <button className="btn-outline text-xs disabled:opacity-40" disabled={!meta.prev_page_url} onClick={() => loadLibrary(meta.current_page - 1)}>
                                        Sebelumnya
                                    </button>
                                    <span className="text-xs text-ink-muted">Hal {meta.current_page}/{meta.last_page}</span>
                                    <button className="btn-outline text-xs disabled:opacity-40" disabled={!meta.next_page_url} onClick={() => loadLibrary(meta.current_page + 1)}>
                                        Berikutnya
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <EmptyState title="Tidak ada media" message="Upload lewat tab Upload atau pakai URL." />
                    )}
                </>
            )}

            {tab === 'upload' && (
                <div
                    className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
                        dragOver ? 'border-brand-500 bg-brand-500/5' : 'border-line'
                    }`}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        upload(e.dataTransfer.files[0]);
                    }}
                >
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
                        <Icon name="upload" size={24} />
                    </div>
                    <p className="font-semibold text-ink">Seret file ke sini atau pilih file</p>
                    <p className="mt-1 text-sm text-ink-muted">Gambar yang diupload masuk ke Media Library.</p>
                    <button className="btn-primary mt-4 inline-flex items-center gap-2" disabled={uploading} onClick={() => fileRef.current?.click()}>
                        {uploading && <ButtonSpinner />}
                        <Icon name="upload" size={16} /> Pilih File
                    </button>
                    <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={(e) => upload(e.target.files[0])} />
                </div>
            )}

            {tab === 'url' && (
                <div className="space-y-3">
                    <div className="relative">
                        <Icon name="link" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                        <input
                            className="input pl-9"
                            placeholder="https://…/gambar.jpg"
                            value={urlText}
                            onChange={(e) => setUrlText(e.target.value)}
                        />
                    </div>
                    {previewUrl && (
                        <div className="flex items-center justify-center rounded-xl border border-line bg-surface-muted p-3">
                            <img
                                src={previewUrl}
                                alt="Pratinjau"
                                className="max-h-48 rounded-lg object-contain"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                        </div>
                    )}
                    <button
                        type="button"
                        className="btn-primary w-full disabled:opacity-40"
                        disabled={!urlText.trim() || importing}
                        onClick={importUrl}
                    >
                        {importing ? <ButtonSpinner /> : 'Impor & Gunakan'}
                        {!importing && <Icon name="link" size={16} className="ml-2" />}
                    </button>
                </div>
            )}

            {selected && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-surface-muted p-3">
                    <img src={selected.thumbnail_url || selected.url} alt="Pilihan" loading="lazy" decoding="async" className="h-14 w-14 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink">Media terpilih</p>
                        <p className="truncate text-xs text-ink-muted">{selected.url}</p>
                    </div>
                    <button className="btn-primary" onClick={use}>
                        <Icon name="check" size={16} /> Gunakan
                    </button>
                </div>
            )}
        </Modal>
    );
}
