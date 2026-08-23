import { copyToClipboard } from '../../../lib/clipboard';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../../api';
import Icon from '../../../components/Icon';
import { useAuth } from '../../../context/AuthContext';
import { Field, formatRupiah, formatDate, Modal, EmptyState, Confirm } from '../../../components/ui';
import { DetailSkeleton } from '../../../components/Skeleton';
import { toast } from '../../../lib/toast';
import { getApiErrorMessage } from '../../../lib/errors';
import { StatusBadge } from './Orders';
import ScheduledStep from './steps/ScheduledStep';
import ShootingStep from './steps/ShootingStep';
import EditingStep from './steps/EditingStep';
import AwaitingPaymentStep from './steps/AwaitingPaymentStep';
import CompletedStep from './steps/CompletedStep';
import ArchivedStep from './steps/ArchivedStep';

const STEPS = [
    { key: 'scheduled', label: 'Terjadwal', icon: 'calendar' },
    { key: 'shooting', label: 'Sesi', icon: 'camera' },
    { key: 'editing', label: 'Editing', icon: 'edit' },
    { key: 'awaiting_payment', label: 'Pembayaran', icon: 'credit-card' },
    { key: 'completed', label: 'Selesai', icon: 'check-circle' },
    { key: 'archived', label: 'Arsip', icon: 'folder-open' },
];

