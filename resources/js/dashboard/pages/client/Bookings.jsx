import { useEffect, useState } from 'react';
import api from '../../api';
import Icon from '../../components/Icon';
import { PageHeader, EmptyState, formatDate, formatRupiah, Modal, Field, Confirm } from '../../components/ui';
import Skeleton, { CardGridSkeleton } from '../../components/Skeleton';
import { toast } from '../../lib/toast';
import { useAuth } from '../../context/AuthContext';

const STATUS_META = {
    pending: { label: 'Menunggu', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    confirmed: { label: 'Dikonfirmasi', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    rejected: { label: 'Ditolak', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
    cancelled: { label: 'Dibatalkan', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
    expired: { label: 'Kedaluwarsa', cls: 'bg-zinc-500/15 text-ink-muted' },
    converted: { label: 'Jadi Pesanan', cls: 'bg-brand-500/15 text-brand-600 dark:text-brand-400' },
};

export default function ClientBookings() {
    const { refresh } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [packages, setPackages] = useState([]);
    const [services, setServices] = useState([]);
    const [createOpen, setCreateOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ service_ids: [], start_time: '08:00', end_time: '12:00' });
    const [canceling, setCanceling] = useState(null);

    const load = () => {
        setLoading(true);
        api.get('/customer/bookings')
            .then(({ data }) => setItems(data))
            .catch(() => toast.error('Gagal memuat data.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        api.get('/customer/packages').then(({ data }) => setPackages(data)).catch(() => {});
        api.get('/customer/services').then(({ data }) => setServices(data)).catch(() => {});
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form };
            if (form.event_date) {
                if (form.start_time) payload.event_start = `${form.event_date}T${form.start_time}`;
                if (form.end_time) payload.event_end = `${form.event_date}T${form.end_time}`;
            }
            delete payload.start_time;
            delete payload.end_time;
            await api.post('/customer/bookings', payload);
            toast.success('Booking berhasil dikirim.');
            setCreateOpen(false);
            setForm({ service_ids: [], start_time: '08:00', end_time: '12:00' });
            load();
            refresh();
        } catch (err) {
            if (err.response?.data?.errors?.service_ids) {
                toast.error(err.response.data.errors.service_ids[0]);
            } else {
                toast.error('Gagal mengirim booking.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async () => {
        try {
            await api.post(`/customer/bookings/${canceling.id}/cancel`);
            toast.success('Booking dibatalkan.');
            setCanceling(null);
            load();
        } catch {
            toast.error('Gagal membatalkan.');
        }
    };

    return (
        <>
            <PageHeader 
                title="Booking Saya" 
                subtitle="Riwayat permintaan booking yang Anda ajukan." 
                action={<button className="btn-primary" onClick={() => setCreateOpen(true)}>Buat Booking Baru</button>}
            />
            {loading ? (
                <CardListSkeleton count={4} />
            ) : items.length ? (
                <div className="space-y-4">
                    {items.map((b) => (
                        <div key={b.id} className="card p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-mono text-sm font-semibold">{b.booking_no}</p>
                                        <span className={`badge ${STATUS_META[b.status]?.cls || 'bg-zinc-500/15'}`}>{STATUS_META[b.status]?.label || b.status}</span>
                                    </div>
                                    <p className="mt-1 font-semibold text-ink">{b.package_label || 'Paket kustom'}</p>
                                </div>
                                <span className="text-xs text-ink-muted">{formatDate(b.created_at)}</span>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                                <div>
<p className="text-xs text-ink-muted">Jadwal Acara</p>
                <p className="font-medium text-ink">{b.event_start ? formatDate(b.event_start) : (b.event_date ? formatDate(b.event_date) : '-')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-ink-muted">Lokasi</p>
                                    <p className="font-medium text-ink">{b.location || '-'}</p>
                                </div>
                            </div>
                            {b.notes && <p className="mt-3 rounded-xl bg-surface-muted p-3 text-sm text-ink-muted">{b.notes}</p>}
                            {(b.status === 'pending' || b.status === 'confirmed') && (
                                <div className="mt-4 flex justify-end">
                                    <button className="btn-outline text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => setCanceling(b)}>Batalkan Booking</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState title="Belum ada booking" message="Anda belum mengajukan permintaan booking." icon="calendar" />
            )}

            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Buat Booking Baru" footer={
                <div className="flex justify-end gap-2">
                    <button className="btn-outline" onClick={() => setCreateOpen(false)}>Batal</button>
                    <button className="btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Mengirim...' : 'Kirim Booking'}</button>
                </div>
            }>
                <form className="space-y-4" onSubmit={handleCreate}>
                    <Field label="Pilih Paket" required>
                        <select className="input" value={form.package_id || ''} onChange={(e) => setForm({ ...form, package_id: e.target.value })} required>
                            <option value="">-- Pilih Paket --</option>
                            {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            <option value="custom">Layanan Satuan</option>
                        </select>
                    </Field>
                    
                    {form.package_id === 'custom' && (
                        <Field label="Pilih Layanan Satuan (bisa lebih dari satu)">
                            <div className="max-h-48 overflow-y-auto rounded-xl border border-line bg-surface p-2">
                                {services.map(s => (
                                    <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-surface-muted transition-colors">
                                        <input 
                                            type="checkbox" 
                                            className="h-4 w-4 rounded border-line text-brand-600"
                                            checked={(form.service_ids || []).includes(s.id)}
                                            onChange={(e) => {
                                                const ids = new Set(form.service_ids || []);
                                                if (e.target.checked) ids.add(s.id);
                                                else ids.delete(s.id);
                                                setForm({ ...form, service_ids: Array.from(ids) });
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
                    )}

                    <Field label="Tanggal Acara">
                        <input type="date" className="input" value={form.event_date || ''} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
                    </Field>
                    <Field label="Waktu Mulai Acara">
                        <input type="time" className="input" value={form.start_time || ''} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                    </Field>
                    <Field label="Waktu Selesai Acara">
                        <input type="time" className="input" value={form.end_time || ''} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
                    </Field>
                    <Field label="Lokasi Acara">
                        <input className="input" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Kota / Nama Gedung" />
                    </Field>
                    <Field label="Catatan Tambahan">
                        <textarea className="input" rows="3" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ceritakan detail yang Anda butuhkan..." />
                    </Field>
                </form>
            </Modal>

            <Confirm open={!!canceling} onClose={() => setCanceling(null)} onConfirm={handleCancel} title="Batalkan Booking?" message="Booking ini akan dibatalkan dan tidak akan dilanjutkan ke pesanan." confirmText="Batalkan" />
        </>
    );
}