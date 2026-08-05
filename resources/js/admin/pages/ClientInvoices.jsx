import { useEffect, useState } from 'react';
import api from '../api';
import Icon from '../components/Icon';
import { PageHeader, Spinner, EmptyState, formatRupiah } from '../components/ui';

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
                                <th>Pesanan</th>
                                <th>Total</th>
                                <th>Terbayar</th>
                                <th>Sisa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it) => (
                                <tr key={it.id}>
                                    <td className="font-mono text-xs text-ink">{it.number}</td>
                                    <td className="font-medium text-ink">{it.project}</td>
                                    <td className="text-ink">{formatRupiah(it.price)}</td>
                                    <td className="text-emerald-600 dark:text-emerald-400">{formatRupiah(it.paid)}</td>
                                    <td className={it.remaining > 0 ? 'font-semibold text-ink' : 'text-ink-muted'}>
                                        {formatRupiah(it.remaining)}
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