function PanelHeader({ icon, iconCls, title, subtitle }) {
    return (
        <div className="border-b border-line px-5 py-4">
            <div className="flex items-center gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconCls}`}>
                    <Icon name={icon} size={18} />
                </span>
                <div>
                    <h3 className="text-sm font-bold text-ink">{title}</h3>
                    {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
                </div>
            </div>
        </div>
    );
}

function PanelFooter({ children }) {
    return (
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3">
            {children}
        </div>
    );
}

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { user } = useAuth();
    const isAdmin = false;

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [rerequestOpen, setRerequestOpen] = useState(false);
    const [rerequestNote, setRerequestNote] = useState('');
    const [reviewOpen, setReviewOpen] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', content: '', recommend_score: 10 });
    const fileRef = useRef(null);

    const load = () => {
        api.get(`/projects/${id}`)
            .then(({ data }) => setProject(data))
            .catch(() => toast.error('Gagal memuat detail.'))
            .finally(() => setLoading(false));
    };

    useEffect(load, [id]);

    if (loading) return <DetailSkeleton />;
    if (!project) return <EmptyState title="Pesanan tidak ditemukan" />;

    const totalPaid = (project.payments || []).filter((p) => p.status === 'confirmed').reduce((s, p) => s + Number(p.amount), 0);
    const remaining = (Number(project.price) || 0) - totalPaid;
    const isPaid = remaining <= 0;

    const currentIdx = STEPS.findIndex((s) => s.key === project.status);
    const activeKey = step || project.status;
    const activeIdx = STEPS.findIndex((s) => s.key === activeKey);
    const clientLocked = activeIdx > currentIdx;

    const mediaTypes = [...new Set((project.media_types || []).filter(Boolean))];
    const hasPhoto = mediaTypes.length === 0 || mediaTypes.includes('photo');
    const hasVideo = mediaTypes.length === 0 || mediaTypes.includes('video');
    const photoDone = Number(project.photo_done) || 0;
    const photoTotal = Number(project.photo_total) || 0;
    const videoDone = Number(project.video_done) || 0;
    const videoTotal = Number(project.video_total) || 0;
    const photoPct = photoTotal > 0 ? Math.min(100, Math.round((photoDone / photoTotal) * 100)) : 0;
    const videoPct = videoTotal > 0 ? Math.min(100, Math.round((videoDone / videoTotal) * 100)) : 0;

    const recordFiles = (project.files || []).filter((f) => f.category === 'proof');
    const recordStart = recordFiles[0];
    const recordEnd = recordFiles[1];
    const pastScheduled = currentIdx > 0;
    const pastShooting = currentIdx > 1;
    const proofStartUploaded = !!recordStart;
    const proofEndUploaded = !!recordEnd;

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm) return;
        try {
            await api.delete(`/files/${deleteConfirm.id}`);
            toast.success('File dihapus.');
            setDeleteConfirm(null);
            load();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal menghapus file.'));
            setDeleteConfirm(null);
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

    const submitRerequest = async () => {
        setSaving(true);
        try {
            await api.post(`/projects/${id}/redelivery-requests`, { note: rerequestNote });
            toast.success('Permintaan unduh ulang dikirim.');
            setRerequestOpen(false);
            setRerequestNote('');
            load();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal mengirim permintaan.'));
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
                toast.success('Review Anda diperbarui.');
            } else {
                await api.post('/reviews', payload);
                toast.success('Review berhasil dikirim.');
            }
            setReviewOpen(false);
            load();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal mengirim review.'));
        } finally {
            setSaving(false);
        }
    };

    const openChat = () => {
        navigate(`/dashboard/client-messages?pesanan=${project.order_no || project.id}`);
    };

    const previewHref = `/dashboard/preview/${project.order_no || project.id}`;
    const previewLink = window.location.origin + previewHref;
    const paidAt = [...(project.payments || [])].filter((p) => p.status === 'confirmed').slice(-1)[0]?.created_at || project.completed_at || null;

    const copyPreviewLink = async () => {
        try {
            await copyToClipboard(previewLink);
            toast.success('Link pratinjau disalin.');
        } catch {
            toast.error('Gagal menyalin link.');
        }
    };

    const ctx = {
        PanelHeader, PanelFooter,
        project, pastScheduled, pastShooting,
        proofStartUploaded, proofEndUploaded, recordStart, recordEnd,
        saving, fileRef,
        hasPhoto, hasVideo, photoDone, photoTotal, photoPct, videoDone, videoTotal, videoPct,
        previewHref, previewLink, copyPreviewLink,
        isPaid, paidAt,
        setDeleteConfirm,
        openReview, existingReview, canReview, setReviewOpen, openChat,
        feeMap, setFeeMap, reviewRedelivery, setRerequestOpen,
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
                        <p className="mt-1 text-sm text-ink-muted">Langkah ini belum tersedia. Saat ini Anda berada di tahap <span className="font-semibold text-ink">{STEPS[currentIdx]?.label}</span>.</p>
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
            </div>

            {/* CATATAN RIWAYAT */}
            <div className="card mt-6 p-4 sm:p-5">
                <h3 className="mb-4 flex items-center gap-2 font-semibold text-ink"><Icon name="clock" size={16} /> Catatan Riwayat</h3>
                <div className="relative ml-1 space-y-5 border-l-2 border-line/50 pl-4 sm:ml-2 sm:pl-5">
                    {(project.updates || []).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).length ? (
                        project.updates.slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((u) => (
                            <div key={u.id} className="relative min-w-0">
                                <span className={`absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-surface sm:-left-[27px] ${u.kind === 'system' ? 'bg-brand-500' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
                                <p className={`break-words text-sm ${u.kind === 'system' ? 'text-ink' : 'text-ink-muted'}`}>{u.message}</p>
                                <p className="mt-0.5 flex flex-wrap text-xs text-ink-muted/80">{u.kind === 'system' ? 'Update' : u.user || 'Tim'} · {formatDate(u.created_at)}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-ink-muted">Belum ada riwayat tercatat.</p>
                    )}
                </div>
            </div>

            {/* DELETE FILE CONFIRM */}
            <Confirm open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDeleteConfirm} title="Hapus File?" message="File akan dihapus secara permanen." />

            {/* REREQUEST MODAL */}
            <Modal open={rerequestOpen} onClose={() => setRerequestOpen(false)} title="Ajukan Unduh Ulang" footer={
                <button className="btn-primary" onClick={submitRerequest} disabled={saving}>{saving ? 'Mengirim...' : 'Kirim'}</button>
            }>
                <Field label="Catatan" hint="opsional">
                    <textarea className="input min-h-[80px]" placeholder="Jelaskan alasan permintaan..." value={rerequestNote} onChange={(e) => setRerequestNote(e.target.value)} />
                </Field>
            </Modal>

            {/* REVIEW MODAL */}
            <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title={existingReview ? 'Edit Review' : 'Beri Review'} footer={
                <button className="btn-primary" form="review-form" type="submit" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
            }>
                <form id="review-form" onSubmit={submitReview} className="space-y-4">
                    <Field label="Rating" required>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button key={n} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: n })}>
                                    <Icon name="star" size={24} className={n <= reviewForm.rating ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-700'} />
                                </button>
                            ))}
                        </div>
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
        </>
    );
}
