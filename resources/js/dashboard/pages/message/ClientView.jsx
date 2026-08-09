import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api';
import Icon from '../../components/Icon';
import { PageHeader, Spinner, EmptyState, useToast, formatDate } from '../../components/ui';

export default function ClientMessages() {
    const [searchParams] = useSearchParams();
    const pesanan = searchParams.get('pesanan') || '';
    
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [sending, setSending] = useState(false);
    const { show, node } = useToast();

    const load = () => {
        setLoading(true);
        api.get('/customer/messages', { params: { project_id: pesanan || undefined } })
            .then(({ data }) => setItems(data))
            .finally(() => setLoading(false));
    };
    
    useEffect(() => { load(); }, [pesanan]);

    const send = async (e) => {
        e.preventDefault();
        if (!msg.trim()) return;
        setSending(true);
        try {
            await api.post('/customer/messages', { message: msg.trim(), project_id: pesanan || undefined });
            show('Pesan terkirim.');
            setMsg('');
            load();
        } catch {
            show('Gagal mengirim pesan.', 'error');
        } finally {
            setSending(false);
        }
    };

    if (loading) return <Spinner />;

    return (
        <>
            <PageHeader title="Pesan" subtitle="Kirim pesan atau pertanyaan ke tim kami." />

            <form onSubmit={send} className="card mb-6 p-5">
                <div className="mb-3 flex items-center justify-between">
                    <label className="label mb-0">Tulis pesan</label>
                    {pesanan && <span className="badge bg-brand-500/15 text-brand-600 font-mono">Pesanan: PSN-{pesanan}</span>}
                </div>
                <textarea className="input min-h-[90px] mb-3" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Tulis pertanyaan atau permintaan Anda..." />
                <button type="submit" className="btn-primary" disabled={sending || !msg.trim()}>
                    <Icon name="send" size={16} /> Kirim
                </button>
            </form>

            {items.length ? (
                <div className="space-y-3">
                    {items.map((m) => (
                        <div key={m.id} className="card p-4">
                            {m.project && <span className="badge bg-surface-muted text-ink-muted mb-2 font-mono">PSN-{m.project.order_no}</span>}
                            <p className="text-sm text-ink">{m.message}</p>
                            <p className="mt-2 text-xs text-ink-muted">{formatDate(m.created_at)}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState title="Belum ada pesan" message="Kirim pesan pertama Anda." icon="message-circle" />
            )}
            {node}
        </>
    );
}