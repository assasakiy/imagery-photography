import { useEffect, useState } from 'react';
import api from '../../api';
import Icon from '../../components/Icon';
import { PageHeader, EmptyState, Modal, Field, useToast, formatDate, formatRupiah } from '../../components/ui';
import Skeleton from '../../components/Skeleton';

const STATUS_META = {
    pending: { label: 'Menunggu', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    confirmed: { label: 'Dikonfirmasi', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    rejected: { label: 'Ditolak', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
    cancelled: { label: 'Dibatalkan', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
    expired: { label: 'Kedaluwarsa', cls: 'bg-zinc-500/15 text-ink-muted' },
    converted: { label: 'Jadi Proyek', cls: 'bg-brand-500/15 text-brand-600 dark:text-brand-400' },
};

const STATUS_TABS = [
    { key: 'pending', label: 'Menunggu', icon: 'clock' },
    { key: 'confirmed', label: 'Dikonfirmasi', icon: 'check' },
    { key: 'rejected', label: 'Ditolak', icon: 'x' },
    { key: 'cancelled', label: 'Dibatalkan', icon: 'x' },
    { key: 'expired', label: 'Kadaluarsa', icon: 'alert-triangle' },
    { key: 'converted', label: 'Histori Pesanan', icon: 'briefcase' },
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
    const [acceptForm, setAcceptForm] = useState({ service_ids: [] });
    const [packages, setPackages] = useState([]);
    const [services, setServices] = useState([]);

    useEffect(() => {
        api.get('/packages', { params: { active_only: 1 } }).then(({ data }) => setPackages(data));
        api.get('/services').then(({ data }) => setServices(data));
    }, []);

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

    const handleConfirm = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await api.post(`/bookings/${detail.id}/confirm`);
            show('Booking dikonfirmasi.');
            setDetail(data);
            load(meta.current_page);
        } catch {
            show('Gagal mengkonfirmasi booking.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleAccept = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        const payload = { ...acceptForm };
        if (payload.event_date) {
            if (payload.start_time) payload.event_start = `${payload.event_date}T${payload.start_time}`;
            if (payload.end_time) payload.event_end = `${payload.event_date}T${payload.end_time}`;
        }
        delete payload.start_time;
        delete payload.end_time;
        if ((payload.package_id === 'custom') || !payload.package_id) {
            payload.package_id = null;
        }
        delete payload.service_ids;
        try {
            const { data } = await api.post(`/bookings/${detail.id}/accept`, payload);
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
            package_id: detail.package_id || '',
            event_date: detail.event_date ? detail.event_date.split('T')[0] : '',
            start_time: detail.event_start ? detail.event_start.slice(11, 16) : '',
            end_time: detail.event_end ? detail.event_end.slice(11, 16) : '',
            description: detail.notes || '',
            location: detail.location || '',
            price: detail.price || '',
            status: 'scheduled',
            dp_amount: '',
            service_ids: [],
        });
        setAcceptOpen(true);
    };

    return (
        <>
            <PageHeader title="Booking" subtitle="Kelola permintaan pemesanan dari klien." />

            <div className="mb-4 flex items-center gap-3 border-b border-line pb-4">
                <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
                    {STATUS_TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setStatus(t.key)}
                            className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                status === t.key ? 'bg-brand-600 text-white' : 'bg-surface-muted text-ink-muted hover:text-ink'
                            }`}
                        >
                            <Icon name={t.icon} size={16} /> <span className="hidden sm:inline">{t.label}</span>
                        </button>
                    ))}
                </div>
                <div className="relative min-w-0 flex-1">
                    <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input className="input w-full pl-9 py-1.5" placeholder="Cari nama, email, nomor..." value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
            </div>

            {loading ? (
                <Skeleton variant="table" />
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
                            <button className="btn-primary" onClick={handleConfirm} disabled={saving}>{saving ? '...' : 'Konfirmasi'}</button>
                        </div>
                    </div>
                ) : detail?.status === 'confirmed' ? (
                    <div className="flex w-full justify-between gap-2">
                        <button className="btn-outline text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200" onClick={() => setRejectOpen(true)}>Batal / Tolak</button>
                        <div className="flex gap-2">
                            <button className="btn-outline" onClick={startEdit}>Ubah</button>
                            <button className="btn-primary" onClick={startAccept}>Buat Proyek</button>
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
                                <div className="min-w-0">
                                    <h3 className="font-bold text-ink truncate">{detail.name}</h3>
                                    <p className="truncate text-sm text-ink-muted">{detail.phone} {detail.phone && detail.email ? '·' : ''} {detail.email}</p>
                                </div>
                                <div className="ml-auto shrink-0">
                                    <span className={`badge ${STATUS_META[detail.status]?.cls}`}>{STATUS_META[detail.status]?.label}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-xs text-ink-muted">No. Booking</p><p className="font-mono text-sm font-semibold text-ink">{detail.booking_no}</p></div>
                                <div><p className="text-xs text-ink-muted">Paket</p><p className="text-sm font-semibold text-ink">{detail.package_label || '-'}</p></div>
                                <div><p className="text-xs text-ink-muted">Tanggal Acara</p><p className="text-sm font-semibold text-ink">{detail.event_date ? formatDate(detail.event_date) : '-'}</p></div>
                                <div><p className="text-xs text-ink-muted">Waktu Acara</p>
                                    <p className="text-sm font-semibold text-ink">
                                        {detail.event_start ? detail.event_start.slice(11, 16) : '-'}
                                        {detail.event_end ? ` - ${detail.event_end.slice(11, 16)}` : ''}
                                        {!detail.event_start && !detail.event_end ? '-' : ''}
                                    </p>
                                </div>
                                <div><p className="text-xs text-ink-muted">Lokasi</p><p className="text-sm font-semibold text-ink">{detail.location || '-'}</p></div>
                                <div><p className="text-xs text-ink-muted">Harga</p><p className="text-sm font-semibold text-ink">{detail.price ? `Rp ${Number(detail.price).toLocaleString('id-ID')}` : '-'}</p></div>
                                <div><p className="text-xs text-ink-muted">Dibuat</p><p className="text-sm font-semibold text-ink">{formatDate(detail.created_at)}</p></div>
                                <div><p className="text-xs text-ink-muted">Klien</p>
                                    <p className="text-sm font-semibold text-ink">
                                        {detail.user?.username ? `@${detail.user.username}` : (detail.user?.profile?.full_name || '-')}
                                    </p>
                                </div>
                            </div>

                            {detail.notes && (
                                <div><p className="text-xs text-ink-muted mb-1">Catatan</p><div className="rounded-xl bg-surface-muted p-3 text-sm text-ink">{detail.notes}</div></div>
                            )}

                            {(detail.status === 'rejected' || detail.status === 'cancelled') && (
                                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
                                    Booking ini {detail.status === 'rejected' ? 'ditolak oleh admin' : 'dibatalkan oleh klien'}.
                                </div>
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

            <Modal open={acceptOpen} onClose={() => setAcceptOpen(false)} title="Terima Booking -> Buat Proyek" wide footer={
                <div className="flex justify-end gap-2">
                    <button className="btn-outline" onClick={() => setAcceptOpen(false)}>Batal</button>
                    <button className="btn-primary" onClick={handleAccept} disabled={saving}>{saving ? 'Membuat...' : 'Buat Proyek'}</button>
                </div>
            }>
                <form id="accept-form" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <Field label="Nama Project" required error={errors.name?.[0]}>
                            <input className="input" value={acceptForm.name} onChange={(e) => setAcceptForm({ ...acceptForm, name: e.target.value })} required />
                        </Field>
                    </div>

                    <Field label="Paket" hint="pilih paket untuk mengisi harga otomatis">
                        <select
                            className="input"
                            value={acceptForm.package_id || ''}
                            onChange={(e) => {
                                const pid = e.target.value;
                                if (pid === 'custom') {
                                    setAcceptForm({ ...acceptForm, package_id: pid });
                                    return;
                                }
                                const pkg = packages.find((p) => String(p.id) === pid);
                                setAcceptForm({
                                    ...acceptForm,
                                    package_id: pid,
                                    name: acceptForm.name || (pkg ? pkg.name : ''),
                                    price: pkg ? pkg.price : acceptForm.price,
                                    service_ids: [],
                                });
                            }}
                        >
                            <option value="">Tanpa paket (harga manual)</option>
                            {packages.map((p) => (
                                <option key={p.id} value={p.id}>{p.name} — {formatRupiah(p.price)}</option>
                            ))}
                            <option value="custom">Layanan Satuan</option>
                        </select>
                    </Field>
                    <Field label="Tanggal Acara" hint="opsional" error={errors.event_date?.[0]}>
                        <input className="input" type="date" value={acceptForm.event_date} onChange={(e) => setAcceptForm({ ...acceptForm, event_date: e.target.value })} />
                    </Field>
                    <Field label="Waktu Mulai Acara" hint="opsional" error={errors.event_start?.[0]}>
                        <input className="input" type="time" value={acceptForm.start_time} onChange={(e) => setAcceptForm({ ...acceptForm, start_time: e.target.value })} />
                    </Field>
                    <Field label="Waktu Selesai Acara" hint="opsional" error={errors.event_end?.[0]}>
                        <input className="input" type="time" value={acceptForm.end_time} onChange={(e) => setAcceptForm({ ...acceptForm, end_time: e.target.value })} />
                    </Field>

                    {acceptForm.package_id === 'custom' && (
                        <div className="sm:col-span-2">
                            <Field label="Pilih Layanan Satuan (bisa lebih dari satu)">
                                <div className="max-h-48 overflow-y-auto rounded-xl border border-line bg-surface p-2">
                                    {services.map(s => (
                                        <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-surface-muted transition-colors">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-line text-brand-600"
                                                checked={(acceptForm.service_ids || []).includes(s.id)}
                                                onChange={(e) => {
                                                    const ids = new Set(acceptForm.service_ids || []);
                                                    if (e.target.checked) ids.add(s.id);
                                                    else ids.delete(s.id);
                                                    const idArray = Array.from(ids);
                                                    const selectedServices = services.filter(svc => idArray.includes(svc.id));
                                                    const sumPrice = selectedServices.reduce((acc, svc) => acc + Number(svc.price), 0);
                                                    const customName = 'Kustom: ' + selectedServices.map(svc => `${svc.event} (${svc.media})`).join(' + ');
                                                    setAcceptForm({
                                                        ...acceptForm,
                                                        service_ids: idArray,
                                                        name: idArray.length ? customName : '',
                                                        price: idArray.length ? sumPrice : '',
                                                    });
                                                }}
                                            />
                                            <div className="flex flex-1 justify-between text-sm">
                                                <span className="font-medium text-ink">{s.event} <span className="text-xs text-ink-muted capitalize">({s.media})</span></span>
                                                <span className="font-semibold text-brand-600 dark:text-brand-400">{formatRupiah(s.price)}</span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </Field>
                        </div>
                    )}

                    <div className="sm:col-span-2">
                        <Field label="Lokasi" hint="opsional. Tempat acara dilaksanakan.">
                            <input className="input" value={acceptForm.location} onChange={(e) => setAcceptForm({ ...acceptForm, location: e.target.value })} placeholder="mis. Ballroom Hotel, Lombok" />
                        </Field>
                    </div>

                    <div className="sm:col-span-2">
                        <Field label="Deskripsi / Catatan Proyek" error={errors.description?.[0]}>
                            <textarea className="input min-h-[80px]" value={acceptForm.description} onChange={(e) => setAcceptForm({ ...acceptForm, description: e.target.value })} />
                        </Field>
                    </div>

                    <div className="sm:col-span-2">
                        <Field label="Harga (Rp)" hint="opsional. Otomatis terisi dari paket, bisa diubah manual." error={errors.price?.[0]}>
                            <input className="input" type="number" min="0" value={acceptForm.price} onChange={(e) => setAcceptForm({ ...acceptForm, price: e.target.value })} />
                        </Field>
                    </div>
                    <div className="sm:col-span-2">
                        <Field label="DP / Uang Muka (Rp)" hint="opsional. Kosongkan jika deal pembayaran di belakang." error={errors.dp_amount?.[0]}>
                            <input className="input" type="number" min="0" value={acceptForm.dp_amount} onChange={(e) => setAcceptForm({ ...acceptForm, dp_amount: e.target.value })} placeholder="mis. 500000" />
                        </Field>
                    </div>
                </form>
                <p className="mt-3 text-xs text-ink-muted">Aksi ini akan membuat Proyek (dan Invoice bila DP diisi). Booking akan masuk ke histori.</p>
            </Modal>
            {node}
        </>
    );
}