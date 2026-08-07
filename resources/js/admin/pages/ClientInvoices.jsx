import { useEffect, useState } from 'react';
import api from '../api';
import Icon from '../components/Icon';
import { Link } from 'react-router-dom';
import { PageHeader, Spinner, EmptyState, formatRupiah, formatDate } from '../components/ui';

const STATUS_META = {
    unpaid: { label: 'Belum Bayar', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
    awaiting_dp: { label: 'Menunggu DP', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
    partial: { label: 'Cicilan/DP', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    paid: { label: 'Lunas', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
};

export default function ClientInvoices() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/customer/invoices')
            .then(({ data }) => setItems(data))
            .finally(() => setLoading(false));
    }, []);

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
                                        <Link to={`/dashboard/projects/${it.project_id}?tab=invoice`} className="btn-primary text-xs py-1.5 px-3">
                                            Lihat Tagihan
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState title="Belum ada tagihan" message="Tagihan akan muncul setelah Anda memiliki pesanan." icon="credit-card" />
            )}
        </>
    );
}