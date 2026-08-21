import { Fragment, useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../../api';
import Icon from '../../../components/Icon';
import { useAuth } from '../../../context/AuthContext';
import { Field, useToast, formatRupiah, formatDate, Modal, EmptyState, Confirm } from '../../../components/ui';
import Skeleton from '../../../components/Skeleton';
import { StatusBadge } from './Orders';
import ScheduledStep from './steps/ScheduledStep';
import ShootingStep from './steps/ShootingStep';
import EditingStep from './steps/EditingStep';
import AwaitingPaymentStep from './steps/AwaitingPaymentStep';
import CompletedStep from './steps/CompletedStep';
import ArchivedStep from './steps/ArchivedStep';


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
    const isAdmin = false;

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

    if (loading) return <Skeleton variant="form" />;
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

    const mediaTypes = [...new Set((project.media_types || []).filter(Boolean))];
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
        await uploadFile(e, 'end');
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

    const uploadFile = async (e, stage = null) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const data = new FormData();
            data.append('file', file);
            if (stage) data.append('stage', stage);
            await api.post(`/projects/${id}/files`, data);
            show('Foto bukti diunggah.');
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

    const existingReview = project.review || null;
    const canReview = project.review_allowed === true && !existingReview;

    const openReview = () => {
        if (existingReview) {
            setReviewForm({
                rating: existingReview.rating || 5,
                title: existingReview.title || '',
                content: existingReview.content || '',
                recommend_score: existingReview.recommend_score ?? 10,
            });
        } else {
            setReviewForm({ rating: 5, title: '', content: '', recommend_score: 10 });
        }
        setReviewOpen(true);
    };

    const submitReview = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                project_id: project.id,
                name: project.user?.name || 'Klien',
                service: project.package?.name || 'Layanan',
                ...reviewForm,
            };
            if (existingReview) {
                await api.put('/reviews/my', payload);
                show('Review Anda diperbarui.');
            } else {
                await api.post('/reviews', payload);
                show('Review berhasil dikirim.');
            }
            setReviewOpen(false);
            load();
        } catch (err) {
            show(err.response?.data?.message || 'Gagal mengirim review.', 'error');
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

const ctx = {
        PanelHeader, PanelFooter, PhotoThumbImg,
        project, isAdmin, formLocked,
        pastScheduled, pastShooting, pastEditing,
        proofStartUploaded, proofEndUploaded, recordStart, recordEnd,
        uploading, saving, fileRef, thumbRef,
        editForm, setEditForm, editNote, setEditNote, addEditNote,
        progressUpdates, fmtLog,
        hasPhoto, hasVideo, photoDone, photoTotal, photoPct, videoDone, videoTotal, videoPct,
        editAllDone, editDoneTotal, editGrandTotal,
        photoAssetCount, videoAssetCount,
        previewHref, previewLink, copyPreviewLink,
        isPaid, paidAt,
        fieldNote, setFieldNote, endProof, setDeleteConfirm,
        uploadFile, uploadEndProof, confirmShootingDone,
        advance, restore, saveEditProgress,
        setUploadOpen, uploadLabel, pickAndSaveThumb, thumbFile,
        openReview, existingReview, canReview, setReviewOpen, openChat,
        setShareOpen, feeMap, setFeeMap, reviewRedelivery, setRerequestOpen,
    };

    return (
        <>
            <Link to="/dashboard/pesanan" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand-600">
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
                    <div className="flex shrink-0 items-center gap-2">
                        <button className="btn-primary" onClick={openChat}>
                            <Icon name="message-circle" size={16} /> Chat Admin
                        </button>
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
                {activeKey === 'scheduled' && <ScheduledStep ctx={ctx} />}
                {activeKey === 'shooting' && <ShootingStep ctx={ctx} />}
                {activeKey === 'editing' && <EditingStep ctx={ctx} />}
                {activeKey === 'awaiting_payment' && <AwaitingPaymentStep ctx={ctx} />}
                {activeKey === 'completed' && <CompletedStep ctx={ctx} />}
                {activeKey === 'archived' && <ArchivedStep ctx={ctx} />}
                </>
                )}

{/* TIMELINE LOG — selalu tampil (admin & klien), ringkas */}
                <div className="card p-4 sm:p-5">
                    <h3 className="mb-4 flex items-center gap-2 font-semibold text-ink"><Icon name="clock" size={16} /> Catatan Riwayat</h3>
                    <div className="relative ml-1 space-y-5 border-l-2 border-line/50 pl-4 sm:ml-2 sm:pl-5">
                        {(project.updates || []).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).length ? (
                            project.updates.slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((u) => (
                                <div key={u.id} className="relative min-w-0">
                                    <span className={`absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-surface sm:-left-[27px] ${u.kind === 'system' ? 'bg-brand-500' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
                                    <p className={`break-words text-sm ${u.kind === 'system' ? 'text-ink' : 'text-ink-muted'}`}>{u.message}</p>
                                    <p className="mt-0.5 flex flex-wrap text-xs text-ink-muted/80">{u.kind === 'system' ? 'Update' : u.user?.name || 'Tim'} · {formatDate(u.created_at)}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-ink-muted">Belum ada riwayat tercatat.</p>
                        )}
                    </div>
                </div>
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

            {/* REVIEW MODAL */}
            <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title={existingReview ? 'Edit Review & Testimoni' : 'Kirim Review & Testimoni'} footer={
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn-outline" onClick={() => setReviewOpen(false)}>Batal</button>
                    <button type="button" className="btn-primary" onClick={submitReview} disabled={saving}>{saving ? 'Mengirim...' : existingReview ? 'Simpan Perubahan' : 'Kirim Review'}</button>
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
            {node}
        </>
    );
}
