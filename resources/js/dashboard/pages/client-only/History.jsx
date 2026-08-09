import { useEffect, useState } from 'react';
import api from '../../api';
import Icon from '../../components/Icon';
import { PageHeader, Spinner, EmptyState, formatDate } from '../../components/ui';

function formatDateTime(value) {
    if (!value) return '-';
    const d = new Date(value);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) +
        ', ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

const ACTION_LABEL = { viewed: 'Melihat', read: 'Membaca', downloaded: 'Mengunduh' };

export default function History() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/history', { params: { limit: 50 } })
            .then(({ data }) => setItems(data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Spinner />;

    return (
        <>
            <PageHeader title="Riwayat" subtitle="Aktivitas terakhir Anda di situs." />
            {items.length ? (
                <div className="card divide-y divide-line">
                    {items.map((h) => (
                        <div key={h.id} className="flex items-start gap-3 p-4">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-ink-muted">
                                <Icon name={h.action === 'downloaded' ? 'download' : h.action === 'read' ? 'book' : 'eye'} size={18} />
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm text-ink">
                                    <span className="font-semibold">{ACTION_LABEL(h.action) || h.action}</span>{' '}
                                    <span className="text-ink-muted">{h.target_type ? h.target_type.toLowerCase() : ''} {h.title ? `· ${h.title}` : ''}</span>
                                </p>
                                <p className="mt-0.5 text-xs text-ink-muted">{formatDateTime(h.created_at)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState title="Belum ada riwayat" message="Aktivitas membaca, melihat, dan mengunduh Anda akan muncul di sini." icon="clock" />
            )}
        </>
    );
}