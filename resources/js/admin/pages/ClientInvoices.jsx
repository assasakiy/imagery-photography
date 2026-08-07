import { useEffect, useRef, useState } from 'react';
import api from '../api';
import Icon from '../components/Icon';
import { Link } from 'react-router-dom';
import { PageHeader, Spinner, EmptyState, Modal, Field, useToast, formatRupiah, formatDate } from '../components/ui';

const STATUS_META = {
    unpaid: { label: 'Belum Bayar', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
    awaiting_dp: { label: 'Menunggu DP', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
    partial: { label: 'Cicilan/DP', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    paid: { label: 'Lunas', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
};

export default function ClientInvoices() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [payments, setPayments] = useState([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    const [form, setForm] = useState({ amount: '', notes: '', proof: null });
    const [saving, setSaving] = useState(false);
    const proofRef = useRef(null);
    const { show, node } = useToast();

    useEffect(() => {
        api.get('/customer/invoices')
            .then(({ data }) => setItems(data))
            .finally(() => setLoading(false));
    }, []);

    const openDetail = (it) => {
        setSelected(it);
        setForm({ amount: String(it.remaining), notes: '', proof: null });
        setPayments([]);
        if (it.project_id) {
            setPaymentsLoading(true);
            api.get(`/projects/${it.project_id}`)
                .then(({ data }) => setPayments(data.payments || []))
                .catch(() => setPayments([]))
                .finally(() => setPaymentsLoading(false));
        }
    };

    const refreshPayments = () => {
        if (!selected?.project_id) return;
        api.get(`/projects/${selected.project_id}`)
            .then(({ data }) => setPayments(data.payments || []))
            .catch(() => {});
    };

    const submitPayment = async (e) => {
        e.preventDefault();
        if (!selected) return;
        setSaving(true);
        try {
            const data = new FormData();
            data.append('amount', form.amount);
            data.append('method', 'manual_transfer');
            data.append('notes', form.notes || '');
            if (form.proof) data.append('proof_file', form.proof);
            await api.post(`/projects/${selected.project_id}/payments`, data);
            show('Pembayaran dikirim untuk dikonfirmasi.');
            setForm({ amount: String(selected.remaining), notes: '', proof: null });
            refreshPayments();
        } catch (err) {
            show(err.response?.data?.message || 'Gagal mengirim pembayaran.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Spinner />;

    return (
        <>
            <PageHeader title="Tagihan" subtitle="Status tagihan untuk pesanan Anda." />
            {items.length ? (
                <div className="card overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>No. Invoice</th>
                                <th>Tanggal</th>
                                <th>Pesanan</th>
                                <th>Status</th>
                                <th>Total Tagihan</th>
                                <th>Sisa Pembayaran</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it) => (
                                <tr key={it.id}>
                                    <td className="font-mono text-sm font-semibold text-ink">{it.number}</td>
                                    <td className="text-sm text-ink-muted">{it.issued_at ? formatDate(it.issued_at) : '-'}</td>
                                    <td className="font-medium text-ink">{it.project}</td>
                                    <td>
                                        <span className={`badge ${STATUS_META[it.status]?.cls}`}>{STATUS_META[it.status]?.label}</span>
                                    </td>
                                    <td className="text-ink">{formatRupiah(it.price)}</td>
                                    <td className={it.remaining > 0 ? 'font-semibold text-red-600' : 'text-emerald-600'}>
                                        {formatRupiah(it.remaining)}
                                    </td>
                                    <td>
                                        <button className="btn-primary text-xs py-1.5 px-3" onClick={() => openDetail(it)}>
                                            <Icon name="eye" size={14} /> Lihat Tagihan
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState title="Belum ada tagihan" message="Tagihan akan muncul setelah Anda memiliki pesanan." icon="credit-card" />
            )}

            <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Invoice ${selected.number}` : 'Tagihan'} wide>
                {selected && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
                            <div className="bg-surface p-4">
                                <p className="text-xs text-ink-muted">Pesanan</p>
                                <p className="mt-1 font-semibold text-ink">{selected.project}</p>
                            </div>
                            <div className="bg-surface p-4">
                                <p className="text-xs text-ink-muted">Diterbitkan</p>
                                <p className="mt-1 font-semibold text-ink">{selected.issued_at ? formatDate(selected.issued_at) : '-'}</p>
                            </div>
                            <div className="bg-surface p-4">
                                <p className="text-xs text-ink-muted">Total Tagihan</p>
                                <p className="mt-1 font-semibold text-ink">{formatRupiah(selected.price)}</p>
                            </div>
                            <div className="bg-surface p-4">
                                <p className="text-xs text-ink-muted">Sisa Pembayaran</p>
                                <p className={`mt-1 font-semibold ${selected.remaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatRupiah(selected.remaining)}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-ink-muted">Status</p>
                            <span className={`badge mt-1 ${STATUS_META[selected.status]?.cls}`}>{STATUS_META[selected.status]?.label}</span>
                        </div>

                        <Link to={`/dashboard/projects/${selected.project_id}`} className="btn-outline w-full justify-center">
                            <Icon name="folder-open" size={16} /> Buka Detail Pesanan
                        </Link>

                        {selected.remaining > 0 && (
                            <form onSubmit={submitPayment} className="rounded-xl border border-line p-5">
                                <h4 className="mb-4 font-semibold text-ink">Form Pembayaran Manual</h4>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Jumlah Transfer (Rp)" required>
                                        <input className="input" type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                                    </Field>
                                    <Field label="Bukti Transfer (opsional)">
                                        <button type="button" className="input flex items-center gap-2 text-left text-ink-muted" onClick={() => proofRef.current?.click()}>
                                            <Icon name="upload" size={16} /> {form.proof ? form.proof.name : 'Upload bukti...'}
                                        </button>
                                        <input ref={proofRef} type="file" className="hidden" onChange={(e) => setForm({ ...form, proof: e.target.files[0] })} />
                                    </Field>
                                    <div className="sm:col-span-2">
                                        <Field label="Catatan" hint="opsional">
                                            <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="mis. Transfer via BCA" />
                                        </Field>
                                    </div>
                                </div>
                                <button className="btn-primary mt-4 w-full" disabled={saving}>
                                    {saving ? 'Mengirim...' : 'Konfirmasi Transfer'}
                                </button>
                            </form>
                        )}

                        {paymentsLoading ? (
                            <Spinner className="h-6 w-6" />
                        ) : payments.length > 0 ? (
                            <div>
                                <h4 className="mb-3 text-sm font-semibold text-ink">Riwayat Pembayaran</h4>
                                <div className="overflow-x-auto rounded-xl border border-line">
                                    <table className="table mb-0">
                                        <thead><tr><th>Tanggal</th><th>Jumlah</th><th>Status</th></tr></thead>
                                        <tbody>
                                            {payments.map((p) => (
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
                        ) : null}
                    </div>
                )}
            </Modal>
            {node}
        </>
    );
}
