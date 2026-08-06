import { useEffect, useState } from 'react';
import api from '../api';
import Icon from '../components/Icon';
import { PageHeader, Spinner, EmptyState, Modal, Field, useToast, formatDate } from '../components/ui';

const STATUS_META = {
    pending: { label: 'Menunggu', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    confirmed: { label: 'Dikonfirmasi', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    rejected: { label: 'Ditolak', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
    expired: { label: 'Kedaluwarsa', cls: 'bg-zinc-500/15 text-ink-muted' },
    converted: { label: 'Jadi Proyek', cls: 'bg-brand-500/15 text-brand-600 dark:text-brand-400' },
};

const STATUS_TABS = [
    { key: 'pending', label: 'Menunggu' },
    { key: 'confirmed', label: 'Dikonfirmasi' },
    { key: 'rejected', label: 'Ditolak' },
    { key: 'expired', label: 'Kadaluarsa' },
    { key: 'converted', label: 'Histori Proyek' },
];

export default function Bookings() {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [status, setStatus] = useState('pending');
    const [q, setQ] = useState('');
    const [debounced, setDebounced] = useState('');
    const [loading, setLoading] = useState(true);
    
    const [detail, setDetail] = useState(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const [acceptOpen, setAcceptOpen] = useState(false);
    const [acceptForm, setAcceptForm] = useState({});

    const { show, node } = useToast();

    const load = (page = 1, search = debounced) => {
        setLoading(true);
        api.get('/bookings', { params: { page, per_page: 15, status, q: search || undefined } })
            .then(({ data }) => {
                setItems(data.data);
                setMeta(data);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const t = setTimeout(() => setDebounced(q), 400);
        return () => clearTimeout(t);
    }, [q]);

    useEffect(() => {
        load(1, debounced);
    }, [status, debounced]);

    const openDetail = async (item) => {
        try {
            const { data } = await api.get(`/bookings/${item.id}`);
            setDetail(data);
        } catch {
            show('Gagal memuat booking.', 'error');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            const { data } = await api.put(`/bookings/${detail.id}`, form);
            show('Booking diperbarui.');
            setDetail(data);
            setEditing(false);
            load(meta.current_page);
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
        } finally {
            setSaving(false);
        }
    };

    const handleReject = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post(`/bookings/${detail.id}/reject`, { reason: rejectReason });
            show('Booking ditolak.');
            setRejectOpen(false);
            setDetail(null);
            load(meta.current_page);
        } catch {
            show('Gagal menolak booking.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleAccept = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            const { data } = await api.post(`/bookings/${detail.id}/accept`, acceptForm);
            show('Booking diterima & proyek dibuat.');
            setAcceptOpen(false);
            setDetail(null);
            load(meta.current_page);
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
        } finally {
            setSaving(false);
        }
    };

    const startEdit = () => {
        setForm({
            name: detail.name,
            email: detail.email || '',
            phone: detail.phone || '',
            location: detail.location || '',
            notes: detail.notes || '',
            price: detail.price || '',
        });
        setEditing(true);
    };

    const startAccept = () => {
        setAcceptForm({
            name: detail.package_label || detail.name,
            event_date: detail.event_date || '',
            description: detail.notes || '',
            price: detail.price || '',
        });
        setAcceptOpen(true);
    };

    return (
        <>
            <PageHeader title="Booking" subtitle="Kelola permintaan pemesanan dari klien." />

            <div className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1">
                {STATUS_TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setStatus(t.key)}
                        className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                            status === t.key ? 'bg-brand-600 text-white shadow' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="mb-4 relative max-w-sm">
                <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input className="input pl-9" placeholder="Cari nama, email, nomor..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>

            {loading ? (
                <Spinner />
            ) : items.length ? (
                <div className="card overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>No. Booking</th>
                                <th>Client</th>
                                <th>Paket</th>
                                <th>Jadwal</th>
                                <th>Dibuat</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id}>
                                    <td className="font-mono text-sm text-ink">{item.booking_no}</td>
                                    <td>
                                        <p className="font-medium text-ink">{item.name}</p>
                                        <p className="text-xs text-ink-muted">{item.phone || item.email}</p>
                                    </td>
                                    <td className="text-sm text-ink">{item.package_label || '-'}</td>
                                    <td className="text-sm text-ink">{item.event_date ? formatDate(item.event_date) : '-'}</td>
                                    <td className="text-xs text-ink-muted">{formatDate(item.created_at)}</td>
                                    <td>
                                        <button className="icon-btn" onClick={() => openDetail(item)} title="Lihat detail">
                                            <Icon name="eye" size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {meta.last_page > 1 && (
                        <div className="flex items-center justify-between px-4 py-3">
                            <button className="btn-outline disabled:opacity-40" disabled={!meta.prev_page_url} onClick={() => load(meta.current_page - 1)}>Sebelumnya</button>
                            <span className="text-sm text-ink-muted">Halaman {meta.current_page} dari {meta.last_page}</span>
                            <button className="btn-outline disabled:opacity-40" disabled={!meta.next_page_url} onClick={() => load(meta.current_page + 1)}>Berikutnya</button>
                        </div>
                    )}
                </div>
            ) : (
                <EmptyState icon="calendar" title="Tidak ada booking" message="Belum ada permintaan di status ini." />
            )}

            <Modal open={!!detail} onClose={() => { setDetail(null); setEditing(false); }} title={editing ? 'Edit Booking' : 'Detail Booking'} wide footer={
                editing ? (
                    <div className="flex justify-end gap-2">
                        <button className="btn-outline" onClick={() => setEditing(false)}>Batal</button>
                        <button className="btn-primary" onClick={handleUpdate} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
                    </div>
                ) : detail?.status === 'pending' ? (
                    <div className="flex w-full justify-between gap-2">
                        <button className="btn-outline text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200" onClick={() => setRejectOpen(true)}>Tolak</button>
                        <div className="flex gap-2">
                            <button className="btn-outline" onClick={startEdit}>Ubah</button>
                            <button className="btn-primary" onClick={startAccept}>Terima</button>
                        </div>
                    </div>
                ) : null
            }>
                {detail && (
                    editing ? (
                        <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" id="update-form">
                            <Field label="Nama" required error={errors.name?.[0]}><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                            <Field label="Email" error={errors.email?.[0]}><input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                            <Field label="Phone" error={errors.phone?.[0]}><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
                            <Field label="Lokasi" error={errors.location?.[0]}><input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
                            <Field label="Harga Deal (Rp)" error={errors.price?.[0]}><input type="number" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
                            <Field label="Catatan" error={errors.notes?.[0]}><textarea className="input" rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 border-b border-line pb-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-600">
                                    <Icon name="user" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-ink">{detail.name}</h3>
                                    <p className="text-sm text-ink-muted">{detail.phone} {detail.phone && detail.email ? '·' : ''} {detail.email}</p>
                                </div>
                                <div className="ml-auto">
                                    <span className={`badge ${STATUS_META[detail.status]?.cls}`}>{STATUS_META[detail.status]?.label}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-xs text-ink-muted">No. Booking</p><p className="font-mono text-sm font-semibold">{detail.booking_no}</p></div>
                                <div><p className="text-xs text-ink-muted">Paket</p><p className="text-sm font-semibold">{detail.package_label || '-'}</p></div>
                                <div><p className="text-xs text-ink-muted">Jadwal Acara</p><p className="text-sm font-semibold">{detail.event_date ? formatDate(detail.event_date) : '-'}</p></div>
                                <div><p className="text-xs text-ink-muted">Lokasi</p><p className="text-sm font-semibold">{detail.location || '-'}</p></div>
                                <div><p className="text-xs text-ink-muted">Harga Disepakati</p><p className="text-sm font-semibold">{detail.price ? `Rp ${Number(detail.price).toLocaleString('id-ID')}` : '-'}</p></div>
                            </div>
                            {detail.notes && (
                                <div><p className="text-xs text-ink-muted mb-1">Catatan</p><div className="rounded-xl bg-surface-muted p-3 text-sm">{detail.notes}</div></div>
                            )}
                        </div>
                    )
                )}
            </Modal>

            <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Tolak Booking" footer={
                <div className="flex justify-end gap-2">
                    <button className="btn-outline" onClick={() => setRejectOpen(false)}>Batal</button>
                    <button className="btn-primary !bg-red-600 hover:!bg-red-700" onClick={handleReject} disabled={saving}>{saving ? '...' : 'Tolak'}</button>
                </div>
            }>
                <Field label="Alasan Penolakan (opsional)">
                    <textarea className="input" rows="3" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Misal: Tanggal sudah penuh" />
                </Field>
            </Modal>

            <Modal open={acceptOpen} onClose={() => setAcceptOpen(false)} title="Terima Booking -> Buat Proyek" footer={
                <div className="flex justify-end gap-2">
                    <button className="btn-outline" onClick={() => setAcceptOpen(false)}>Batal</button>
                    <button className="btn-primary" onClick={handleAccept} disabled={saving}>{saving ? 'Membuat...' : 'Buat Proyek'}</button>
                </div>
            }>
                <form id="accept-form" className="space-y-4">
                    <Field label="Nama Proyek" required error={errors.name?.[0]}>
                        <input className="input" value={acceptForm.name} onChange={(e) => setAcceptForm({ ...acceptForm, name: e.target.value })} />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Tanggal Acara" error={errors.event_date?.[0]}>
                            <input type="date" className="input" value={acceptForm.event_date} onChange={(e) => setAcceptForm({ ...acceptForm, event_date: e.target.value })} />
                        </Field>
                        <Field label="Harga Final (Rp)" error={errors.price?.[0]}>
                            <input type="number" className="input" value={acceptForm.price} onChange={(e) => setAcceptForm({ ...acceptForm, price: e.target.value })} />
                        </Field>
                    </div>
                    <Field label="Deskripsi / Catatan Proyek" error={errors.description?.[0]}>
                        <textarea className="input" rows="3" value={acceptForm.description} onChange={(e) => setAcceptForm({ ...acceptForm, description: e.target.value })} />
                    </Field>
                </form>
                <p className="mt-3 text-xs text-ink-muted">Aksi ini akan membuat Proyek dan Invoice baru. Booking akan masuk ke histori.</p>
            </Modal>
            {node}
        </>
    );
}