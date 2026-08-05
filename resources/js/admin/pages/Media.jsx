import { useEffect, useRef, useState } from 'react';
import api from '../api';
import Icon from '../components/Icon';
import { PageHeader, Spinner, EmptyState, Confirm, useToast, Modal, ButtonSpinner } from '../components/ui';

export default function Media() {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);
    const fileRef = useRef(null);
    const { show, node } = useToast();

    const load = (page = 1) => {
        setLoading(true);
        api.get('/media', { params: { page, per_page: 24 } })
            .then(({ data }) => {
                setItems(data.data);
                setMeta(data);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => load(), []);

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
                <Spinner />
            ) : items.length ? (
                <>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                        {items.map((item) => (
                            <div key={item.id} className="card group overflow-hidden">
                                <div className="relative aspect-square overflow-hidden">
                                    {item.type === 'image' ? (
                                        <img src={item.url} alt={item.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-surface-muted text-ink-muted">
                                            <Icon name={item.type === 'video' ? 'video' : 'file'} size={28} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                        <button onClick={() => copyUrl(item.url)} className="rounded-lg bg-white p-2 text-zinc-900" title="Salin URL">
                                            <Icon name="link" size={16} />
                                        </button>
                                        <button onClick={() => setDeleting(item)} className="rounded-lg bg-red-500 p-2 text-white" title="Hapus">
                                            <Icon name="trash" size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="truncate px-2 py-1.5 text-xs text-ink-muted">{item.file_name}</div>
                            </div>
                        ))}
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

            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} title="Hapus file?" message="File ini akan dihapus dari server." />
            {node}
        </>
    );
}
