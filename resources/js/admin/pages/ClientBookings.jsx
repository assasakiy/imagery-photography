import { useEffect, useState } from 'react';
import api from '../api';
import Icon from '../components/Icon';
import { PageHeader, Spinner, EmptyState, formatDate, Modal, Field, useToast, Confirm } from '../components/ui';

const STATUS_META = {
    pending: { label: 'Menunggu', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    confirmed: { label: 'Dikonfirmasi', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    rejected: { label: 'Ditolak / Batal', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
    expired: { label: 'Kedaluwarsa', cls: 'bg-zinc-500/15 text-ink-muted' },
    converted: { label: 'Jadi Pesanan', cls: 'bg-brand-500/15 text-brand-600 dark:text-brand-400' },
};

export default function ClientBookings() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [packages, setPackages] = useState([]);
    const [createOpen, setCreateOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({});
    const [canceling, setCanceling] = useState(null);
    const { show, node } = useToast();

    const load = () => {
        setLoading(true);
        api.get('/customer/bookings')
            .then(({ data }) => setItems(data))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        api.get('/customer/packages').then(({ data }) => setPackages(data));
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/customer/bookings', form);
            show('Booking berhasil dikirim.');
            setCreateOpen(false);
            setForm({});
            load();
        } catch {
            show('Gagal mengirim booking.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async () => {
        try {
            await api.post(`/customer/bookings/${canceling.id}/cancel`);
            show('Booking dibatalkan.');
            setCanceling(null);
            load();
        } catch {
            show('Gagal membatalkan.', 'error');
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
                <Spinner />
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
                                    <p className="text-xs text-ink-muted">Tanggal Acara</p>
                                    <p className="font-medium text-ink">{b.event_date ? formatDate(b.event_date) : '-'}</p>
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
                        </select>
                    </Field>
                    <Field label="Tanggal Acara (Perkiraan)">
                        <input type="date" className="input" value={form.event_date || ''} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
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
            {node}
        </>
    );
}