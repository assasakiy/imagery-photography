import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import Icon from '../../components/Icon';
import { useAuth } from '../../context/AuthContext';
import { EmptyState, Modal, Confirm, Field, ButtonSpinner, formatDate, formatRupiah } from '../../components/ui';
import Skeleton from '../../components/Skeleton';
import { toast } from '../../lib/toast';
import { getApiErrorMessage } from '../../lib/errors';

function formatBytes(bytes) {
    if (bytes === null || bytes === undefined) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function PreviewDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const isAdmin = ['owner', 'admin'].includes(user?.role);
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selecting, setSelecting] = useState(false);
    const [selected, setSelected] = useState(new Set());
    const [viewing, setViewing] = useState(null);
    const [removing, setRemoving] = useState(null);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [requestOpen, setRequestOpen] = useState(false);
    const [requestNote, setRequestNote] = useState('');
    const [requesting, setRequesting] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [feeMap, setFeeMap] = useState({});
    const [saving, setSaving] = useState(false);

    const load = () => {
        setLoading(true);
        api.get('/customer/gallery', { params: { project_id: id } })
            .then(({ data }) => setProject(data[0] || null))
            .finally(() => setLoading(false));
    };

    useEffect(load, [id]);

    if (loading) return <Skeleton variant="form" />;
    if (!project) return <EmptyState title="Galeri tidak ditemukan" />;

    const files = (project.files || []).filter((f) => f.url);
    const canDownload = !isAdmin && !!project.is_paid;
    const archived = !!project.archived;
    const previewExpired = !!project.preview_expired;
    const phased = archived || previewExpired;
    const activeRedelivery = (project.redeliveries || []).some((r) => r.status === 'approved' && (!r.expires_at || new Date(r.expires_at) > new Date()));
    const pendingRedelivery = (project.redeliveries || []).some((r) => r.status === 'pending');
    const photoCount = (project.files || []).filter((f) => f.category === 'photo').length;
    const videoCount = (project.files || []).filter((f) => f.category === 'video').length;
    const allSelected = files.length > 0 && files.every((f) => selected.has(f.id));

    const toggleSelect = (fileId) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(fileId)) next.delete(fileId);
            else next.add(fileId);
            return next;
        });
    };

    const toggleSelectAll = () => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (allSelected) {
                files.forEach((f) => next.delete(f.id));
            } else {
                files.forEach((f) => next.add(f.id));
            }
            return next;
        });
    };

    const cancelSelect = () => {
        setSelecting(false);
        setSelected(new Set());
    };

    const copyText = async (text, label) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} disalin.`);
        } catch {
            toast.error('Gagal menyalin.');
        }
    };

    const copyLink = () => copyText(project.access_url || window.location.origin + `/dashboard/preview/${project.order_no || project.id}`, 'Link pratinjau');

    const downloadFile = (fileId) => {
        const a = document.createElement('a');
        a.href = `/api/files/${fileId}/download`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    const downloadSelected = () => {
        [...selected].forEach((fileId, i) => {
            setTimeout(() => downloadFile(fileId), i * 400);
        });
        toast.success(`${selected.size} file HD diunduh.`);
    };

    // Cek status dulu (fetch ringan); terus giliran unduh via href NATIVE (stream ke disk, bukan blob RAM).
    const startDownloadZip = async () => {
        if (downloading) return;
        setDownloading(true);
        try {
            for (let i = 0; i < 60; i++) {
                const { data } = await api.get(`/projects/${project.id}/download-status`);
                if (!data.ready) {
                    toast.error(data.message || 'Belum ada file untuk diunduh.');
                    return;
                }
                if (data.kind !== '') break;
                await new Promise((r) => setTimeout(r, 2000));
            }
            window.location.href = `/api/projects/${project.id}/download-zip`;
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal menyiapkan unduhan.'));
        } finally {
            setDownloading(false);
        }
    };

    const removeFile = (file) => {
        setRemoving(file);
    };

    const handleRemoveFile = async () => {
        if (!removing) return;
        try {
            await api.delete(`/files/${removing.id}`);
            toast.success('File dihapus.');
            setRemoving(null);
            load();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal menghapus file.'));
            setRemoving(null);
        }
    };

    const handleBulkDelete = async () => {
        try {
            await api.delete('/files/bulk', { data: { ids: [...selected] } });
            toast.success('File dihapus.');
            setBulkOpen(false);
            cancelSelect();
            load();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal menghapus file.'));
            setBulkOpen(false);
        }
    };

    const submitRedeliveryRequest = async () => {
        setRequesting(true);
        try {
            await api.post(`/projects/${project.id}/redelivery-requests`, { note: requestNote });
            toast.success('Permintaan unduh ulang dikirim. Admin akan meninjau.');
            setRequestOpen(false);
            setRequestNote('');
            load();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal mengirim permintaan.'));
        } finally {
            setRequesting(false);
        }
    };

    const reviewRedelivery = async (red, status) => {
        setSaving(true);
        try {
            await api.patch(`/redeliveries/${red.id}`, { status, fee: status === 'approved' ? Number(feeMap[red.id] || 0) : undefined });
            toast.success(status === 'approved' ? 'Permintaan disetujui — link akses dikirim.' : 'Permintaan ditolak.');
            load();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal mengubah permintaan.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Link to="/dashboard/preview" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand-600">
                <Icon name="arrow-left" size={16} /> Kembali ke Galeri
            </Link>

            <div className="card mb-5 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
<span className="rounded-lg bg-brand-500/15 px-2 py-0.5 font-mono text-xs font-bold text-brand-600 dark:text-brand-400">PSN-{project.order_no}</span>
                            {archived ? (
                                <span className="badge bg-zinc-500/15 text-zinc-600 dark:text-zinc-400"><Icon name="folder-open" size={12} /> Diarsipkan</span>
                            ) : previewExpired ? (
                                <span className="badge bg-amber-500/15 text-amber-600"><Icon name="clock" size={12} /> Preview Berakhir</span>
                            ) : project.is_paid ? (
                                <span className="badge bg-emerald-500/15 text-emerald-600"><Icon name="check" size={12} /> Lunas</span>
                            ) : (
                                <span className="badge bg-amber-500/15 text-amber-600">Menunggu Pembayaran</span>
                            )}
                        </div>
                        <h1 className="mt-2 text-xl font-bold text-ink sm:text-2xl">{project.name}</h1>
                        <p className="mt-0.5 text-sm text-ink-muted">{phased ? `${photoCount} foto · ${videoCount} video` : `${files.length} file · preview ber-watermark`}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {!isAdmin && !archived && (
                            <>
                                <button className="btn-outline" onClick={copyLink} disabled={!canDownload} title={canDownload ? 'Salin link publik preview' : 'Salin link setelah pelunasan'}>
                                    <Icon name="link" size={16} /> Salin Link
                                </button>
                                <button
                                    className="btn-primary"
                                    disabled={!canDownload || (selecting && selected.size === 0)}
                                    onClick={() => (selecting && selected.size ? downloadSelected() : (window.location.href = `/api/projects/${project.id}/download-zip`))}
                                >
                                    <Icon name="download" size={16} /> {selecting && selected.size ? `Download HD (${selected.size})` : 'Download ZIP'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
                {!isAdmin && !project.is_paid && !phased && (
                    <div className="border-b border-line bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
                        <strong>Informasi:</strong> Anda dapat melihat preview di bawah ini. Salin link & unduh file original tersedia setelah menyelesaikan pelunasan (Invoice).
                    </div>
                )}
            </div>

            {phased ? (
                <div className="card p-8 text-center">
                    <Icon name={archived ? 'folder-open' : 'clock'} size={30} className="mx-auto mb-3 text-ink-muted" />
                    <h3 className="text-lg font-semibold text-ink">{archived ? 'Proyek Diarsipkan' : 'Preview Berakhir'}</h3>
                    <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
                        {archived
                            ? `Arsip berisi ${photoCount} foto & ${videoCount} video. Akses unduhan ditutup — ajukan permintaan untuk mengunduh ulang (melalui persetujuan admin).`
                            : project.is_paid || isAdmin
                              ? 'File individual telah dikemas menjadi 1 file ZIP dan tidak lagi tampil satu per satu.'
                              : 'Jendela preview telah berakhir. Selesaikan pelunasan untuk mendapatkan file dalam 1 file ZIP.'}
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                        {archived ? (
                            isAdmin ? null : activeRedelivery ? (
                                <button className="btn-primary" onClick={startDownloadZip} disabled={downloading}>
                                    {downloading ? (<><ButtonSpinner /> Sedang menyiapkan file Anda…</>) : (<><Icon name="download" size={16} /> Unduh Semua (ZIP)</>)}
                                </button>
                            ) : pendingRedelivery ? (
                                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600"><Icon name="clock" size={16} /> Menunggu persetujuan admin</span>
                            ) : (
                                <button className="btn-primary" onClick={() => setRequestOpen(true)}><Icon name="download" size={16} /> Ajukan Permintaan Unduh Ulang</button>
                            )
                        ) : project.is_paid ? (
                            <button className="btn-primary" onClick={startDownloadZip} disabled={downloading}>
                                {downloading ? (<><ButtonSpinner /> Sedang menyiapkan file Anda…</>) : (<><Icon name="download" size={16} /> Unduh Semua (ZIP)</>)}
                            </button>
                        ) : (
                            <Link to="/dashboard/client-invoices" className="btn-primary"><Icon name="credit-card" size={16} /> Bayar Tagihan</Link>
                        )}
                    </div>
                    {activeRedelivery && (
                        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-emerald-600"><Icon name="check" size={14} /> Permintaan unduh ulang disetujui — link aktif.</p>
                    )}
                    {isAdmin && archived && (project.redeliveries || []).length > 0 && (
                        <div className="mt-6 rounded-xl border border-line bg-surface-muted/30 p-4 text-left">
                            <p className="mb-3 text-sm font-semibold text-ink">Permintaan Unduh Ulang</p>
                            <div className="space-y-2">
                                {project.redeliveries.map((rd) => (
                                    <div key={rd.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm">
                                        <span className={`badge ${rd.status === 'approved' ? 'bg-emerald-500/15 text-emerald-600' : rd.status === 'rejected' ? 'bg-red-500/15 text-red-600' : 'bg-amber-500/15 text-amber-600'}`}>
                                            {rd.status}
                                        </span>
                                        <span className="min-w-0 flex-1 truncate text-xs text-ink-muted">{rd.note || (rd.user?.name ?? 'Klien')}{rd.fee ? ` · Biaya ${formatRupiah(rd.fee)}` : ''}</span>
                                        {rd.expires_at && <span className="font-mono text-xs text-ink-muted">s/d {formatDate(rd.expires_at)}</span>}
                                        {isAdmin && rd.status === 'pending' && (
                                            <>
                                                <input type="number" min="0" className="input !w-28 !py-1 text-xs" value={feeMap[rd.id] ?? ''} onChange={(e) => setFeeMap({ ...feeMap, [rd.id]: e.target.value })} placeholder="Biaya (0)" />
                                                <button className="btn-outline !px-2 !py-1 text-xs" onClick={() => reviewRedelivery(rd, 'approved')} disabled={saving}>Setujui</button>
                                                <button className="btn-outline !px-2 !py-1 text-xs text-red-600" onClick={() => reviewRedelivery(rd, 'rejected')} disabled={saving}>Tolak</button>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
            <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-line pb-4">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-muted px-3 py-1.5 text-sm font-medium text-ink-muted">
                    <Icon name="images" size={16} /> <span className="hidden sm:inline">Semua</span> <span className="font-mono">({files.length})</span>
                </span>
                {selecting ? (
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        <button className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400" onClick={toggleSelectAll}>
                            <Icon name={allSelected ? 'check-square' : 'square'} size={16} />
                            <span className="hidden sm:inline">{allSelected ? 'Batal pilih semua' : 'Pilih semua'}</span>
                        </button>
                        {isAdmin ? (
                            <button
                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-500/10 disabled:opacity-40"
                                disabled={selected.size === 0}
                                onClick={() => setBulkOpen(true)}
                                title={`Hapus ${selected.size} file`}
                            >
                                <Icon name="trash" size={16} /> Hapus ({selected.size})
                            </button>
                        ) : (
                            <button className="btn-outline !px-2 !py-1 text-sm" disabled={selected.size === 0 || !canDownload} onClick={downloadSelected} title={`Download HD ${selected.size} file`}>
                                <Icon name="download" size={16} /> HD ({selected.size})
                            </button>
                        )}
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

            {files.length ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                    {files.map((f) => {
                        const isSelected = selected.has(f.id);
                        return (
                            <div
                                key={f.id}
                                className={`card group overflow-hidden ${selecting ? (isSelected ? 'ring-2 ring-brand-600' : '') : ''}`}
                                onClick={selecting ? () => toggleSelect(f.id) : () => setViewing(f)}
                                title={f.name}
                            >
                                <div className="relative aspect-square overflow-hidden bg-surface-muted">
                                    {f.category === 'photo' || f.type?.startsWith('image/') ? (
                                        <img src={f.url} alt={f.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    ) : (
                                        <div className="h-full w-full">
                                            <video src={f.url} muted playsInline loop preload="metadata" className="h-full w-full object-cover" />
                                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white">
                                                    <Icon name="video" size={18} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {selecting ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSelect(f.id);
                                            }}
                                            className={`absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-md border-2 shadow transition-colors ${
                                                isSelected ? 'border-brand-600 bg-brand-600 text-white' : 'border-white bg-white/80 text-transparent'
                                            }`}
                                            aria-label="Pilih"
                                        >
                                            <Icon name="check" size={14} />
                                        </button>
                                    ) : (
                                        <div
                                            className="absolute inset-0 hidden items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 md:flex"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button onClick={() => setViewing(f)} className="rounded-lg bg-white p-2 text-zinc-900" title="Lihat">
                                                <Icon name="eye" size={16} />
                                            </button>
                                            {!isAdmin && (
                                                <button
                                                    onClick={() => canDownload && downloadFile(f.id)}
                                                    disabled={!canDownload}
                                                    className={canDownload ? 'rounded-lg bg-white p-2 text-zinc-900' : 'rounded-lg bg-white/80 p-2 text-zinc-900/50'}
                                                    title={canDownload ? 'Download HD' : 'Download setelah pelunasan'}
                                                >
                                                    <Icon name="download" size={16} />
                                                </button>
                                            )}
                                            <button onClick={() => setRemoving(f)} className="rounded-lg bg-white p-2 text-red-600" title="Hapus">
                                                <Icon name="trash" size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="truncate px-2 py-1.5 text-xs text-ink-muted" title={f.name}>
                                    {f.name}
                                </div>
                                <div className="px-2 pb-2 font-mono text-[10px] text-ink-muted/70">{formatBytes(f.size)}</div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <EmptyState title="Tidak ada preview" message="Belum ada file media untuk pesanan ini." icon="image" />
            )}
            </>
            )}

            <Modal open={!!requestOpen} onClose={() => setRequestOpen(false)} title="Ajukan Permintaan Unduh Ulang" footer={
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn-outline" onClick={() => setRequestOpen(false)} disabled={requesting}>Batal</button>
                    <button type="button" className="btn-primary" onClick={submitRedeliveryRequest} disabled={requesting}>{requesting ? 'Mengirim...' : 'Kirim Permintaan'}</button>
                </div>
            }>
                <div className="space-y-4">
                    <p className="text-sm text-ink-muted">Proyek ini telah diarsipkan. Permintaan akan ditinjau admin; link akses sementara diberikan bila disetujui (mungkin berbayar).</p>
                    <Field label="Catatan (opsional)">
                        <textarea className="input min-h-[90px]" placeholder="Alasan / kebutuhan unduh ulang..." value={requestNote} onChange={(e) => setRequestNote(e.target.value)} />
                    </Field>
                </div>
            </Modal>

            <Modal open={!!viewing} onClose={() => setViewing(null)} title="Preview" wide fullscreen bodyClassName="bg-zinc-950 flex items-center justify-center">
                <div className="flex min-h-[60vh] items-center justify-center">
                    {viewing?.category === 'photo' || viewing?.type?.startsWith('image/') ? (
                        <img src={viewing?.url} alt={viewing?.name} className="max-h-[80vh] rounded-xl object-contain" />
                    ) : (
                        <video src={viewing?.url} controls autoPlay className="max-h-[80vh] rounded-xl" />
                    )}
                </div>
            </Modal>

            <Confirm open={!!removing} onClose={() => setRemoving(null)} onConfirm={handleRemoveFile} title="Hapus file?" message={`File "${removing?.name || ''}" akan dihapus dari server.`} />
            <Confirm open={bulkOpen} onClose={() => setBulkOpen(false)} onConfirm={handleBulkDelete} title="Hapus file terpilih?" message={`${selected.size} file aset akan dihapus dari server.`} />
        </>
    );
}