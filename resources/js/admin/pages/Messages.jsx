import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import api from '../api';
import Icon from '../components/Icon';
import { PageHeader, Spinner, EmptyState, Confirm, useToast, formatDate } from '../components/ui';

export default function Messages() {
    const { id: paramId } = useParams();
    const [searchParams] = useSearchParams();
    const pesanan = searchParams.get('pesanan') || '';

    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [selected, setSelected] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [loading, setLoading] = useState(true);
    const { show, node } = useToast();

    const load = (page = 1) => {
        setLoading(true);
        api.get('/messages', { params: { page, per_page: 15, unread_only: unreadOnly || undefined, project_id: pesanan || undefined } })
            .then(({ data }) => {
                setItems(data.data);
                setMeta(data);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [unreadOnly, pesanan]);

    useEffect(() => {
        if (!paramId) return;
        api.get(`/messages/${paramId}`)
            .then(({ data }) => setSelected(data))
            .catch(() => {});
    }, [paramId]);

    const openMessage = async (message) => {
        setSelected(message);
        if (!message.read_at) {
            await api.get(`/messages/${message.id}`);
            load(meta.current_page);
        }
    };

    const handleDelete = async () => {
        await api.delete(`/messages/${deleting.id}`);
        show('Pesan dihapus.');
        setDeleting(null);
        if (selected?.id === deleting.id) setSelected(null);
        load(meta.current_page);
    };

    return (
        <>
            <PageHeader title="Pesan" subtitle="Pesan dari klien & pengunjung." />

            <div className="mb-4 flex flex-wrap gap-2 items-center">
                <button className={`chip ${!unreadOnly ? 'chip-active' : ''}`} onClick={() => setUnreadOnly(false)}>Semua</button>
                <button className={`chip ${unreadOnly ? 'chip-active' : ''}`} onClick={() => setUnreadOnly(true)}>Belum dibaca</button>
                {pesanan && <span className="badge bg-brand-500/15 text-brand-600 font-mono">Pesanan: PSN-{pesanan}</span>}
            </div>

            {loading ? (
                <Spinner />
            ) : items.length ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
                    <div className="card lg:col-span-2">
                        <ul className="divide-y divide-line">
                            {items.map((m) => (
                                <li key={m.id}>
                                    <button
                                        onClick={() => openMessage(m)}
                                        className={`flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-surface-muted ${selected?.id === m.id ? 'bg-surface-muted' : ''}`}
                                    >
                                        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${m.read_at ? 'bg-surface-muted ring-1 ring-line' : 'bg-brand-500'}`} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate text-sm font-semibold text-ink">{m.name}</p>
                                                <span className="shrink-0 text-xs text-ink-muted">{formatDate(m.created_at)}</span>
                                            </div>
                                            <p className="truncate text-xs text-ink-muted">{m.email || m.phone || '-'}</p>
                                            <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{m.message}</p>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                        {meta.last_page > 1 && (
                            <div className="flex items-center justify-between border-t border-line px-4 py-3">
                                <button className="btn-outline disabled:opacity-40" disabled={!meta.prev_page_url} onClick={() => load(meta.current_page - 1)}>
                                    Sebelumnya
                                </button>
                                <span className="text-xs text-ink-muted">{meta.current_page}/{meta.last_page}</span>
                                <button className="btn-outline disabled:opacity-40" disabled={!meta.next_page_url} onClick={() => load(meta.current_page + 1)}>
                                    Berikutnya
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="card lg:col-span-3">
                        {selected ? (
                            <div className="p-6">
                                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-bold text-ink">{selected.name}</h2>
                                        {selected.project && <span className="badge bg-surface-muted text-ink-muted mb-2 font-mono">PSN-{selected.project.order_no}</span>}
                                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-ink-muted">
                                            {selected.email && (
                                                <a className="flex items-center gap-1.5 hover:text-brand-600" href={`mailto:${selected.email}`}>
                                                    <Icon name="mail" size={14} /> {selected.email}
                                                </a>
                                            )}
                                            {selected.phone && (
                                                <a className="flex items-center gap-1.5 hover:text-brand-600" href={`https://wa.me/${selected.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                                                    <Icon name="phone" size={14} /> {selected.phone}
                                                </a>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-ink-muted">{formatDate(selected.created_at)}</p>
                                    </div>
                                    <button onClick={() => setDeleting(selected)} className="icon-btn hover:!text-red-500" aria-label="Hapus pesan">
                                        <Icon name="trash" size={18} />
                                    </button>
                                </div>
                                <div className="rounded-2xl bg-surface-muted p-5">
                                    <p className="whitespace-pre-wrap leading-relaxed text-ink">{selected.message}</p>
                                </div>
                                <div className="mt-5 flex flex-wrap gap-2">
                                    {selected.email && (
                                        <a className="btn-primary" href={`mailto:${selected.email}?subject=Re: Pesan dari Sopian Lalu Imagery`}>
                                            <Icon name="mail" size={16} /> Balas Email
                                        </a>
                                    )}
                                    {selected.phone && (
                                        <a className="btn-outline" href={`https://wa.me/${selected.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                                            <Icon name="message-circle" size={16} /> Balas WhatsApp
                                        </a>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full min-h-[300px] flex-col items-center justify-center p-10 text-center">
                                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-muted text-ink-muted">
                                    <Icon name="message-circle" size={28} />
                                </div>
                                <p className="font-semibold text-ink">Pilih pesan</p>
                                <p className="mt-1 text-sm text-ink-muted">Klik pesan di kiri untuk membacanya.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <EmptyState title="Tidak ada pesan" message={unreadOnly ? 'Semua pesan sudah dibaca.' : 'Pesan dari halaman Kontak akan muncul di sini.'} />
            )}

            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} />
            {node}
        </>
    );
}
