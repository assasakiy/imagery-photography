import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { Spinner, Field, useToast, formatRupiah, formatDate, Modal, EmptyState } from '../components/ui';
import { StatusBadge, statusOptions } from './Projects';

const TABS = [
    { key: 'ringkasan', label: 'Ringkasan', icon: 'dashboard' },
    { key: 'timeline', label: 'Timeline', icon: 'clock' },
    { key: 'preview', label: 'Preview', icon: 'image' },
    { key: 'invoice', label: 'Invoice', icon: 'credit-card' },
    { key: 'download', label: 'Download', icon: 'download' },
    { key: 'pesan', label: 'Pesan', icon: 'message-circle' },
    { key: 'review', label: 'Review', icon: 'star' },
];

function Stars({ value, onChange }) {
    return (
        <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    type="button"
                    onClick={() => onChange?.(n)}
                    disabled={!onChange}
                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                >
                    <Icon name="star" size={24} className={n <= value ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-700'} />
                </button>
            ))}
        </div>
    );
}

export default function ProjectDetail() {
    const { id } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'ringkasan';
    
    const { user } = useAuth();
    const isAdmin = ['admin', 'owner'].includes(user?.role);
    
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updateText, setUpdateText] = useState('');
    const [uploading, setUploading] = useState(false);
    const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'manual_transfer', notes: '', proof: null });
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
    if (!project) return <p className="text-ink-muted">Project tidak ditemukan.</p>;

    const totalPaid = (project.payments || []).filter((p) => p.status === 'confirmed').reduce((s, p) => s + Number(p.amount), 0);
    const remaining = (Number(project.price) || 0) - totalPaid;
    const isPaid = remaining <= 0;

    const setTab = (key) => setSearchParams({ tab: key });

    const changeStatus = async (status) => {
        await api.patch(`/projects/${id}/status`, { status });
        show('Status diperbarui.');
        load();
    };

    const addUpdate = async (e) => {
        e.preventDefault();
        if (!updateText.trim()) return;
        await api.post(`/projects/${id}/updates`, { message: updateText });
        setUpdateText('');
        show('Timeline ditambah.');
        load();
    };

    const uploadFile = async (e, defaultStatus = 'preparing') => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const data = new FormData();
            data.append('file', file);
            data.append('gallery_status', defaultStatus);
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

    const changeGalleryStatus = async (status) => {
        await api.patch(`/projects/${id}/gallery-status`, { gallery_status: status });
        show('Status galeri diperbarui.');
        load();
    };

    const submitPayment = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('amount', paymentForm.amount);
        data.append('method', paymentForm.method);
        data.append('notes', paymentForm.notes || '');
        if (paymentForm.proof) data.append('proof_file', paymentForm.proof);
        await api.post(`/projects/${id}/payments`, data);
        show('Pembayaran dikirim untuk dikonfirmasi.');
        setPaymentForm({ amount: '', method: 'manual_transfer', notes: '', proof: null });
        load();
    };


    const submitReview = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/reviews', {
                project_id: project.id,
                name: project.user?.name || 'Klien',
                service: project.type || 'Layanan',
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

    return (
        <>
            <Link to="/dashboard/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-brand-600">
                <Icon name="arrow-left" size={16} /> Kembali
            </Link>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-ink">{project.name}</h1>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge value={project.status} />
                        {project.user && (
                            <span className="flex items-center gap-1.5 text-sm text-ink-muted">
                                <Icon name="user" size={14} /> {project.user.name}
                            </span>
                        )}
                    </div>
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        <select className="input !py-2 !pl-3 !pr-8 text-sm" value={project.status} onChange={(e) => changeStatus(e.target.value)}>
                            {statusOptions.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex whitespace-nowrap items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                            activeTab === t.key ? 'bg-brand-600 text-white shadow' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                        }`}
                    >
                        <Icon name={t.icon} size={16} /> <span className="hidden sm:inline">{t.label}</span>
                    </button>
                ))}
            </div>

            {/* TAB: RINGKASAN */}
            {activeTab === 'ringkasan' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                        <div className="rounded-2xl border border-line bg-surface p-4">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted uppercase tracking-wider"><Icon name="wallet" size={14} /> Nilai Project</p>
                            <p className="mt-2 truncate text-lg font-bold text-ink">{formatRupiah(project.price)}</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider"><Icon name="check" size={14} /> Dibayar</p>
                            <p className="mt-2 truncate text-lg font-bold text-emerald-700 dark:text-emerald-300">{formatRupiah(totalPaid)}</p>
                        </div>
                        <div className={`rounded-2xl border p-4 ${remaining > 0 ? 'border-amber-500/20 bg-amber-500/5' : 'border-line bg-surface'}`}>
                            <p className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${remaining > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-ink-muted'}`}><Icon name="clock" size={14} /> Sisa Tagihan</p>
                            <p className={`mt-2 truncate text-lg font-bold ${remaining > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-ink'}`}>{formatRupiah(remaining)}</p>
                        </div>
                        <div className="rounded-2xl border border-line bg-surface p-4">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted uppercase tracking-wider"><Icon name="calendar" size={14} /> Jadwal</p>
                            <p className="mt-2 truncate text-sm font-semibold text-ink">{project.event_date ? formatDate(project.event_date) : '-'}</p>
                        </div>
                        <div className="rounded-2xl border border-line bg-surface p-4 hidden lg:block">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted uppercase tracking-wider"><Icon name="briefcase" size={14} /> Jenis</p>
                            <p className="mt-2 truncate text-sm font-semibold text-ink">{project.type || '-'}</p>
                        </div>
                    </div>

                    {project.description && (
                        <div className="card p-5">
                            <h3 className="mb-3 font-semibold text-ink">Catatan Project</h3>
                            <div className="prose prose-sm dark:prose-invert max-w-none text-ink">{project.description}</div>
                        </div>
                    )}

                    {isAdmin && project.user && (
                        <div className="card p-5">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <h3 className="font-semibold text-ink">Klien</h3>
                                <Link to="/dashboard/clients" className="btn-outline text-xs py-1.5 px-3">Lihat Detail Klien</Link>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div className="rounded-xl bg-surface-muted p-3">
                                    <p className="text-xs text-ink-muted">Nama</p><p className="font-semibold text-ink">{project.user.name}</p>
                                </div>
                                <div className="rounded-xl bg-surface-muted p-3">
                                    <p className="text-xs text-ink-muted">Email</p><p className="truncate text-sm text-ink">{project.user.email || '-'}</p>
                                </div>
                                <div className="rounded-xl bg-surface-muted p-3">
                                    <p className="text-xs text-ink-muted">WhatsApp</p><p className="text-sm text-ink">{project.user.phone || '-'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB: TIMELINE */}
            {activeTab === 'timeline' && (
                <div className="card p-5">
                    {isAdmin && (
                        <form onSubmit={addUpdate} className="mb-6 flex gap-2 border-b border-line pb-6">
                            <input className="input" placeholder="Tulis catatan atau log manual..." value={updateText} onChange={(e) => setUpdateText(e.target.value)} />
                            <button className="btn-primary shrink-0" disabled={!updateText.trim()}><Icon name="send" size={16} /></button>
                        </form>
                    )}
                    <div className="relative border-l border-line pl-5 space-y-6">
                        {project.updates?.length ? (
                            project.updates.map((u) => (
                                <div key={u.id} className="relative">
                                    <span className={`absolute -left-[25px] top-1.5 h-3 w-3 rounded-full ring-4 ring-surface ${u.kind === 'system' ? 'bg-brand-500' : 'bg-zinc-400 dark:bg-zinc-500'}`} />
                                    <p className={`text-sm font-medium ${u.kind === 'system' ? 'text-ink' : 'text-ink-muted'}`}>{u.message}</p>
                                    <p className="mt-1 text-xs text-ink-muted">
                                        {u.kind === 'system' ? 'Sistem' : u.user?.name || 'Admin'} · {formatDate(u.created_at)}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-ink-muted">Belum ada timeline.</p>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: INVOICE */}
            {activeTab === 'invoice' && (
                <div className="space-y-6">
                    {project.invoice ? (
                        <div className="card p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div><p className="text-xs text-ink-muted">No. Invoice</p><p className="font-mono font-bold text-ink">{project.invoice.number}</p></div>
                            <div><p className="text-xs text-ink-muted">Status</p>
                                <span className={`badge mt-1 ${project.invoice.status === 'paid' ? 'bg-emerald-500/15 text-emerald-600' : project.invoice.status === 'partial' ? 'bg-amber-500/15 text-amber-600' : 'bg-red-500/15 text-red-600'}`}>
                                    {project.invoice.status === 'paid' ? 'Lunas' : project.invoice.status === 'partial' ? 'Cicilan/DP' : 'Belum Bayar'}
                                </span>
                            </div>
                            <div><p className="text-xs text-ink-muted">Total Tagihan</p><p className="font-bold text-ink">{formatRupiah(project.invoice.base_amount)}</p></div>
                            <div><p className="text-xs text-ink-muted">Sisa Pembayaran</p><p className={`font-bold ${isPaid ? 'text-emerald-600' : 'text-red-600'}`}>{formatRupiah(Math.max(0, project.invoice.base_amount - project.invoice.paid_amount))}</p></div>
                        </div>
                    ) : (
                        <EmptyState title="Belum ada invoice" message="Invoice dibuat otomatis saat pesanan dibuat." />
                    )}

                    <div className="card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-ink">Riwayat Pembayaran</h3>
                        </div>

                        {project.payments?.length ? (
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Tanggal</th>
                                            <th>Jumlah</th>
                                            <th>Metode</th>
                                            <th>Status</th>
                                            <th>Bukti</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {project.payments.map((p) => (
                                            <tr key={p.id}>
                                                <td className="text-sm text-ink-muted">{formatDate(p.created_at)}</td>
                                                <td className="font-semibold text-ink">{formatRupiah(p.amount)}</td>
                                                <td className="text-sm text-ink-muted">{p.method === 'gateway' ? 'Gateway' : 'Transfer Manual'}</td>
                                                <td>
                                                    <span className={`badge ${p.status === 'confirmed' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : p.status === 'pending' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'}`}>
                                                        {p.status === 'confirmed' ? 'Terkonfirmasi' : p.status === 'pending' ? 'Menunggu' : 'Ditolak'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {p.proof_file ? (
                                                        <a href={p.proof_url || `/storage/${p.proof_file}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">Lihat</a>
                                                    ) : (
                                                        <span className="text-sm text-ink-muted">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-ink-muted">Belum ada riwayat pembayaran.</p>
                        )}
                    </div>

                    {!isAdmin && !isPaid && (
                        <div className="card p-5 border border-brand-500/30">
                            <h3 className="mb-4 font-semibold text-ink">Kirim Pembayaran</h3>
                            <form onSubmit={submitPayment} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Jumlah (Rp)" required>
                                    <input className="input" type="number" min="0" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required />
                                </Field>
                                <Field label="Metode" required>
                                    <select className="input" value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}>
                                        <option value="manual_transfer">Transfer Manual</option>
                                        <option value="gateway">Payment Gateway</option>
                                    </select>
                                </Field>
                                <Field label="Bukti Transfer" hint="opsional">
                                    <button type="button" className="input flex items-center gap-2 text-left text-ink-muted" onClick={() => proofRef.current?.click()}>
                                        <Icon name="upload" size={16} /> {paymentForm.proof ? paymentForm.proof.name : 'Pilih file...'}
                                    </button>
                                    <input ref={proofRef} type="file" className="hidden" onChange={(e) => setPaymentForm({ ...paymentForm, proof: e.target.files[0] })} />
                                </Field>
                                <Field label="Catatan" hint="opsional">
                                    <input className="input" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
                                </Field>
                                <div className="sm:col-span-2">
                                    <button className="btn-primary" type="submit">Kirim Pembayaran</button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {/* TAB: PREVIEW & DOWNLOAD */}
            {(activeTab === 'preview' || activeTab === 'download') && (
                <div className="card p-5">
                    {isAdmin && (
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
                            <div>
                                <h3 className="font-semibold text-ink">Kelola Galeri</h3>
                                <p className="text-sm text-ink-muted">Set status ke Preview Ready agar klien bisa melihat, atau Released untuk download HD.</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="btn-outline" onClick={() => changeGalleryStatus('preview_ready')}>Set Preview Ready</button>
                                <button className="btn-primary" onClick={() => changeGalleryStatus('released')}>Rilis (Download HD)</button>
                                <button className="btn-outline" onClick={() => fileRef.current?.click()}>
                                    <Icon name="upload" size={16} /> Upload
                                </button>
                                <input ref={fileRef} type="file" className="hidden" onChange={(e) => uploadFile(e, activeTab === 'download' ? 'released' : 'preparing')} />
                            </div>
                        </div>
                    )}

                    {!isAdmin && activeTab === 'download' && !isPaid && (
                        <div className="mb-6 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-700 dark:text-amber-400">
                            <strong>Perhatian:</strong> Anda belum dapat mengunduh file HD. Silakan selesaikan pembayaran (Invoice) terlebih dahulu.
                        </div>
                    )}

                    {project.files?.filter(f => activeTab === 'download' ? f.gallery_status === 'released' : (f.gallery_status === 'preview_ready' || f.gallery_status === 'preparing')).length ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {project.files.filter(f => activeTab === 'download' ? f.gallery_status === 'released' : (f.gallery_status === 'preview_ready' || f.gallery_status === 'preparing')).map((f) => (
                                <div key={f.id} className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-surface-muted">
                                    {f.category === 'photo' || f.type.startsWith('image/') ? (
                                        <img src={f.url} alt={f.original_name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full flex-col items-center justify-center p-4 text-ink-muted">
                                            <Icon name={f.category === 'video' || f.type.startsWith('video/') ? 'video' : 'file'} size={32} />
                                            <p className="mt-2 truncate w-full text-center text-xs">{f.original_name}</p>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                                        <div className="flex gap-2">
                                            <a href={`/api/files/${f.id}/download`} className="rounded-lg bg-white/20 p-2 text-white hover:bg-white/40" title="Download">
                                                <Icon name="download" size={16} />
                                            </a>
                                            {isAdmin && (
                                                <button className="rounded-lg bg-red-500/80 p-2 text-white hover:bg-red-500" title="Hapus" onClick={() => deleteFile(f)}>
                                                    <Icon name="trash" size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {isAdmin && <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white backdrop-blur-md">{f.gallery_status}</span>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon="image" title={`Belum ada ${activeTab}`} message={`Tidak ada file dengan status ${activeTab}.`} />
                    )}
                </div>
            )}

            {/* TAB: PESAN */}
            {activeTab === 'pesan' && (
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-4 border-b border-line pb-4">
                        <div>
                            <h3 className="font-semibold text-ink">Pesan</h3>
                            <p className="text-sm text-ink-muted">Diskusi terkait project ini.</p>
                        </div>
                        {!isAdmin && (
                            <Link to="/dashboard/client-messages" className="btn-primary text-xs py-1.5 px-3">
                                Buka Pesan Penuh
                            </Link>
                        )}
                        {isAdmin && (
                            <Link to="/dashboard/messages" className="btn-primary text-xs py-1.5 px-3">
                                Buka Inbox
                            </Link>
                        )}
                    </div>
                    <EmptyState icon="message-circle" title="Pesan" message="Fitur pesan terintegrasi di sini segera hadir. Gunakan menu utama untuk mengirim pesan saat ini." />
                </div>
            )}

            {/* TAB: REVIEW */}
            {activeTab === 'review' && (
                <div className="card p-5">
                    <h3 className="mb-4 font-semibold text-ink">Review & Testimoni</h3>
                    {project.status === 'completed' && isPaid ? (
                        project.reviews?.length ? (
                            <div className="rounded-xl border border-line bg-surface p-4">
                                <div className="mb-2 flex items-center justify-between">
                                    <div className="flex gap-1 text-amber-400">
                                        {[...Array(5)].map((_, i) => <Icon key={i} name="star" size={16} className={i < project.reviews[0].rating ? 'text-amber-400' : 'text-zinc-300 dark:text-zinc-700'} />)}
                                    </div>
                                    <span className={`badge ${project.reviews[0].status === 'approved' ? 'bg-emerald-500/15 text-emerald-600' : project.reviews[0].status === 'rejected' ? 'bg-red-500/15 text-red-600' : 'bg-amber-500/15 text-amber-600'}`}>
                                        {project.reviews[0].status === 'approved' ? 'Disetujui' : project.reviews[0].status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                                    </span>
                                </div>
                                {project.reviews[0].title && <p className="font-semibold text-ink mb-1">{project.reviews[0].title}</p>}
                                <p className="text-sm text-ink">{project.reviews[0].content}</p>
                                {project.reviews[0].recommend_score !== null && (
                                    <p className="mt-3 text-xs font-semibold text-brand-600 dark:text-brand-400">Merekomendasikan: {project.reviews[0].recommend_score}/10</p>
                                )}
                            </div>
                        ) : !isAdmin ? (
                            <div className="rounded-xl bg-brand-500/5 border border-brand-500/20 p-6 text-center">
                                <p className="text-brand-600 dark:text-brand-400 font-bold mb-2">★★★★★ Berikan Testimoni</p>
                                <p className="text-sm text-brand-600/80 dark:text-brand-400/80 mb-6 max-w-md mx-auto">Pesanan telah selesai. Bagikan pengalaman Anda bekerja bersama kami.</p>
                                <button className="btn-primary" onClick={() => setReviewOpen(true)}>Tulis Review</button>
                            </div>
                        ) : (
                            <p className="text-sm text-ink-muted">Klien belum memberikan review.</p>
                        )
                    ) : (
                        <p className="text-sm text-ink-muted">Review dapat diberikan setelah pesanan berstatus Selesai dan Lunas.</p>
                    )}
                </div>
            )}

            <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title="Kirim Review & Testimoni" footer={
                <div className="flex justify-end gap-2">
                    <button type="button" className="btn-outline" onClick={() => setReviewOpen(false)}>Batal</button>
                    <button type="button" className="btn-primary" onClick={submitReview} disabled={saving}>{saving ? 'Mengirim...' : 'Kirim Review'}</button>
                </div>
            }>
                <form id="review-submit-form" className="space-y-4">
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
                        <textarea className="input min-h-[120px]" placeholder="Bagaimana hasil foto, pelayanan fotografer, dll..." value={reviewForm.content} onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })} required />
                    </Field>
                </form>
            </Modal>

            {node}
        </>
    );
}