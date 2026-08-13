import { useEffect, useRef, useState } from 'react';
import api from '../../api';
import Icon from '../../components/Icon';
import { PageHeader, EmptyState, Confirm, useToast, Modal, ButtonSpinner } from '../../components/ui';
import Skeleton from '../../components/Skeleton';
import MediaViewModal from '../../components/MediaViewModal';
import MediaEditModal from '../../components/MediaEditModal';

const TABS = [
    { key: '', label: 'Semua', icon: 'images' },
    { key: 'image', label: 'Foto', icon: 'image' },
    { key: 'video', label: 'Video', icon: 'video' },
    { key: 'document', label: 'Dokumen', icon: 'file' },
];

export default function Media() {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [viewing, setViewing] = useState(null);
    const [editing, setEditing] = useState(null);
    const [sheet, setSheet] = useState(null);
    const [typeFilter, setTypeFilter] = useState('');
    const [selecting, setSelecting] = useState(false);
    const [selected, setSelected] = useState(new Set());
    const [bulkConfirm, setBulkConfirm] = useState(false);
    const fileRef = useRef(null);
    const { show, node } = useToast();

    const load = (page = 1) => {
        setLoading(true);
        api.get('/media', { params: { page, per_page: 24, type: typeFilter || undefined } })
            .then(({ data }) => {
                setItems(data.data);
                setMeta(data);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        setSelected(new Set());
        load(1);
    }, [typeFilter]);

    const toggleSelect = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (items.length && items.every((i) => next.has(i.id))) {
                items.forEach((i) => next.delete(i.id));
            } else {
                items.forEach((i) => next.add(i.id));
            }
            return next;
        });
    };

    const cancelSelect = () => {
        setSelecting(false);
        setSelected(new Set());
    };

    const upload = async (file) => {
        if (!file) return;
        setUploading(true);
        try {
            const data = new FormData();
            data.append('file', file);
            await api.post('/media', data);
            show('File diupload.');
            setUploadOpen(false);
            load(1);
        } catch (e) {
            const msg = e?.response?.data?.message || 'Gagal upload file.';
            show(msg, 'error');
        } finally {
            setUploading(false);
        }
    };

    const copyUrl = async (url) => {
        try {
            await navigator.clipboard.writeText(url);
            show('URL disalin.');
        } catch {
            show('Gagal menyalin URL.', 'error');
        }
    };

    const handleDelete = async () => {
        await api.delete(`/media/${deleting.id}`);
        show('File dihapus.');
        setDeleting(null);
        load(meta.current_page);
    };

    const handleBulkDelete = async () => {
        try {
            const res = await api.delete('/media/bulk', { data: { ids: [...selected] } });
            show(`${res.data.deleted} file dihapus.`);
            cancelSelect();
            load(meta.current_page);
        } catch (e) {
            show('Gagal menghapus file.', 'error');
        } finally {
            setBulkConfirm(false);
        }
    };

    const handleSaved = (updated) => {
        setItems((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        if (viewing?.id === updated.id) setViewing(updated);
    };

    return (
        <>
            <PageHeader
                title="Media"
                subtitle="Kumpulan file yang bisa dipakai di seluruh situs."
                action={
                    <button className="btn-primary" onClick={() => setUploadOpen(true)}>
                        <Icon name="upload" size={16} /> Upload Media
                    </button>
                }
            />

            <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-line pb-4">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setTypeFilter(tab.key)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                            typeFilter === tab.key ? 'bg-brand-600 text-white' : 'bg-surface-muted text-ink-muted hover:text-ink'
                        }`}
                    >
                        <Icon name={tab.icon} size={16} /> <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
                {selecting ? (
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        <button
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                            onClick={toggleSelectAll}
                            title={items.length && items.every((i) => selected.has(i.id)) ? 'Batal pilih semua' : 'Pilih semua'}
                        >
                            <Icon name={items.length && items.every((i) => selected.has(i.id)) ? 'check-square' : 'square'} size={16} />
                            <span className="hidden sm:inline">{items.length && items.every((i) => selected.has(i.id)) ? 'Batal pilih semua' : 'Pilih semua'}</span>
                        </button>
                        <button
                            className="inline-flex items-center rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-40"
                            disabled={selected.size === 0}
                            onClick={() => setBulkConfirm(true)}
                            title={`Hapus ${selected.size} file`}
                        >
                            <Icon name="trash" size={18} /> <span className="text-sm font-semibold">({selected.size})</span>
                        </button>
                        <button className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink" onClick={cancelSelect} title="Batal">
                            <Icon name="x" size={18} />
                        </button>
                    </div>
                ) : (
                    <button
                        className="ml-auto inline-flex items-center gap-1.5 rounded-lg p-1.5 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-500/10 dark:text-brand-400"
                        onClick={() => setSelecting(true)}
                        title="Pilih"
                    >
                        <Icon name="check-square" size={18} /> <span className="hidden sm:inline">Pilih</span>
                    </button>
                )}
            </div>

            <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Media">
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
                    <p className="mt-1 text-sm text-ink-muted">Gambar, video, atau dokumen. Maks 100MB per file.</p>
                    <button className="btn-primary mt-4 inline-flex items-center gap-2" disabled={uploading} onClick={() => fileRef.current?.click()}>
                        {uploading && <ButtonSpinner />}
                        <Icon name="upload" size={16} /> Pilih File
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                            upload(e.target.files[0]);
                            e.target.value = '';
                        }}
                    />
                </div>
            </Modal>

            {loading ? (
                <Skeleton variant="card" />
            ) : items.length ? (
                <>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                        {items.map((item) => {
                            const isSelected = selected.has(item.id);
                            return (
                                <div
                                    key={item.id}
                                    className={`card group overflow-hidden ${selecting ? (isSelected ? 'ring-2 ring-brand-600' : '') : ''}`}
                                    onClick={selecting ? () => toggleSelect(item.id) : undefined}
                                >
                                    <div className="relative aspect-square overflow-hidden">
                                        {item.type === 'image' ? (
                                            <img src={item.url} alt={item.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                        ) : item.type === 'video' ? (
                                            <div className="h-full w-full">
                                                <video src={item.url} muted preload="metadata" className="h-full w-full object-cover" />
                                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white">
                                                        <Icon name="video" size={18} />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-surface-muted text-ink-muted">
                                                <Icon name={item.mime_type === 'application/pdf' ? 'file' : 'file'} size={28} />
                                            </div>
                                        )}
                                        {selecting ? (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSelect(item.id);
                                                }}
                                                className={`absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md border-2 shadow transition-colors ${
                                                    isSelected ? 'border-brand-600 bg-brand-600 text-white' : 'border-white bg-white/80 text-transparent'
                                                }`}
                                                aria-label="Pilih"
                                            >
                                                <Icon name="check" size={14} />
                                            </button>
                                        ) : (
                                            <>
                                                <div className="absolute inset-0 hidden items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 md:flex">
                                                    <button onClick={() => setViewing(item)} className="rounded-lg bg-white p-2 text-zinc-900" title="Lihat">
                                                        <Icon name="eye" size={16} />
                                                    </button>
                                                    <button onClick={() => copyUrl(item.url)} className="rounded-lg bg-white p-2 text-zinc-900" title="Salin URL">
                                                        <Icon name="link" size={16} />
                                                    </button>
                                                    <button onClick={() => setDeleting(item)} className="rounded-lg bg-red-500 p-2 text-white" title="Hapus">
                                                        <Icon name="trash" size={16} />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => setSheet(item)}
                                                    className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-zinc-700 shadow transition-colors hover:bg-white md:hidden"
                                                    title="Aksi"
                                                >
                                                    <Icon name="more-horizontal" size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    <div className="truncate px-2 py-1.5 text-xs text-ink-muted">{item.file_name}</div>
                                </div>
                            );
                        })}
                    </div>

                    {meta.last_page > 1 && (
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
                </>
            ) : (
                <EmptyState title="Belum ada media" message="Upload file pertama Anda." />
            )}

            {sheet && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="animate-fade-in absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={() => setSheet(null)} />
                    <div className="animate-sheet-up absolute inset-x-0 bottom-0 max-h-[80vh] flex-col overflow-hidden rounded-t-2xl border border-b-0 border-line bg-white shadow-xl shadow-black/5 dark:bg-zinc-900">
                        <div className="flex items-center justify-between border-b border-line px-4 py-3">
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-ink">{sheet.name}</p>
                                <p className="truncate text-xs text-ink-muted">{sheet.file_name}</p>
                            </div>
                            <button onClick={() => setSheet(null)} aria-label="Tutup" className="rounded-lg p-1 text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink">
                                <Icon name="x" size={16} />
                            </button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto">
                            <button
                                className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left text-sm text-ink transition-colors hover:bg-surface-muted"
                                onClick={() => {
                                    setViewing(sheet);
                                    setSheet(null);
                                }}
                            >
                                <Icon name="eye" size={18} /> Lihat
                            </button>
                            <button
                                className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left text-sm text-ink transition-colors hover:bg-surface-muted"
                                onClick={() => {
                                    copyUrl(sheet.url);
                                    setSheet(null);
                                }}
                            >
                                <Icon name="link" size={18} /> Salin URL
                            </button>
                            <button
                                className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left text-sm text-red-600 transition-colors hover:bg-surface-muted"
                                onClick={() => {
                                    setDeleting(sheet);
                                    setSheet(null);
                                }}
                            >
                                <Icon name="trash" size={18} /> Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title="Hapus file?" message="File ini akan dihapus dari server." />
            <Confirm
                open={bulkConfirm}
                onClose={() => setBulkConfirm(false)}
                onConfirm={handleBulkDelete}
                title="Hapus file terpilih?"
                message={`${selected.size} file akan dihapus dari server.`}
            />

            <MediaViewModal open={!!viewing} item={viewing} onClose={() => setViewing(null)} onEdit={(item) => setEditing(item)} onCopyUrl={copyUrl} />
            <MediaEditModal open={!!editing} item={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />
            {node}
        </>
    );
}
