import { useEffect, useState } from 'react';
import api from '../api';
import Icon from '../components/Icon';
import { PageHeader, Spinner, EmptyState, useToast, formatDate } from '../components/ui';

export default function ClientMessages() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [sending, setSending] = useState(false);
    const { show, node } = useToast();

    const load = () => api.get('/customer/messages').then(({ data }) => setItems(data)).finally(() => setLoading(false));
    useEffect(() => { load(); }, []);

    const send = async (e) => {
        e.preventDefault();
        if (!msg.trim()) return;
        setSending(true);
        try {
            await api.post('/customer/messages', { message: msg.trim() });
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
                <label className="label">Tulis pesan</label>
                <textarea className="input min-h-[90px] mb-3" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Tulis pertanyaan atau permintaan Anda..." />
                <button type="submit" className="btn-primary" disabled={sending || !msg.trim()}>
                    <Icon name="send" size={16} /> Kirim
                </button>
            </form>

            {items.length ? (
                <div className="space-y-3">
                    {items.map((m) => (
                        <div key={m.id} className="card p-4">
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