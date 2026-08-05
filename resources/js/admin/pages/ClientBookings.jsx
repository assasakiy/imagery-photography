import { useEffect, useState } from 'react';
import api from '../api';
import Icon from '../components/Icon';
import { PageHeader, Spinner, EmptyState, formatDate } from '../components/ui';

export default function ClientBookings() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/customer/bookings')
            .then(({ data }) => setItems(data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner />;

    return (
        <>
            <PageHeader title="Booking Saya" subtitle="Riwayat permintaan booking yang Anda ajukan." />
            {items.length ? (
                <div className="space-y-4">
                    {items.map((b) => (
                        <div key={b.id} className="card p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="font-semibold text-ink">{b.package || 'Paket umum'}</p>
                                    <p className="mt-1 text-sm text-ink-muted">{b.name} · {b.phone}</p>
                                </div>
                                <span className="text-xs text-ink-muted">{formatDate(b.created_at)}</span>
                            </div>
                            {b.event_date && <p className="mt-2 text-sm text-ink-muted">Tanggal acara: {b.event_date}</p>}
                            {b.message && <p className="mt-2 rounded-xl bg-surface-muted p-3 text-sm text-ink-muted">{b.message}</p>}
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState title="Belum ada booking" message="Anda belum mengajukan permintaan booking." icon="calendar" />
            )}
        </>
    );
}