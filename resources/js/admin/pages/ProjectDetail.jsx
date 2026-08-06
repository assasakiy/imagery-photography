import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { Spinner, Field, Modal, useToast, formatRupiah, formatDate } from '../components/ui';
import { StatusBadge, statusOptions } from './Projects';

export default function ProjectDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const isAdmin = ['admin', 'owner'].includes(user?.role);
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updateText, setUpdateText] = useState('');
    const [uploading, setUploading] = useState(false);
    const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'manual_transfer', notes: '', proof: null });
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

    const addUpdate = async (e) => {
        e.preventDefault();
        if (!updateText.trim()) return;
        await api.post(`/projects/${id}/updates`, { message: updateText });
        setUpdateText('');
        load();
    };

    const changeStatus = async (status) => {
        await api.patch(`/projects/${id}/status`, { status });
        load();
    };

    const uploadFile = async (file) => {
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
        await api.delete(`/files/${file.id}`);
        show('File dihapus.');
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
                        {project.client && (
                            <span className="flex items-center gap-1.5 text-sm text-ink-muted">
                                <Icon name="user" size={14} /> {project.client.name}
                            </span>
                        )}
                    </div>
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        {statusOptions.map((s) => (
                            <button
                                key={s.value}
                                onClick={() => changeStatus(s.value)}
                                disabled={project.status === s.value}
                                className="btn-outline disabled:opacity-40"
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="card p-4">
                    <p className="text-xs text-ink-muted">Nilai Project</p>
                    <p className="mt-1 text-lg font-bold text-ink">{formatRupiah(project.price)}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-ink-muted">Sudah Dibayar</p>
                    <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(totalPaid)}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-ink-muted">Sisa</p>
                    <p className="mt-1 text-lg font-bold text-red-600 dark:text-red-400">{formatRupiah(remaining)}</p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-ink-muted">Jadwal</p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                        {project.start_date ? formatDate(project.start_date) : '-'} → {project.end_date ? formatDate(project.end_date) : '-'}
                    </p>
                </div>
                <div className="card p-4">
                    <p className="text-xs text-ink-muted">Jenis / Acara</p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                        {project.type || '-'}
                        {project.event_date && (
                            <span className="block text-xs font-normal text-ink-muted">{formatDate(project.event_date)}</span>
                        )}
                    </p>
                </div>
            </div>

            {project.description && (
                <div className="card mb-6 p-5">
                    <h3 className="mb-2 font-semibold text-ink">Deskripsi</h3>
                    <p className="text-sm leading-relaxed text-ink-muted">{project.description}</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Files */}
                <div className="card p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-ink">File</h3>
                        {isAdmin && (
                            <button className="btn-primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
                                <Icon name="upload" size={16} /> {uploading ? 'Mengupload...' : 'Upload'}
                            </button>
                        )}
                        <input ref={fileRef} type="file" className="hidden" onChange={(e) => uploadFile(e.target.files[0])} />
                    </div>
                    {project.files?.length ? (
                        <ul className="divide-y divide-line">
                            {project.files.map((file) => (
                                <li key={file.id} className="flex items-center gap-3 py-2.5">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-muted text-ink-muted">
                                        <Icon name="file" size={16} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <a
                                            href={file.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block truncate text-sm font-medium text-ink hover:text-brand-600"
                                        >
                                            {file.original_name}
                                        </a>
                                        <p className="text-xs text-ink-muted">
                                            {(file.size / 1024).toFixed(0)} KB · {formatDate(file.created_at)}
                                        </p>
                                    </div>
                                    {isAdmin && (
                                        <button onClick={() => deleteFile(file)} className="icon-btn hover:!text-red-500" aria-label="Hapus file">
                                            <Icon name="trash" size={16} />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-ink-muted">Belum ada file.</p>
                    )}
                </div>

                {/* Timeline */}
                <div className="card p-5">
                    <h3 className="mb-4 font-semibold text-ink">Perkembangan</h3>
                    {isAdmin && (
                        <form onSubmit={addUpdate} className="mb-4 flex gap-2">
                            <input
                                className="input"
                                placeholder="Tulis update baru..."
                                value={updateText}
                                onChange={(e) => setUpdateText(e.target.value)}
                            />
                            <button className="btn-primary shrink-0" disabled={!updateText.trim()}>
                                <Icon name="send" size={16} />
                            </button>
                        </form>
                    )}
                    <ol className="relative space-y-5 border-l border-line pl-5">
                        {project.updates?.length ? (
                            project.updates.map((u) => (
                                <li key={u.id} className="relative">
                                    <span className={`absolute -left-[25px] top-1 h-3 w-3 rounded-full ${u.type === 'milestone' ? 'bg-brand-500' : 'bg-surface-muted ring-2 ring-line'}`} />
                                    <p className="text-sm text-ink">{u.message}</p>
                                    <p className="mt-0.5 text-xs text-ink-muted">
                                        {u.user?.name || 'Admin'} · {formatDate(u.created_at)}
                                    </p>
                                </li>
                            ))
                        ) : (
                            <li className="text-sm text-ink-muted">Belum ada update.</li>
                        )}
                    </ol>
                </div>
            </div>

            {/* Client info (read-only) + link ke halaman Klien */}
            {project.client && (
                <div className="card mt-6 p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="font-semibold text-ink">Klien</h3>
                            <p className="mt-1 text-sm text-ink-muted">Informasi kontak klien pesanan ini.</p>
                        </div>
                        <Link to="/dashboard/clients" className="btn-outline">
                            <Icon name="user" size={16} /> Lihat Detail Klien
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-surface-muted p-3">
                            <p className="text-xs text-ink-muted">Nama</p>
                            <p className="font-semibold text-ink">{project.client.name}</p>
                        </div>
                        <div className="rounded-xl bg-surface-muted p-3">
                            <p className="text-xs text-ink-muted">Email</p>
                            <p className="truncate text-sm text-ink">{project.client.email || '-'}</p>
                        </div>
                        <div className="rounded-xl bg-surface-muted p-3">
                            <p className="text-xs text-ink-muted">WhatsApp</p>
                            <p className="text-sm text-ink">{project.client.phone || '-'}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Payments (client: submit; admin: table) */}
            <div className="card mt-6 p-5">
                <h3 className="mb-4 font-semibold text-ink">Pembayaran</h3>
                {!isAdmin && (
                    <form onSubmit={submitPayment} className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                )}
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
                                                <a href={p.proof_url || `/storage/${p.proof_file}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline dark:text-brand-400">
                                                    Lihat <Icon name="eye" size={14} />
                                                </a>
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
                    <p className="text-sm text-ink-muted">Belum ada pembayaran.</p>
                )}
            </div>
            {node}
        </>
    );
}
