import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { Spinner, Field, useToast, formatRupiah, formatDate, Modal, EmptyState } from '../components/ui';
import { StatusBadge } from './Projects';

const STEPS = [
    { key: 'scheduled', label: 'Dijadwalkan', icon: 'calendar' },
    { key: 'shooting', label: 'Pemotretan', icon: 'camera' },
    { key: 'editing', label: 'Editing', icon: 'edit' },
    { key: 'awaiting_payment', label: 'Menunggu Pembayaran', icon: 'credit-card' },
    { key: 'completed', label: 'Selesai', icon: 'check' },
    { key: 'archived', label: 'Arsip', icon: 'archive' },
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

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const { user } = useAuth();
    const isAdmin = ['owner', 'admin'].includes(user?.role);

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(null);
    const [updateText, setUpdateText] = useState('');
    const [uploading, setUploading] = useState(false);
    const [paymentForm, setPaymentForm] = useState({ amount: '', notes: '', proof: null });
    const [progressForm, setProgressForm] = useState({ total: '', done: '' });
    const [saving, setSaving] = useState(false);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', content: '', recommend_score: 10 });
    const fileRef = useRef(null);
    const proofRef = useRef(null);
    const { show, node } = useToast();

    const load = () => {
        api.get(`/projects/${id}`).then(({ data }) => setProject(data)).finally(() => setLoading(false));
    };

    useEffect(load, [id]);

    if (loading) return <Spinner />;
    if (!project) return <EmptyState title="Pesanan tidak ditemukan" />;

    const totalPaid = (project.payments || []).filter((p) => p.status === 'confirmed').reduce((s, p) => s + Number(p.amount), 0);
    const remaining = (Number(project.price) || 0) - totalPaid;
    const isPaid = remaining <= 0;

    const currentIdx = STEPS.findIndex((s) => s.key === project.status);
    const activeKey = step || project.status;
    const activeIdx = STEPS.findIndex((s) => s.key === activeKey);
    const nextStep = currentIdx >= 0 && currentIdx < STEPS.length - 1 ? STEPS[currentIdx + 1] : null;
    const isReached = activeIdx <= currentIdx;
    const isCurrentStep = activeKey === project.status;

    const advance = async () => {
        setSaving(true);
        try {
            await api.post(`/projects/${id}/advance`);
            show('Alur pesanan dilanjutkan.');
            setStep(null); // Reset view to real current
            await load();
        } catch (err) {
            show(err.response?.data?.message || 'Gagal melanjutkan alur.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const addUpdate = async (e) => {
        e.preventDefault();
        if (!updateText.trim()) return;
        await api.post(`/projects/${id}/updates`, { message: updateText });
        setUpdateText('');
        show('Timeline ditambah.');
        load();
    };

    const submitProgress = async (e) => {
        e.preventDefault();
        if (!progressForm.done) return;
        await api.post(`/projects/${id}/updates`, { message: `Proses editing: ${progressForm.done}${progressForm.total ? `/${progressForm.total}` : ''} selesai dikerjakan.` });
        setProgressForm({ total: '', done: '' });
        show('Progres diperbarui.');
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

    const deleteFile = async (file) => {
        if (!confirm('Hapus file ini?')) return;
        await api.delete(`/files/${file.id}`);
        show('File dihapus.');
        load();
    };

    const submitPayment = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('amount', paymentForm.amount);
        data.append('method', 'manual_transfer');
        data.append('notes', paymentForm.notes || '');
        if (paymentForm.proof) data.append('proof_file', paymentForm.proof);
        await api.post(`/projects/${id}/payments`, data);
        show('Pembayaran dikirim untuk dikonfirmasi.');
        setPaymentForm({ amount: '', notes: '', proof: null });
        load();
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

                <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3">
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
                </div>
            </div>

            {/* STEPPER NAV */}
            <div className="card mb-6 p-5">
                <div className="flex items-center flex-wrap gap-x-1 gap-y-3">
                    {STEPS.map((s, i) => {
                        const isDone = i < currentIdx;
                        const isCurReal = i === currentIdx;
                        const isSelected = i === activeIdx;
                        return (
                            <button
                                key={s.key}
                                type="button"
                                onClick={() => setStep(s.key)}
                                className="group flex flex-col items-center gap-1.5"
                            >
                                <span className="flex items-center">
                                    <span className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                                        isSelected ? 'border-brand-600 bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                                        : isDone ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                                        : isCurReal && !isSelected ? 'border-brand-600 text-brand-600'
                                        : 'border-line bg-surface text-ink-muted/60'
                                    }`}>
                                        <Icon name={isDone && !isSelected ? 'check' : s.icon} size={18} />
                                    </span>
                                    {i < STEPS.length - 1 && (
                                        <span className={`ml-1 h-0.5 w-6 sm:w-12 lg:w-16 ${i < currentIdx ? 'bg-emerald-500' : 'bg-line'} -mb-12`} />
                                    )}
                                </span>
                                <span className={`text-[11px] font-semibold leading-tight ${isSelected ? 'text-ink' : 'text-ink-muted'}`}>{s.label}</span>
                            </button>
                        );
                    })}
                </div>
                {/* Advance Button (only shows when viewing the REAL current step) */}
                {isAdmin && isCurrentStep && currentIdx >= 0 && currentIdx < STEPS.length - 1 && (
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                        <p className="text-sm text-ink-muted">
                            {nextStep.key === 'shooting' && project.event_start ? <>Pindah otomatis ke Pemotretan saat jadwal tiba.</> : ''}
                            {nextStep.key === 'editing' && project.event_end ? <>Pindah otomatis ke Editing saat acara selesai.</> : ''}
                            {nextStep.key === 'completed' && !isPaid ? <>Selesaikan pelunasan untuk pindah ke Selesai.</> : ''}
                        </p>
                        <button className="btn-primary" onClick={advance} disabled={saving || (nextStep.key === 'completed' && !isPaid)}>
                            {nextStep.key === 'completed' && !isPaid ? 'Menunggu Pelunasan' : saving ? 'Memproses...' : `Lanjut ke ${nextStep.label}`}
                        </button>
                    </div>
                )}
            </div>

            {/* TAB PANELS (Contextual content based on activeStepKey) */}
            <div className="space-y-6">
                
                {/* SCHEDULED */}
                {activeKey === 'scheduled' && (
                    <div className="card border-l-4 border-l-amber-500 p-5">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-ink">Pesanan Terjadwal</h3>
                            <p className="text-sm text-ink-muted mt-1">Admin telah menjadwalkan pesanan ini. Siap diproses pada waktu yang ditentukan.</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 rounded-xl bg-surface-muted p-4 mb-4">
                            <div><p className="text-xs text-ink-muted">Waktu Mulai Acara</p><p className="font-semibold text-ink">{project.event_start ? formatDate(project.event_start) + ' ' + project.event_start.slice(11,16) : '-'}</p></div>
                            <div><p className="text-xs text-ink-muted">Waktu Selesai Acara</p><p className="font-semibold text-ink">{project.event_end ? formatDate(project.event_end) + ' ' + project.event_end.slice(11,16) : '-'}</p></div>
                        </div>
                        <button className="btn-outline" onClick={openChat}><Icon name="message-circle" size={16} /> Kirim Pesan Pesanan Ini</button>
                    </div>
                )}

                {/* SHOOTING */}
                {activeKey === 'shooting' && (
                    <div className="card border-l-4 border-l-sky-500 p-5">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-ink">Pemotretan Sedang Berlangsung</h3>
                            <p className="text-sm text-ink-muted mt-1">Tim sedang / segera tiba di lokasi acara. Jangan lupa siapkan keperluan dokumentasi di lokasi.</p>
                        </div>
                        {isAdmin && (
                            <div className="mb-4 border-t border-line pt-4">
                                <p className="mb-2 text-sm font-semibold text-ink">Upload Gambar Detail (opsional)</p>
                                <button className="btn-outline" onClick={() => fileRef.current?.click()} disabled={!isCurrentStep}><Icon name="upload" size={16} /> Upload Gambar</button>
                                <input ref={fileRef} type="file" className="hidden" onChange={uploadFile} />
                            </div>
                        )}
                        {project.files?.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                                {project.files.map(f => (
                                    <div key={f.id} className="aspect-square bg-surface-muted rounded-xl overflow-hidden relative group">
                                        <img src={f.url} className="w-full h-full object-cover" alt="" />
                                        {isAdmin && <button className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100" onClick={() => deleteFile(f)}><Icon name="trash" size={14}/></button>}
                                    </div>
                                ))}
                            </div>
                        )}
                        <button className="btn-outline mt-4" onClick={openChat}><Icon name="message-circle" size={16} /> Kirim Pesan Pesanan Ini</button>
                    </div>
                )}

                {/* EDITING */}
                {activeKey === 'editing' && (
                    <div className="card border-l-4 border-l-indigo-500 p-5">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-ink">Proses Editing</h3>
                            <p className="text-sm text-ink-muted mt-1">Tim kami sedang mengedit file media pesanan Anda.</p>
                        </div>
                        <div className="rounded-xl bg-surface-muted p-4 mb-4">
                            <p className="text-sm font-semibold text-ink">Update Progres Terakhir</p>
                            {project.updates?.filter(u => u.message.startsWith('Proses editing')).length ? (
                                <p className="text-sm text-ink mt-1">{project.updates.filter(u => u.message.startsWith('Proses editing'))[0].message}</p>
                            ) : <p className="text-sm text-ink-muted mt-1">Belum ada progres tercatat.</p>}
                        </div>
                        {isAdmin && isCurrentStep && (
                            <form onSubmit={submitProgress} className="mb-4 border-t border-line pt-4">
                                <p className="mb-2 text-sm font-semibold text-ink">Update Progres Baru</p>
                                <div className="flex flex-wrap items-end gap-3">
                                    <Field label="Total Item">
                                        <input className="input" type="number" value={progressForm.total} onChange={e => setProgressForm({...progressForm, total: e.target.value})} placeholder="300" />
                                    </Field>
                                    <Field label="Selesai" required>
                                        <input className="input" type="number" value={progressForm.done} onChange={e => setProgressForm({...progressForm, done: e.target.value})} required placeholder="150" />
                                    </Field>
                                    <button className="btn-primary">Update Progres</button>
                                </div>
                            </form>
                        )}
                        {isAdmin && isCurrentStep && (
                            <div className="border-t border-line pt-4">
                                <p className="text-sm text-ink-muted mb-2">Upload hasil akhir ke Preview sebelum lanjut.</p>
                                <button className="btn-outline" onClick={() => fileRef.current?.click()}><Icon name="upload" size={16} /> Upload ke Preview</button>
                                <input ref={fileRef} type="file" className="hidden" onChange={uploadFile} />
                            </div>
                        )}
                        <button className="btn-outline mt-4" onClick={openChat}><Icon name="message-circle" size={16} /> Chat Pesanan</button>
                    </div>
                )}

                {/* AWAITING PAYMENT */}
                {activeKey === 'awaiting_payment' && (
                    <div className="card border-l-4 border-l-orange-500 p-5">
                        <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                            <div>
                                <h3 className="text-lg font-bold text-ink">Menunggu Pembayaran</h3>
                                <p className="text-sm text-ink-muted mt-1">Silakan lunasi invoice untuk membuka akses unduhan HD penuh.</p>
                            </div>
                            <Link to={`/dashboard/preview/${project.order_no || project.id}`} className="btn-outline">
                                <Icon name="eye" size={16} /> Lihat Preview Media
                            </Link>
                        </div>

                        {project.invoice && (
                            <div className="grid gap-4 sm:grid-cols-4 rounded-xl border border-line bg-surface p-4 mb-6">
                                <div><p className="text-xs text-ink-muted">No. Invoice</p><p className="font-mono font-bold text-ink">{project.invoice.number}</p></div>
                                <div><p className="text-xs text-ink-muted">DP / Tanda Jadi</p><p className="font-bold text-ink">{formatRupiah(project.invoice.dp_amount)}</p></div>
                                <div><p className="text-xs text-ink-muted">Sisa Tagihan</p><p className={`font-bold ${isPaid ? 'text-emerald-600' : 'text-red-600'}`}>{formatRupiah(remaining)}</p></div>
                                <div><p className="text-xs text-ink-muted">Status</p>
                                    <span className={`badge mt-1 ${project.invoice.status === 'paid' ? 'bg-emerald-500/15 text-emerald-600' : project.invoice.status === 'awaiting_dp' ? 'bg-red-500/15 text-red-600' : project.invoice.status === 'partial' ? 'bg-amber-500/15 text-amber-600' : 'bg-zinc-500/15 text-zinc-600'}`}>
                                        {project.invoice.status === 'paid' ? 'Lunas' : project.invoice.status === 'awaiting_dp' ? 'Menunggu DP' : project.invoice.status === 'partial' ? 'DP/Cicilan' : 'Belum Bayar'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {!isPaid && (!isAdmin || isCurrentStep) && (
                            <form onSubmit={submitPayment} className="rounded-xl border border-line p-5 mb-6 bg-surface-muted/30">
                                <h4 className="mb-4 font-semibold text-ink">Form Pembayaran Manual</h4>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Jumlah Transfer (Rp)" required>
                                        <input className="input" type="number" min="0" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} required disabled={!isCurrentStep && isAdmin}/>
                                    </Field>
                                    <Field label="Bukti Transfer (opsional)">
                                        <button type="button" className="input flex items-center gap-2 text-left text-ink-muted" onClick={() => proofRef.current?.click()} disabled={!isCurrentStep && isAdmin}>
                                            <Icon name="upload" size={16} /> {paymentForm.proof ? paymentForm.proof.name : 'Upload bukti...'}
                                        </button>
                                        <input ref={proofRef} type="file" className="hidden" onChange={(e) => setPaymentForm({...paymentForm, proof: e.target.files[0]})} />
                                    </Field>
                                    <div className="sm:col-span-2">
                                        <button className="btn-primary" disabled={(!isCurrentStep && isAdmin) || saving}>Konfirmasi Transfer</button>
                                    </div>
                                </div>
                            </form>
                        )}

                        {project.payments?.length > 0 && (
                            <div>
                                <h4 className="mb-3 font-semibold text-ink text-sm">Riwayat Pembayaran</h4>
                                <div className="overflow-x-auto rounded-xl border border-line">
                                    <table className="table mb-0">
                                        <thead><tr><th>Tanggal</th><th>Jumlah</th><th>Status</th></tr></thead>
                                        <tbody>
                                            {project.payments.map((p) => (
                                                <tr key={p.id}>
                                                    <td className="text-sm text-ink-muted">{formatDate(p.created_at)}</td>
                                                    <td className="font-semibold text-ink">{formatRupiah(p.amount)}</td>
                                                    <td>
                                                        <span className={`badge ${p.status === 'confirmed' ? 'bg-emerald-500/15 text-emerald-600' : p.status === 'pending' ? 'bg-amber-500/15 text-amber-600' : 'bg-red-500/15 text-red-600'}`}>
                                                            {p.status === 'confirmed' ? 'Terkonfirmasi' : p.status === 'pending' ? 'Menunggu' : 'Ditolak'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* COMPLETED */}
                {activeKey === 'completed' && (
                    <div className="card border-l-4 border-l-emerald-500 p-5">
                        <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                            <div>
                                <h3 className="text-lg font-bold text-ink">Pesanan Selesai</h3>
                                <p className="text-sm text-ink-muted mt-1">Terima kasih. File HD dapat diunduh melalui tautan di bawah.</p>
                            </div>
                            <Link to={`/dashboard/preview/${project.order_no || project.id}`} className="btn-primary">
                                <Icon name="download" size={16} /> Buka Halaman Unduh
                            </Link>
                        </div>
                        {!isAdmin && (
                            <div className="rounded-xl border border-line bg-surface-muted/30 p-5 text-center">
                                <p className="mb-4 text-sm text-ink-muted">Bagikan pengalaman Anda bekerja bersama kami.</p>
                                <button className="btn-primary" onClick={() => setReviewOpen(true)}><Icon name="star" size={16} /> Berikan Review</button>
                            </div>
                        )}
                    </div>
                )}

                {/* ARCHIVED */}
                {activeKey === 'archived' && (
                    <div className="card border-l-4 border-l-zinc-500 p-5">
                        <h3 className="text-lg font-bold text-ink">Pesanan Diarsipkan</h3>
                        <p className="text-sm text-ink-muted mt-1">File proyek telah diarsipkan karena masa retensi berakhir. Hubungi admin bila Anda masih membutuhkan akses.</p>
                    </div>
                )}

                {/* TIMELINE LOG (Always visible at bottom) */}
                <div className="mt-8 pt-6 border-t border-line">
                    <h3 className="font-semibold text-ink mb-4 flex items-center gap-2"><Icon name="clock" size={16}/> Catatan Riwayat</h3>
                    {isAdmin && (
                        <form onSubmit={addUpdate} className="mb-6 flex gap-2">
                            <input className="input" placeholder="Tulis log sistem atau catatan manual..." value={updateText} onChange={(e) => setUpdateText(e.target.value)} />
                            <button className="btn-primary shrink-0" disabled={!updateText.trim()}><Icon name="send" size={16} /></button>
                        </form>
                    )}
                    <div className="relative space-y-5 border-l-2 border-line/50 pl-5 ml-2">
                        {project.updates?.length ? (
                            project.updates.map((u) => (
                                <div key={u.id} className="relative">
                                    <span className={`absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-surface ${u.kind === 'system' ? 'bg-brand-500' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
                                    <p className={`text-sm ${u.kind === 'system' ? 'text-ink' : 'text-ink-muted'}`}>{u.message}</p>
                                    <p className="mt-0.5 text-xs text-ink-muted/80">{u.kind === 'system' ? 'Sistem' : u.user?.name || 'Admin'} · {formatDate(u.created_at)}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-ink-muted">Belum ada riwayat tercatat.</p>
                        )}
                    </div>
                </div>
            </div>

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
            {node}
        </>
    );
}