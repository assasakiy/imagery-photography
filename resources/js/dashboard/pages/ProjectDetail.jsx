import { Fragment, useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { Spinner, Field, useToast, formatRupiah, formatDate, Modal, EmptyState, Confirm } from '../components/ui';
import { StatusBadge } from './Projects';

const STEPS = [
    { key: 'scheduled', label: 'Dijadwalkan', icon: 'calendar' },
    { key: 'shooting', label: 'Pemotretan', icon: 'camera' },
    { key: 'editing', label: 'Editing', icon: 'edit' },
    { key: 'awaiting_payment', label: 'Preview Tersedia', icon: 'eye' },
    { key: 'completed', label: 'Selesai', icon: 'check' },
    { key: 'archived', label: 'Arsip', icon: 'folder-open' },
];

function Stars({ value, onChange }) {
    return (
        <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => onChange?.(n)} disabled={!onChange} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded">
                    <Icon name="star" size={24} className={n <= value ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-700'} />
                </button>
            ))}
        </div>
    );
}

function PanelHeader({ icon, iconCls, title, subtitle }) {
    return (
        <div className="flex items-start gap-3 border-b border-line p-5">
            <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconCls}`}>
                <Icon name={icon} size={20} />
            </span>
            <div>
                <h3 className="text-lg font-bold text-ink">{title}</h3>
                {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
            </div>
        </div>
    );
}

function PanelFooter({ children }) {
    return (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface-muted/30 px-5 py-4">
            {children}
        </div>
    );
}

function PhotoThumbImg({ file, alt = '', className = '' }) {
    const [url, setUrl] = useState('');

    useEffect(() => {
        if (!file) {
            setUrl('');
            return;
        }
        let objectUrl = null;
        try {
            objectUrl = URL.createObjectURL(file);
            setUrl(objectUrl);
        } catch {
            setUrl('');
        }
        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [file]);

    if (!url) {
        return <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] text-ink-muted">{alt}</div>;
    }

    return <img src={url} alt={alt} className={className} />;
}

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { user } = useAuth();
    const isAdmin = ['owner', 'admin'].includes(user?.role);

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [photoQueue, setPhotoQueue] = useState([]);
    const [thumbFile, setThumbFile] = useState(null);
    const [videoForm, setVideoForm] = useState({ preview: null, original: null });
    const [editForm, setEditForm] = useState({ photo_total: '', photo_done: '', video_total: '', video_done: '' });
    const [editNote, setEditNote] = useState('');
    const [fieldNote, setFieldNote] = useState('');
    const [endProof, setEndProof] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [shareOpen, setShareOpen] = useState(false);
    const [shareForm, setShareForm] = useState({ enabled: true, expires_days: '7' });
    const [sharing, setSharing] = useState(false);
    const [feeMap, setFeeMap] = useState({});
    const [rerequestOpen, setRerequestOpen] = useState(false);
    const [rerequestNote, setRerequestNote] = useState('');
    const [reviewOpen, setReviewOpen] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', content: '', recommend_score: 10 });
    const fileRef = useRef(null);
    const photoRef = useRef(null);
    const thumbRef = useRef(null);
    const videoPreviewRef = useRef(null);
    const videoOriginalRef = useRef(null);
    const { show, node } = useToast();

    const load = () => {
        api.get(`/projects/${id}`).then(({ data }) => setProject(data)).finally(() => setLoading(false));
    };

    useEffect(load, [id]);

    useEffect(() => {
        if (!project) return;
        setEditForm({
            photo_total: project.photo_total || '',
            photo_done: project.photo_done || '',
            video_total: project.video_total || '',
            video_done: project.video_done || '',
        });
    }, [project?.id]);

    if (loading) return <Spinner />;
    if (!project) return <EmptyState title="Pesanan tidak ditemukan" />;

    const totalPaid = (project.payments || []).filter((p) => p.status === 'confirmed').reduce((s, p) => s + Number(p.amount), 0);
    const remaining = (Number(project.price) || 0) - totalPaid;
    const isPaid = remaining <= 0;

    const currentIdx = STEPS.findIndex((s) => s.key === project.status);
    const activeKey = step || project.status;
    const activeIdx = STEPS.findIndex((s) => s.key === activeKey);
    const isCurrentStep = activeKey === project.status;
    const formLocked = isAdmin && !isCurrentStep;
    const clientLocked = !isAdmin && activeIdx > currentIdx;

    const mediaTypes = [...new Set((project.pricing_snapshot?.items || []).map((i) => i.media).filter(Boolean))];
    const hasPhoto = mediaTypes.length === 0 || mediaTypes.includes('photo');
    const hasVideo = mediaTypes.length === 0 || mediaTypes.includes('video');
    const uploadLabel = hasPhoto && hasVideo ? 'Unggah Foto & Video' : hasPhoto ? 'Unggah Foto' : hasVideo ? 'Unggah Video' : 'Unggah File';
    const photoDone = Number(project.photo_done) || 0;
    const photoTotal = Number(project.photo_total) || 0;
    const videoDone = Number(project.video_done) || 0;
    const videoTotal = Number(project.video_total) || 0;
    const photoPct = photoTotal > 0 ? Math.min(100, Math.round((photoDone / photoTotal) * 100)) : 0;
    const videoPct = videoTotal > 0 ? Math.min(100, Math.round((videoDone / videoTotal) * 100)) : 0;
    const editAllDone = (!hasPhoto || (photoTotal > 0 && photoDone >= photoTotal)) && (!hasVideo || (videoTotal > 0 && videoDone >= videoTotal));
    const editDoneTotal = (hasPhoto ? photoDone : 0) + (hasVideo ? videoDone : 0);
    const editGrandTotal = (hasPhoto ? photoTotal : 0) + (hasVideo ? videoTotal : 0);

    const progressUpdates = (project.updates || []).filter((u) => u.message.startsWith('Proses editing'));
    // Grid di halaman proyek hanya menampilkan file REKAM/detail (bukti mulai/selesai sesi — legacy tanpa media_id).
    // Aset final (milik klien, upload via Spatie) tampil di halaman PREVIEW saja.
    const recordFiles = (project.files || []).filter((f) => f.category === 'proof');
    const recordStart = recordFiles[0];
    const recordEnd = recordFiles[1];
    const assets = (project.files || []).filter((f) => f.media_id && f.category !== 'proof');
    const photoAssetCount = assets.filter((f) => f.category === 'photo').length;
    const videoAssetCount = assets.filter((f) => f.category === 'video' && f.variant === 'preview').length;
    const pastScheduled = currentIdx > 0;
    const pastShooting = currentIdx > 1;
    const pastEditing = currentIdx > 2;
    const proofStartUploaded = !!recordStart;
    const proofEndUploaded = !!recordEnd;
    const fmtLog = (v) => {
        if (!v) return '-';
        const d = new Date(v);
        return `${d.getDate()} ${d.toLocaleString('id-ID', { month: 'short' })}, ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    };

    const confirmShootingDone = async () => {
        if (fieldNote.trim()) {
            try {
                await api.post(`/projects/${id}/updates`, { message: `Catatan dari lapangan: ${fieldNote}` });
            } catch (e) {
                // Abaikan gagal log
            }
        }
        setFieldNote('');
        advance();
    };

    const uploadEndProof = async (e) => {
        await uploadFile(e);
        setEndProof(true);
    };

    const advance = async () => {
        setSaving(true);
        try {
            await api.post(`/projects/${id}/advance`);
            show('Alur pesanan dilanjutkan.');
            setStep(null);
            await load();
        } catch (err) {
            show(err.response?.data?.message || 'Gagal melanjutkan alur.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const archive = async () => {
        if (!confirm('Arsipkan pesanan ini?')) return;
        setSaving(true);
        try {
            await api.patch(`/projects/${id}/archive`);
            show('Pesanan diarsipkan.');
            setStep(null);
            await load();
        } catch (err) {
            show(err.response?.data?.message || 'Gagal mengarsipkan.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const restore = async () => {
        setSaving(true);
        try {
            await api.patch(`/projects/${id}/restore`);
            show('Pesanan dipulihkan dari arsip.');
            setStep(null);
            await load();
        } catch (err) {
            show(err.response?.data?.message || 'Gagal memulihkan.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const saveEditProgress = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(`/projects/${id}`, {
                name: project.name,
                photo_total: Number(editForm.photo_total) || 0,
                photo_done: Number(editForm.photo_done) || 0,
                video_total: Number(editForm.video_total) || 0,
                video_done: Number(editForm.video_done) || 0,
            });
            show('Progres editing tersimpan.', 'success');
            load();
        } catch (err) {
            show(err.response?.data?.message || 'Gagal menyimpan progres.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const addEditNote = async () => {
        if (!editNote.trim()) return;
        await api.post(`/projects/${id}/updates`, { message: `Proses editing: ${editNote.trim()}` });
        setEditNote('');
        show('Pembaruan ditambahkan.');
        load();
    };

    const uploadFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const data = new FormData();
            data.append('file', file);
            await api.post(`/projects/${id}/files`, data);
            show('File diupload.');
            load();
        } finally {
            setUploading(false);
        }
    };

    const uploadPhotosBatch = async () => {
        if (!photoQueue.length) return;
        const data = new FormData();
        photoQueue.forEach((f) => data.append('files[]', f));
        await api.post(`/projects/${id}/files`, data, {
            onUploadProgress: (ev) => {
                if (ev.total) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
            },
        });
    };

    const uploadVideoPair = async () => {
        if (!videoForm.preview || !videoForm.original) return;
        const data = new FormData();
        data.append('preview', videoForm.preview);
        data.append('original', videoForm.original);
        await api.post(`/projects/${id}/videos`, data, {
            onUploadProgress: (ev) => {
                if (ev.total) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
            },
        });
    };

    const removePhoto = (file) => {
        setPhotoQueue((prev) => prev.filter((f) => f !== file));
        if (thumbFile === file) setThumbFile(null);
    };

    const pickAndSaveThumb = async (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file || uploading) return;
        setThumbFile(file);
        setUploading(true);
        try {
            const data = new FormData();
            data.append('file', file);
            await api.post(`/projects/${id}/thumbnail`, data);
            show('Thumbnail tersimpan.', 'success');
            load();
        } catch (err) {
            show(err.response?.data?.message || 'Gagal menyimpan thumbnail.', 'error');
        } finally {
            setUploading(false);
        }
    };

    const submitUpload = async () => {
        const hasPhotos = photoQueue.length > 0;
        const hasVideo = videoForm.preview && videoForm.original;
        if ((!hasPhotos && !hasVideo) || uploading) return;

        setUploading(true);
        setUploadProgress(0);
        try {
            if (hasPhotos) await uploadPhotosBatch();
            if (hasVideo) await uploadVideoPair();
            setPhotoQueue([]);
            setVideoForm({ preview: null, original: null });
            setUploadOpen(false);
            show('File final diupload. Tampil di halaman Preview.', 'success');
            load();
        } catch (err) {
            show(err.response?.data?.message || 'Gagal mengupload.', 'error');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm) return;
        try {
            await api.delete(`/files/${deleteConfirm.id}`);
            show('File dihapus.', 'success');
            setDeleteConfirm(null);
            load();
        } catch (err) {
            show(err.response?.data?.message || 'Gagal menghapus file.', 'error');
            setDeleteConfirm(null);
        }
    };

    const submitShareLink = async () => {
        setSharing(true);
        try {
            await api.post(`/projects/${id}/send-link`, {
                enabled: shareForm.enabled,
                expires_in_days: shareForm.enabled && shareForm.expires_days ? Number(shareForm.expires_days) : null,
            });
            show(shareForm.enabled ? 'Link akses diaktifkan & dikirim ke klien.' : 'Link akses dinonaktifkan.', 'success');
            setShareOpen(false);
            load();
        } catch (err) {
            show(err.response?.data?.message || 'Gagal mengirim link.', 'error');
        } finally {
            setSharing(false);
        }
    };

    const reviewRedelivery = async (red, status) => {
        setSaving(true);
        try {
            await api.patch(`/redeliveries/${red.id}`, { status, fee: status === 'approved' ? Number(feeMap[red.id] || 0) : undefined });
            show(status === 'approved' ? 'Permintaan disetujui — link akses dikirim.' : 'Permintaan ditolak.', 'success');
            load();
        } catch (err) {
            show(err.response?.data?.message || 'Gagal mengubah permintaan.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const submitRerequest = async () => {
        setSaving(true);
        try {
            await api.post(`/projects/${id}/redelivery-requests`, { note: rerequestNote });
            show('Permintaan unduh ulang dikirim.', 'success');
            setRerequestOpen(false);
            setRerequestNote('');
            load();
        } catch (err) {
            show(err.response?.data?.message || 'Gagal mengirim permintaan.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const submitReview = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/reviews', {
                project_id: project.id,
                name: project.user?.name || 'Klien',
                service: project.package?.name || 'Layanan',
                ...reviewForm,
            });
            show('Review berhasil dikirim.');
            setReviewOpen(false);
            load();
        } catch {
            show('Gagal mengirim review.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const openChat = () => {
        navigate(isAdmin ? `/dashboard/messages?pesanan=${project.order_no || project.id}` : `/dashboard/client-messages?pesanan=${project.order_no || project.id}`);
    };

    const previewHref = `/dashboard/preview/${project.order_no || project.id}`;
    const previewLink = project.accessTokens?.[0]?.url || (window.location.origin + previewHref);
    const paidAt = [...(project.payments || [])].filter((p) => p.status === 'confirmed').slice(-1)[0]?.created_at || project.completed_at || null;

    const copyPreviewLink = async () => {
        try {
            await navigator.clipboard.writeText(previewLink);
            show('Link pratinjau disalin.', 'success');
        } catch {
            show('Gagal menyalin link.', 'error');
        }
    };

    return (
        <>
            <Link to="/dashboard/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand-600">
                <Icon name="arrow-left" size={16} /> Kembali
            </Link>

            {/* HEADER CARD */}
            <div className="card mb-6 overflow-hidden">
                <div className="flex flex-col gap-4 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-brand-500/15 px-2 py-0.5 font-mono text-xs font-bold text-brand-600 dark:text-brand-400">Pesanan {project.order_no ? `PSN-${project.order_no}` : '-'}</span>
                            <StatusBadge value={project.status} />
                        </div>
                        <h1 className="mt-2 text-2xl font-bold text-ink">{project.name}</h1>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
                            {project.user && (
                                <span className="flex items-center gap-1.5"><Icon name="user" size={14} /> {project.user.name}</span>
                            )}
                            <span className="flex items-center gap-1.5"><Icon name="calendar" size={14} /> {project.event_date ? formatDate(project.event_date) : 'Tanpa jadwal'}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
                    <div className="bg-surface p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Nilai Pesanan</p>
                        <p className="mt-1 text-lg font-bold text-ink">{formatRupiah(project.price)}</p>
                    </div>
                    <div className="bg-surface p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Dibayar</p>
                        <p className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatRupiah(totalPaid)}</p>
                    </div>
                    <div className="bg-surface p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Sisa Tagihan</p>
                        <p className={`mt-1 text-lg font-bold ${remaining > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-ink'}`}>{formatRupiah(remaining)}</p>
                    </div>
                    <div className="bg-surface p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Status</p>
                        <div className="mt-1"><StatusBadge value={project.status} /></div>
                    </div>
                </div>
            </div>

            {/* FILMSTRIP STEPPER */}
            <div className="card mb-6 overflow-hidden">
                <div className="bg-zinc-900 px-4 py-4 sm:px-6 dark:bg-zinc-950">
                    <div className="flex items-start justify-between gap-1 px-1 pb-1 sm:gap-2">
                        {STEPS.filter((s) => s.key !== 'archived' || project.status === 'archived').map((s, i) => {
                            const isDone = i < currentIdx;
                            const isCurrent = i === currentIdx;
                            const isSelected = i === activeIdx;
                            return (
                                <Fragment key={s.key}>
                                    <button
                                        type="button"
                                        onClick={() => setStep(s.key)}
                                        title={s.label}
                                        className="group flex min-w-0 flex-1 flex-col items-center gap-1.5 px-0.5 sm:gap-2"
                                    >
                                        <span className="relative flex h-8 w-8 items-center justify-center sm:h-10 sm:w-10">
                                            {isSelected && <span className="absolute -inset-1 rounded-full border-2 border-white/70" />}
                                            <span className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors sm:h-10 sm:w-10 ${
                                                isSelected ? 'bg-brand-500 text-white'
                                                : isDone ? 'bg-emerald-500 text-white'
                                                : isCurrent ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/40'
                                                : 'bg-zinc-700/80 text-zinc-400 group-hover:bg-zinc-700'
                                            }`}>
                                                <Icon name={isDone && !isCurrent && !isSelected ? 'check' : s.icon} size={14} />
                                            </span>
                                        </span>
                                        <span className={`text-center text-[9px] font-semibold leading-tight sm:text-[11px] ${
                                            isSelected ? 'text-white'
                                            : isDone || isCurrent ? 'text-white/90'
                                            : 'text-zinc-500'
                                        }`}>
                                            {s.label}
                                        </span>
                                    </button>
                                    {i < STEPS.filter((s) => s.key !== 'archived' || project.status === 'archived').length - 1 && (
                                        <div className={`mt-3.5 h-0.5 max-w-12 flex-1 rounded-full sm:mt-5 sm:max-w-16 ${i < currentIdx ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                                    )}
                                </Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* STEP PANELS */}
            <div className="space-y-6">
                {clientLocked ? (
                    <div className="card p-8 text-center">
                        <Icon name="lock" size={28} className="mx-auto mb-3 text-ink-muted" />
                        <h3 className="text-lg font-semibold text-ink">{STEPS[activeIdx]?.label}</h3>
                        <p className="mt-1 text-sm text-ink-muted">Tahap ini belum dimulai untuk pesanan Anda. Pantau terus perkembangannya di sini.</p>
                    </div>
                ) : (
                <>
                {/* SCHEDULED */}
                {activeKey === 'scheduled' && (
                    <div className="card overflow-hidden">
                        <PanelHeader
                            icon="calendar"
                            iconCls="bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            title="Detail Proyek"
                            subtitle={isAdmin ? "Data ini diisi saat proyek dibuat. Status berpindah ke Pemotretan setelah fotografer mengunggah bukti mulai sesi." : "Detail pesanan Anda. Status berpindah ke Pemotretan setelah sesi acara dimulai."}
                        />
                        <div className="p-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-xs text-ink-muted">No. Pesanan</p><p className="font-mono text-sm font-semibold text-ink">{project.order_no ? `PSN-${project.order_no}` : '-'}</p></div>
                                <div><p className="text-xs text-ink-muted">Paket</p><p className="text-sm font-semibold text-ink">{project.package ? project.package.name : (project.pricing_snapshot?.package || 'Layanan Satuan / Kustom')}</p></div>
                                <div><p className="text-xs text-ink-muted">Tanggal Acara</p><p className="text-sm font-semibold text-ink">{project.event_start ? formatDate(project.event_start) : (project.event_date ? formatDate(project.event_date) : '-')}</p></div>
                                <div><p className="text-xs text-ink-muted">Waktu Acara</p>
                                    <p className="text-sm font-semibold text-ink">
                                        {project.event_start ? project.event_start.slice(11, 16) : '-'} 
                                        {project.event_end ? ` - ${project.event_end.slice(11, 16)}` : ''}
                                        {!project.event_start && !project.event_end ? '-' : ''}
                                    </p>
                                </div>
                                <div><p className="text-xs text-ink-muted">Lokasi</p><p className="text-sm font-semibold text-ink">{project.location || '-'}</p></div>
                                <div><p className="text-xs text-ink-muted">Harga</p><p className="text-sm font-semibold text-ink">{project.price ? formatRupiah(project.price) : '-'}</p></div>
                                <div><p className="text-xs text-ink-muted">Dibuat</p><p className="text-sm font-semibold text-ink">{formatDate(project.created_at)}</p></div>
                                <div><p className="text-xs text-ink-muted">Klien</p>
                                    <p className="text-sm font-semibold text-ink">
                                        {project.user?.username ? `@${project.user.username}` : (project.user?.name || '-')}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-ink-muted">Catatan</p>
                                    <p className="mt-0.5 whitespace-pre-line text-sm font-semibold text-ink">{project.description || '-'}</p>
                                </div>
                            </div>

                            {isAdmin && project.event_start && new Date(project.event_start) < new Date() && (
                                <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400">
                                    <Icon name="calendar" size={20} className="shrink-0 text-amber-600" />
                                    <div className="text-sm">
                                        <p className="font-bold">Acara sudah lewat jadwal mulainya.</p>
                                        <p className="opacity-90">Ingatkan fotografer untuk mengunggah bukti mulai sesi.</p>
                                    </div>
                                </div>
                            )}

                            {isAdmin && !pastScheduled && !proofStartUploaded && (
                                <div className="mt-6 border-t border-line pt-4">
                                    <p className="mb-2 text-sm font-semibold text-ink">Unggah bukti mulai sesi</p>
                                    <button className="btn-outline flex w-full flex-col items-center justify-center gap-1 border-dashed py-6 text-center hover:bg-surface-muted/50" onClick={() => fileRef.current?.click()} disabled={formLocked || uploading}>
                                        <Icon name="camera" size={24} className="mb-1 text-ink-muted" />
                                        <span className="font-semibold text-ink">{uploading ? 'Mengupload...' : 'Seret foto ke sini atau klik untuk unggah'}</span>
                                        <span className="text-xs text-ink-muted">Foto ini menjadi penanda waktu sesi resmi dimulai</span>
                                    </button>
                                    <input ref={fileRef} type="file" className="hidden" onChange={uploadFile} disabled={formLocked} />
                                </div>
                            )}

                            {isAdmin && proofStartUploaded && (
                                <div className="mt-6 flex items-center gap-3 rounded-xl border border-line bg-surface-muted/30 p-3">
                                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-strong">
                                        <img src={recordStart.url} alt="Bukti mulai sesi" className="h-full w-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-ink">Bukti mulai sesi</p>
                                        <p className="font-mono text-xs text-ink-muted">Diunggah {formatDate(recordStart.created_at)}</p>
                                    </div>
                                    {!pastScheduled && (
                                        <button className="ml-auto rounded-lg bg-red-500/10 p-2 text-red-600 transition-colors hover:bg-red-500" onClick={() => setDeleteConfirm(recordStart)} title="Hapus bukti">
                                            <Icon name="trash" size={16} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        {isAdmin && !pastScheduled && (
                            <PanelFooter>
                                <button className="btn-outline mr-auto" onClick={openChat}><Icon name="message-circle" size={16} /> Kirim Pesan</button>
                                <button className="btn-primary" onClick={advance} disabled={formLocked || saving}>
                                    Konfirmasi
                                </button>
                            </PanelFooter>
                        )}
                    </div>
                )}

                {/* SHOOTING */}
                {activeKey === 'shooting' && (
                    <div className="card overflow-hidden">
                        <PanelHeader
                            icon="camera"
                            iconCls="bg-sky-500/15 text-sky-600 dark:text-sky-400"
                            title="Sesi Berlangsung"
                            subtitle={isAdmin ? "Bukti mulai sudah tercatat. Unggah bukti selesai lalu konfirmasi untuk memindahkan proyek ke tahap Editing." : "Sesi pemotretan sedang berlangsung — bukti mulai sesi sudah tercatat."}
                        />
                        <div className="p-5">
                            {!proofStartUploaded && !proofEndUploaded && (
                                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line bg-surface-muted/30 p-8 text-center">
                                    <Icon name="camera" size={24} className="text-ink-muted" />
                                    {pastShooting ? (
                                        <>
                                            <p className="text-sm font-semibold text-ink">Sesi telah selesai</p>
                                            <p className="text-xs text-ink-muted">Sesi telah selesai dan tidak ada file yang diunggah sebagai bukti.</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm font-medium text-ink">Belum ada bukti tersedia</p>
                                            <p className="text-xs text-ink-muted">Bukti mulai/selesai sesi akan tampil di sini setelah diunggah.</p>
                                        </>
                                    )}
                                </div>
                            )}
                            {proofStartUploaded && (
                                <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-strong">
                                        <img src={recordStart.url} alt="" className="h-full w-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-ink">Bukti mulai sesi</p>
                                        <p className="font-mono text-xs text-ink-muted">Diunggah {formatDate(recordStart.created_at)}</p>
                                    </div>
                                    {isAdmin && !pastShooting && (
                                        <button className="ml-auto rounded-lg bg-red-500/10 p-2 text-red-600 transition-colors hover:bg-red-500" onClick={() => setDeleteConfirm(recordStart)} title="Hapus bukti">
                                            <Icon name="trash" size={16} />
                                        </button>
                                    )}
                                </div>
                            )}

                            {isAdmin && !pastShooting && !proofEndUploaded && (
                                <div className="mt-5">
                                    <div className="border-t border-line pt-5">
                                        <p className="mb-2 text-sm font-semibold text-ink">Unggah bukti selesai sesi</p>
                                        <button className="btn-outline flex w-full flex-col items-center justify-center gap-1 border-dashed py-6 text-center hover:bg-surface-muted/50" onClick={() => fileRef.current?.click()} disabled={formLocked || uploading}>
                                            <Icon name="camera" size={24} className="mb-1 text-ink-muted" />
                                            <span className="font-semibold text-ink">{uploading ? 'Mengupload...' : 'Seret 1 foto ke sini atau klik untuk unggah'}</span>
                                            <span className="text-xs text-ink-muted">Foto ini menjadi penanda waktu sesi resmi selesai</span>
                                        </button>
                                        <input ref={fileRef} type="file" className="hidden" onChange={uploadEndProof} disabled={formLocked} />
                                    </div>

                                    <div className="mt-4">
                                        <Field label="Catatan dari lapangan" hint="opsional">
                                            <textarea className="input" placeholder="Contoh: cuaca cerah, sesi selesai lebih cepat dari jadwal..." rows="2" value={fieldNote} onChange={(e) => setFieldNote(e.target.value)} disabled={formLocked} />
                                        </Field>
                                    </div>
                                </div>
                            )}

                            {proofEndUploaded && (
                                <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-strong">
                                        <img src={recordEnd.url} alt="" className="h-full w-full object-cover" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-ink">Bukti selesai sesi</p>
                                        <p className="font-mono text-xs text-ink-muted">Diunggah {formatDate(recordEnd.created_at)}</p>
                                    </div>
                                    {isAdmin && !pastShooting && (
                                        <button className="ml-auto rounded-lg bg-red-500/10 p-2 text-red-600 transition-colors hover:bg-red-500" onClick={() => setDeleteConfirm(recordEnd)} title="Hapus bukti">
                                            <Icon name="trash" size={16} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        {isAdmin && !pastShooting && (
                            <PanelFooter>
                                <button className="btn-outline mr-auto" onClick={openChat}><Icon name="message-circle" size={16} /> Kirim Pesan</button>
                                <button className="btn-primary" onClick={confirmShootingDone} disabled={formLocked || saving || (!endProof && !proofEndUploaded)}>
                                    Konfirmasi
                                </button>
                            </PanelFooter>
                        )}
                    </div>
                )}

                {/* EDITING */}
                {activeKey === 'editing' && (
                    <div className="card overflow-hidden">
                        <PanelHeader
                            icon="edit"
                            iconCls="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                            title="Progres Editing"
                            subtitle={isAdmin ? "Perbarui jumlah media dan progres yang sudah diedit secara berkala. Klien dapat melihat ringkasan progres ini." : "Tim sedang mengedit file media pesanan Anda — pantau progresnya di sini."}
                        />
                        <div className="p-5">
                            {hasPhoto && (
                                <div className="mb-4">
                                    <div className="mb-1 flex items-center justify-between">
                                        <span className="text-sm font-medium text-ink">Foto diedit</span>
                                        <span className="font-mono text-sm font-semibold text-ink">{photoDone} / {photoTotal}</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-strong">
                                        <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${photoPct}%` }} />
                                    </div>
                                </div>
                            )}
                            {hasVideo && (
                                <div className="mb-4">
                                    <div className="mb-1 flex items-center justify-between">
                                        <span className="text-sm font-medium text-ink">Video diedit</span>
                                        <span className="font-mono text-sm font-semibold text-ink">{videoDone} / {videoTotal}</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-strong">
                                        <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${videoPct}%` }} />
                                    </div>
                                </div>
                            )}
                            {isAdmin && (
                                <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-muted/30 px-4 py-3 text-sm">
                                    <Icon name="images" size={16} className="text-ink-muted" />
                                    <span className="font-medium text-ink">{photoAssetCount} foto · {videoAssetCount} video diupload</span>
                                    <span className="text-xs text-ink-muted">— kelola di halaman <Link to={previewHref} className="text-brand-600 underline">Preview</Link></span>
                                </div>
                            )}
                            {isAdmin && (
                                <>
                                    {!pastEditing && (
                                    <form onSubmit={saveEditProgress} className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-5">
                                        {hasPhoto && (
                                            <>
                                                <Field label="Total foto">
                                                    <input className="input" type="number" min="0" value={editForm.photo_total} onChange={(e) => setEditForm({ ...editForm, photo_total: e.target.value })} placeholder="mis. 480" disabled={formLocked} />
                                                </Field>
                                                <Field label="Foto sudah diedit">
                                                    <input className="input" type="number" min="0" value={editForm.photo_done} onChange={(e) => setEditForm({ ...editForm, photo_done: e.target.value })} placeholder="mis. 210" disabled={formLocked} />
                                                </Field>
                                            </>
                                        )}
                                        {hasVideo && (
                                            <>
                                                <Field label="Total video">
                                                    <input className="input" type="number" min="0" value={editForm.video_total} onChange={(e) => setEditForm({ ...editForm, video_total: e.target.value })} placeholder="mis. 3" disabled={formLocked} />
                                                </Field>
                                                <Field label="Video sudah diedit">
                                                    <input className="input" type="number" min="0" value={editForm.video_done} onChange={(e) => setEditForm({ ...editForm, video_done: e.target.value })} placeholder="mis. 1" disabled={formLocked} />
                                                </Field>
                                            </>
                                        )}
                                        <div className="col-span-2">
                                            <button className="btn-primary" disabled={formLocked || saving}>{saving ? 'Menyimpan...' : 'Simpan Progres'}</button>
                                        </div>
                                    </form>
                                    )}
                                    <div className="mt-5 border-t border-line pt-5">
                                        <p className="mb-3 text-sm font-semibold text-ink">Riwayat pembaruan</p>
                                        <div className="space-y-3">
                                            {progressUpdates.length ? (
                                                progressUpdates.map((u) => (
                                                    <div key={u.id} className="flex items-baseline gap-3">
                                                        <span className="shrink-0 font-mono text-xs text-ink-muted">{fmtLog(u.created_at)}</span>
                                                        <span className="text-sm text-ink-muted">{u.message.replace(/^Proses editing:\s*/, '')}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-ink-muted">Belum ada pembaruan tercatat.</p>
                                            )}
                                        </div>
                                        {!pastEditing && (
                                        <div className="mt-3 flex gap-2">
                                            <input className="input" placeholder="Tulis pembaruan progres..." value={editNote} onChange={(e) => setEditNote(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEditNote(); } }} disabled={formLocked} />
                                            <button className="btn-outline shrink-0" onClick={addEditNote} disabled={formLocked || !editNote.trim()}>Tambah</button>
                                        </div>
                                        )}
                                    </div>
                                    <div className="mt-5">
                                        <p className="mb-0.5 text-sm font-semibold text-ink">Unggah File Final</p>
                                        <p className="mb-3 text-xs text-ink-muted">File final = aset klien, tampil di halaman <Link to={previewHref} className="text-brand-600 underline">Preview</Link>.</p>
                                        {!pastEditing && (
                                            <div className="overflow-hidden rounded-xl border border-line">
                                                <button type="button" onClick={() => setUploadOpen(true)} disabled={formLocked || uploading} className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left hover:bg-surface-muted/40 disabled:opacity-50">
                                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/15 text-brand-600 dark:text-brand-400">
                                                        <Icon name="upload" size={18} />
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block text-sm font-semibold text-ink">{uploadLabel}</span>
                                                        <span className="block text-xs text-ink-muted">Buka popup untuk pilih file hasil edit</span>
                                                    </span>
                                                    <Icon name="arrow-right" size={16} className="shrink-0 text-ink-muted" />
                                                </button>
                                                <div className="flex items-center gap-3 px-4 py-3">
                                                    <span className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface-strong">
                                                        {thumbFile ? (
                                                            <PhotoThumbImg file={thumbFile} alt="Thumbnail" className="h-full w-full object-cover" />
                                                        ) : project.thumb_url ? (
                                                            <img src={project.thumb_url} alt="Thumbnail" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <span className="px-1 text-center text-[10px] text-ink-muted">Belum ada</span>
                                                        )}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block text-sm font-semibold text-ink">Thumbnail Card</span>
                                                        <span className="block truncate text-xs text-ink-muted">{thumbFile ? `Baru: ${thumbFile.name}` : 'Tampil permanen di card Preview klien'}</span>
                                                    </span>
                                                    <button type="button" className="btn-outline shrink-0 !px-3 !py-1 text-xs" onClick={() => thumbRef.current?.click()} disabled={formLocked || uploading}>Ganti</button>
                                                    <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={pickAndSaveThumb} disabled={uploading} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        {isAdmin && !pastEditing && (
                            <PanelFooter>
                                <button className="btn-outline mr-auto" onClick={openChat}><Icon name="message-circle" size={16} /> Kirim Pesan</button>
                                <button className="btn-primary" onClick={advance} disabled={formLocked || saving || !editAllDone}>
                                    Konfirmasi
                                </button>
                            </PanelFooter>
                        )}
                        {isAdmin && !editAllDone && !pastEditing && (
                            <div className="border-t border-line bg-surface-muted/50 px-5 py-3">
                                <p className="text-xs text-ink-muted">
                                    {editGrandTotal > 0
                                        ? `Aktif setelah seluruh media ditandai selesai diedit (saat ini ${editDoneTotal}/${editGrandTotal}).`
                                        : 'Aktif setelah kamu mengisi total media dan menandainya selesai diedit.'}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* PREVIEW TERSEDIA (awaiting_payment) */}
                {activeKey === 'awaiting_payment' && (
                    <div className="card overflow-hidden">
                        <PanelHeader
                            icon="eye"
                            iconCls="bg-orange-500/15 text-orange-600 dark:text-orange-400"
                            title="Preview & Invoice"
                            subtitle="File final sudah diunggah. Link pratinjau dan invoice dibuat otomatis — tinjau dulu sebelum membagikannya ke klien."
                        />
                        <div className="p-5">
                            {isAdmin && (
                                <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-muted/30 p-3">
                                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink">{previewLink}</span>
                                    <button type="button" className="btn-outline shrink-0 !px-2 !py-1 text-xs" onClick={copyPreviewLink}><Icon name="copy" size={14} /> Salin</button>
                                    <a className="btn-outline shrink-0 !px-2 !py-1 text-xs" href={previewLink} target="_blank" rel="noreferrer"><Icon name="globe" size={14} /> Buka</a>
                                </div>
                            )}
                            {!isAdmin && project.invoice ? (
                                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                                    <div>
                                        <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Invoice Terkirim · {project.invoice.number}</p>
                                        <p className="mt-1 text-xl font-bold text-ink">{formatRupiah(project.invoice.base_amount)}</p>
                                    </div>
                                    <div className="text-right text-xs text-emerald-700 dark:text-emerald-400">
                                        <p>Jatuh tempo</p>
                                        <p className="mt-0.5 font-semibold">{formatDate(project.invoice.due_at)}</p>
                                    </div>
                                </div>
                            ) : null}
                            <p className="mt-4 text-xs text-ink-muted">
                                Status berpindah ke <b>Selesai</b> otomatis setelah pembayaran invoice lunas.
                            </p>
                        </div>
                        <PanelFooter>
                            <Link to={previewHref} className="btn-outline"><Icon name="eye" size={16} /> Lihat Preview</Link>
                            {!isAdmin && (
                                <Link to="/dashboard/client-invoices" className="btn-primary"><Icon name="credit-card" size={16} /> Bayar Tagihan</Link>
                            )}
                            {isAdmin && isPaid && (
                                <button className="btn-primary" onClick={advance} disabled={formLocked || saving}>
                                    Tandai Selesai
                                </button>
                            )}
                        </PanelFooter>
                    </div>
                )}

                {/* COMPLETED */}
                {activeKey === 'completed' && (
                    <div className="card overflow-hidden">
                        <PanelHeader
                            icon="check"
                            iconCls="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            title="Proyek Selesai"
                            subtitle="Kedua syarat berikut sudah terpenuhi. File asli tanpa watermark kini tersedia untuk diunduh."
                        />
                        <div className="space-y-3 p-5">
                            <div className="flex items-center gap-3 rounded-xl border border-line p-4">
                                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${isPaid ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                                    <Icon name="check" size={14} />
                                </span>
                                <p className="flex-1 text-sm font-medium text-ink">Pembayaran invoice lunas</p>
                                <span className={`badge ${isPaid ? 'bg-emerald-500/15 text-emerald-600' : 'bg-zinc-500/15 text-zinc-500 dark:text-zinc-400'}`}>
                                    {isPaid ? 'TERPENUHI' : 'BELUM'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                                <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                    {isPaid ? `Dibayar Lunas · ${formatDate(paidAt)}` : 'Menunggu Pelunasan'}
                                </p>
                                <p className="text-xl font-bold text-ink">{formatRupiah(Number(project.price))}</p>
                            </div>
                            {!isAdmin && (
                                <div className="rounded-xl border border-line bg-surface-muted/30 p-5 text-center">
                                    <p className="mb-4 text-sm text-ink-muted">Bagikan pengalaman Anda bekerja bersama kami.</p>
                                    <button className="btn-primary" onClick={() => setReviewOpen(true)}><Icon name="star" size={16} /> Berikan Review</button>
                                </div>
                            )}
                        </div>
                        <PanelFooter>
                            <Link to={previewHref} className={isAdmin ? 'btn-outline' : 'btn-primary'}>
                                <Icon name="download" size={16} /> Unduh File
                            </Link>
                            {isAdmin && (
                                <button className="btn-outline" onClick={archive} disabled={saving}>
                                    <Icon name="folder-open" size={16} /> Arsipkan Proyek
                                </button>
                            )}
                        </PanelFooter>
                    </div>
                )}

                {/* ARCHIVED */}
                {activeKey === 'archived' && (
                    <div className="card overflow-hidden">
                        <PanelHeader
                            icon="folder-open"
                            iconCls="bg-zinc-500/15 text-zinc-600 dark:text-zinc-400"
                            title="Pesanan Diarsipkan"
                            subtitle="Pesanan ini telah diarsipkan."
                        />
                        <div className="p-5">
                            <p className="text-sm text-ink-muted">File proyek telah diarsipkan karena masa retensi berakhir atau atas permintaan admin. Hubungi admin bila Anda masih membutuhkan akses.</p>

                            {isAdmin && (
                                <div className="mt-5 rounded-xl border border-line bg-surface-muted/30 p-4">
                                    <p className="mb-2 text-sm font-semibold text-ink">Link akses</p>
                                    <div className="flex items-center gap-2">
                                        <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink">{previewLink}</span>
                                        <button type="button" className="btn-outline shrink-0 !px-2 !py-1 text-xs" onClick={copyPreviewLink}><Icon name="copy" size={14} /> Salin</button>
                                    </div>
                                    <button type="button" className="btn-primary mt-3" onClick={() => setShareOpen(true)}><Icon name="send" size={16} /> Kirim Akses</button>
                                </div>
                            )}

                            {(isAdmin || (project.redeliveries || []).length > 0) && (
                                <div className="mt-5 rounded-xl border border-line bg-surface-muted/30 p-4">
                                    <p className="mb-3 text-sm font-semibold text-ink">Permintaan Unduh Ulang</p>
                                    {(project.redeliveries || []).length ? (
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
                                    ) : (
                                        <p className="text-xs text-ink-muted">Belum ada permintaan.</p>
                                    )}
                                    {!isAdmin && (
                                        <button className="btn-primary mt-3" onClick={() => setRerequestOpen(true)} disabled={saving}><Icon name="download" size={16} /> Ajukan Permintaan Unduh Ulang</button>
                                    )}
                                </div>
                            )}
                        </div>
                        {isAdmin && project.status === 'archived' && (
                            <PanelFooter>
                                <button className="btn-primary" onClick={restore} disabled={saving}><Icon name="refresh" size={16} /> Pulihkan Pesanan</button>
                            </PanelFooter>
                        )}
                    </div>
                )}
                </>
                )}

                {/* TIMELINE LOG */}
                {project.status === 'archived' && (
                <div className="card p-4 sm:p-5">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold text-ink"><Icon name="clock" size={16} /> Catatan Riwayat</h3>
                    <div className="relative ml-1 space-y-5 border-l-2 border-line/50 pl-4 sm:ml-2 sm:pl-5">
                        {project.updates?.length ? (
                            project.updates.map((u) => (
                                <div key={u.id} className="relative min-w-0">
                                    <span className={`absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-surface sm:-left-[27px] ${u.kind === 'system' ? 'bg-brand-500' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
                                    <p className={`break-words text-sm ${u.kind === 'system' ? 'text-ink' : 'text-ink-muted'}`}>{u.message}</p>
                                    <p className="mt-0.5 flex flex-wrap text-xs text-ink-muted/80">{u.kind === 'system' ? 'Sistem' : u.user?.name || 'Admin'} · {formatDate(u.created_at)}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-ink-muted">Belum ada riwayat tercatat.</p>
                        )}
                    </div>
                </div>
                )}
            </div>

            {/* REREQUEST MODAL */}
            <Modal open={rerequestOpen} onClose={() => setRerequestOpen(false)} title="Ajukan Permintaan Unduh Ulang" footer={
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn-outline" onClick={() => setRerequestOpen(false)} disabled={saving}>Batal</button>
                    <button type="button" className="btn-primary" onClick={submitRerequest} disabled={saving}>{saving ? 'Mengirim...' : 'Kirim Permintaan'}</button>
                </div>
            }>
                <div className="space-y-4">
                    <p className="text-sm text-ink-muted">Proyek ini telah diarsipkan. Permintaan akan ditinjau admin; link akses sementara diberikan bila disetujui (mungkin berbayar).</p>
                    <Field label="Catatan (opsional)">
                        <textarea className="input min-h-[90px]" placeholder="Alasan / kebutuhan unduh ulang..." value={rerequestNote} onChange={(e) => setRerequestNote(e.target.value)} />
                    </Field>
                </div>
            </Modal>

            {/* DELETE CONFIRM */}
            <Confirm open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDeleteConfirm} title="Hapus file?" message={`File "${deleteConfirm?.original_name || ''}" akan dihapus dari server.`} />

            {/* REVIEW MODAL */}
            <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title="Kirim Review & Testimoni" footer={
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn-outline" onClick={() => setReviewOpen(false)}>Batal</button>
                    <button type="button" className="btn-primary" onClick={submitReview} disabled={saving}>{saving ? 'Mengirim...' : 'Kirim Review'}</button>
                </div>
            }>
                <form className="space-y-4">
                    <Field label="Rating Keseluruhan" required>
                        <Stars value={reviewForm.rating} onChange={(n) => setReviewForm({ ...reviewForm, rating: n })} />
                    </Field>
                    <Field label="Seberapa besar kemungkinan Anda merekomendasikan kami? (0-10)" required>
                        <input type="number" min="0" max="10" className="input" value={reviewForm.recommend_score} onChange={(e) => setReviewForm({ ...reviewForm, recommend_score: e.target.value })} />
                    </Field>
                    <Field label="Judul Singkat" hint="opsional">
                        <input className="input" placeholder="Luar biasa!" value={reviewForm.title} onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })} />
                    </Field>
                    <Field label="Ceritakan Pengalaman Anda" required>
                        <textarea className="input min-h-[120px]" placeholder="Bagaimana pelayanan fotografer, dll..." value={reviewForm.content} onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })} required />
                    </Field>
                </form>
            </Modal>
            {/* UPLOAD FILE MODAL */}
            <Modal
                open={uploadOpen}
                onClose={() => setUploadOpen(false)}
                title="Unggah File Final"
                wide
                footer={
                    <div className="flex justify-end gap-2">
                        <button type="button" className="btn-outline" onClick={() => setUploadOpen(false)} disabled={uploading}>Batal</button>
                        <button type="button" className="btn-primary" onClick={submitUpload} disabled={uploading || (!photoQueue.length && !(videoForm.preview && videoForm.original))}>
                            {uploading ? 'Mengunggah…' : 'Unggah'} <Icon name="upload" size={16} />
                        </button>
                    </div>
                }
            >
                <div className="space-y-5">
                    {hasPhoto && (
                        <div>
                            <p className="text-sm font-semibold text-ink">Foto (bisa banyak)</p>
                            <p className="mt-0.5 text-xs text-ink-muted">Klik foto untuk jadikan Thumbnail Card · ✕ untuk batal pilih.</p>
                            {!photoQueue.length && !uploading && (
                                <button type="button" className="mt-3 btn-outline flex w-full flex-col items-center justify-center gap-1 border-dashed py-5 text-center hover:bg-surface-muted/50" onClick={() => photoRef.current?.click()} disabled={uploading}>
                                    <Icon name="upload" size={20} className="mb-1 text-ink-muted" />
                                    <span className="font-semibold text-ink">Pilih foto hasil edit</span>
                                </button>
                            )}
                            {photoQueue.length > 0 && !uploading && (
                                <>
                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        {photoQueue.map((f) => (
                                            <div key={`${f.name}-${f.size}-${f.lastModified}`} onClick={() => setThumbFile(f)} className={`group relative cursor-pointer overflow-hidden rounded-lg border ${thumbFile === f ? 'border-brand-600 ring-2 ring-brand-600' : 'border-line'}`}>
                                                <div className="aspect-square w-full overflow-hidden bg-surface-muted">
                                                    <PhotoThumbImg file={f} alt={f.name} className="h-full w-full object-cover" />
                                                </div>
                                                <p className="truncate border-t border-line bg-surface/80 px-2 py-1 text-xs text-ink-muted">{f.name}</p>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); removePhoto(f); }} className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white" title="Batal pilih">
                                                    <Icon name="x" size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-xs text-ink-muted">Klik untuk pilih jadi thumbnail {thumbFile ? `→ “${thumbFile.name}” terpilih` : ''}</p>
                                </>
                            )}
                            {uploading && photoQueue.length > 0 && (
                                <div className="mt-3 rounded-xl border border-line bg-surface-muted/30 p-4">
                                    <div className="mb-2 flex items-center justify-between text-sm">
                                        <span className="font-semibold text-ink">Mengunggah {photoQueue.length} foto…</span>
                                        <span className="font-mono text-xs text-ink-muted">{uploadProgress}%</span>
                                    </div>
                                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-strong">
                                        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                                    </div>
                                    <p className="mt-2 text-xs text-ink-muted">Menunggu selesai — tidak bisa memilih/pilih foto saat pengunggahan berlangsung.</p>
                                </div>
                            )}
                            <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const picked = Array.from(e.target.files || []); if (picked.length) setPhotoQueue((prev) => [...prev, ...picked]); e.target.value = ''; }} disabled={uploading} />
                        </div>
                    )}
                    {hasVideo && (
                        <div className="border-t border-line pt-4">
                            <p className="text-sm font-semibold text-ink">Video (1 pasang)</p>
                            <p className="mt-0.5 text-xs text-ink-muted">File preview (sudah ber-watermark dari editor) + file original/HD. Original privat.</p>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <button type="button" className="btn-outline flex w-full flex-col items-center justify-center gap-1 border-dashed py-4 text-center" onClick={() => videoPreviewRef.current?.click()} disabled={uploading}>
                                    <Icon name="video" size={20} className="mb-1 text-ink-muted" />
                                    <span className="w-full truncate px-2 text-xs font-semibold text-ink">{videoForm.preview ? videoForm.preview.name : 'File Preview (ber-watermark)'}</span>
                                </button>
                                <input ref={videoPreviewRef} type="file" accept="video/*" className="hidden" onChange={(e) => setVideoForm({ ...videoForm, preview: e.target.files[0] })} disabled={uploading} />
                                <button type="button" className="btn-outline flex w-full flex-col items-center justify-center gap-1 border-dashed py-4 text-center" onClick={() => videoOriginalRef.current?.click()} disabled={uploading}>
                                    <Icon name="video" size={20} className="mb-1 text-ink-muted" />
                                    <span className="w-full truncate px-2 text-xs font-semibold text-ink">{videoForm.original ? videoForm.original.name : 'File Original / HD (privat)'}</span>
                                </button>
                                <input ref={videoOriginalRef} type="file" accept="video/*" className="hidden" onChange={(e) => setVideoForm({ ...videoForm, original: e.target.files[0] })} disabled={uploading} />
                            </div>
                        </div>
                    )}
                    {uploading && !photoQueue.length && (
                        <div className="rounded-xl border border-line bg-surface-muted/30 p-4">
                            <div className="mb-2 flex items-center justify-between text-sm">
                                <span className="font-semibold text-ink">Mengunggah…</span>
                                <span className="font-mono text-xs text-ink-muted">{uploadProgress}%</span>
                            </div>
                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-strong">
                                <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                            </div>
                            <p className="mt-2 text-xs text-ink-muted">Menunggu selesai — tidak bisa pilih lagi.</p>
                        </div>
                    )}
                </div>
            </Modal>

            {/* KIRIM AKSES MODAL */}
            <Modal
                open={shareOpen}
                onClose={() => setShareOpen(false)}
                title="Kirim Akses"
                footer={
                    <div className="flex justify-end gap-2">
                        <button type="button" className="btn-outline" onClick={() => setShareOpen(false)} disabled={sharing}>Batal</button>
                        <button type="button" className="btn-primary" onClick={submitShareLink} disabled={sharing}>
                            {sharing ? 'Mengirim...' : (shareForm.enabled ? 'Aktifkan & Kirim' : 'Nonaktifkan')}
                        </button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <button type="button" onClick={() => setShareForm({ ...shareForm, enabled: !shareForm.enabled })} className="flex w-full items-center justify-between gap-4 rounded-xl border border-line p-4 text-left hover:bg-surface-muted/30">
                        <div>
                            <p className="text-sm font-semibold text-ink">Link akses aktif</p>
                            <p className="mt-0.5 text-xs text-ink-muted">Klien dapat membuka link untuk mengakses file.</p>
                        </div>
                        <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${shareForm.enabled ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${shareForm.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </span>
                    </button>

                    {shareForm.enabled && (
                        <>
                            <Field label="Masa berlaku link">
                                <select className="input" value={shareForm.expires_days} onChange={(e) => setShareForm({ ...shareForm, expires_days: e.target.value })}>
                                    <option value="3">3 hari</option>
                                    <option value="7">7 hari</option>
                                    <option value="30">30 hari</option>
                                </select>
                            </Field>
                            <div>
                                <p className="mb-1 text-xs text-ink-muted">Link yang dikirim:</p>
                                <p className="truncate rounded-lg border border-line bg-surface-muted/30 p-2 font-mono text-xs text-ink">{previewLink}</p>
                            </div>
                        </>
                    )}

                    <p className="text-xs text-ink-muted">Pengiriman mengikuti aturan notifikasi yang aktif (WhatsApp / email / dalam aplikasi) sesuai preferensi klien.</p>
                </div>
            </Modal>

            {node}
        </>
    );
}
