import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import Icon from '../../components/Icon';
import { PageHeader, formatDate, Confirm } from '../../components/ui';
import Skeleton from '../../components/Skeleton';
import { toast } from '../../lib/toast';

function OfficialTeamBadge() {
    return (
        <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white" title="Tim Resmi" aria-label="Tim Resmi">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6.5 12.5 3.5 3.5 7.5-8" /></svg>
        </span>
    );
}

export default function ClientMessages() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const pesanan = searchParams.get('pesanan') || '';
    
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [file, setFile] = useState(null);
    const [replyTo, setReplyTo] = useState(null);
    const [showEmoji, setShowEmoji] = useState(false);
    const [sending, setSending] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);

    const EMOJIS = ['😀','😂','🥰','😎','🤔','👍','🙏','🔥','🎉','📷','✨','💡'];

    const load = () => {
        api.get('/customer/messages')
            .then(({ data }) => {
                setItems(data);
                setTimeout(() => {
                    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }, 100);
            })
            .catch(() => toast.error('Gagal memuat pesan.'))
            .finally(() => setLoading(false));
    };
    
    useEffect(() => { load(); }, []);

    const send = async (e) => {
        e.preventDefault();
        if (!msg.trim() && !file) return;
        setSending(true);
        try {
            const formData = new FormData();
            if (msg.trim()) formData.append('message', msg.trim());
            if (file) formData.append('file', file);
            if (pesanan) formData.append('project_id', pesanan);
            if (replyTo) formData.append('reply_to_id', replyTo.id);
            
            await api.post('/customer/messages', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMsg('');
            setFile(null);
            setReplyTo(null);
            setShowEmoji(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            load();
        } catch {
            toast.error('Gagal mengirim pesan.');
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (id) => {
        setConfirmDeleteId(null);
        try {
            await api.delete(`/customer/messages/${id}`);
            setItems(items.filter(i => i.id !== id));
            toast.success('Pesan dihapus.');
        } catch {
            toast.error('Gagal menghapus pesan.');
        }
    };

    const removeTag = () => navigate('/dashboard/client-messages', { replace: true });

    if (loading) return <Skeleton variant="form" />;

    return (
        <div className="flex h-[calc(100vh-64px)] flex-col -mx-4 sm:-mx-6 lg:-mx-8 -my-6">
            <div className="flex flex-col overflow-hidden bg-surface flex-1">
                <div className="border-b border-line p-4 flex items-center bg-surface">
                    <h1 className="text-xl font-bold text-ink">Obrolan</h1>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6" ref={scrollRef}>
                    {!items.length ? (
                        <div className="flex h-full flex-col items-center justify-center text-center text-ink-muted opacity-60">
                            <Icon name="message-circle" size={48} className="mb-4" />
                            <p>Belum ada pesan. Silakan mulai percakapan.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map((m) => {
                                const isAdmin = m.sender_type === 'admin';
                                return (
                                    <div key={m.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[85%] sm:max-w-[75%] ${isAdmin ? '' : 'flex flex-col items-end'}`}>
                                            <div className="mb-1 flex items-center gap-2 px-1 text-[11px] text-ink-muted">
                                                <span className="inline-flex items-center gap-1">{isAdmin ? 'Admin' : 'Anda'} {m.official_team && <OfficialTeamBadge />}</span>
                                                <span>•</span>
                                                <span>{formatDate(m.created_at)}</span>
                                            </div>
                                            <div className="group relative flex items-center gap-2">
                                                {!isAdmin && (
                                                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                                                        <button onClick={() => setConfirmDeleteId(m.id)} className="p-1 text-red-500 hover:bg-red-500/10 rounded-full" title="Hapus">
                                                            <Icon name="trash" size={14} />
                                                        </button>
                                                        <button onClick={() => setReplyTo(m)} className="p-1 text-ink-muted hover:text-ink hover:bg-surface-muted rounded-full" title="Balas">
                                                            <Icon name="corner-up-left" size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                                <div className={`relative rounded-2xl px-4 py-3 text-sm ${isAdmin ? 'rounded-tl-sm bg-surface-muted text-ink' : 'rounded-tr-sm bg-brand-600 text-white'}`}>
                                                    {m.reply_to_id && m.reply_to && (
                                                        <div className={`mb-2 rounded-lg p-2 text-xs border-l-2 ${isAdmin ? 'bg-white/50 border-ink-muted/30 text-ink-muted' : 'bg-black/10 border-white/30 text-white/80'}`}>
                                                            <p className="inline-flex items-center gap-1 font-semibold">{m.reply_to.sender_type === 'admin' ? 'Admin' : (m.reply_to.user?.name || m.reply_to.name)} {m.reply_to.official_team && <OfficialTeamBadge />}</p>
                                                            <p className="line-clamp-1 truncate">{m.reply_to.message || 'Mengirim file'}</p>
                                                        </div>
                                                    )}
                                                    {m.project && (
                                                        <a
                                                            href={`/dashboard/pesanan/${m.project.order_no || m.project.id}`}
                                                            className={`mb-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold no-underline transition-colors ${isAdmin ? 'bg-white/60 text-brand-700 hover:bg-white' : 'bg-black/20 text-white hover:bg-black/30'}`}
                                                        >
                                                            <Icon name="tag" size={12} /> PSN-{m.project.order_no || m.project.id}
                                                        </a>
                                                    )}
                                                    {m.message && <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>}
                                                    {m.attachment_url && (
                                                        <a href={m.attachment_url} target="_blank" rel="noreferrer" className={`mt-2 flex items-center gap-2 rounded-lg p-2 text-xs no-underline ${isAdmin ? 'bg-white text-ink hover:bg-white/80' : 'bg-black/20 text-white hover:bg-black/30'}`}>
                                                            <Icon name="paperclip" size={14} /> <span>Lihat Lampiran</span>
                                                        </a>
                                                    )}
                                                </div>
                                                {isAdmin && (
                                                    <button onClick={() => setReplyTo(m)} className="opacity-0 group-hover:opacity-100 p-1 text-ink-muted hover:text-ink transition-opacity rounded-full hover:bg-surface-muted shrink-0" title="Balas">
                                                        <Icon name="corner-up-left" size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="border-t border-line bg-surface p-3 sm:p-4">
                    <form onSubmit={send} className="mx-auto max-w-4xl relative">
                        {showEmoji && (
                            <div className="absolute bottom-full mb-2 left-0 z-10 rounded-xl border border-line bg-surface p-2 shadow-lg grid grid-cols-6 gap-1">
                                {EMOJIS.map(e => (
                                    <button key={e} type="button" onClick={() => { setMsg(msg + e); setShowEmoji(false); }} className="p-2 text-xl hover:bg-surface-muted rounded-lg transition-colors">{e}</button>
                                ))}
                            </div>
                        )}
                        {(pesanan || file || replyTo) && (
                            <div className="absolute -top-12 left-0 flex flex-wrap items-center gap-2 rounded-t-lg bg-surface/90 backdrop-blur px-3 py-1.5 text-xs">
                                {pesanan && (
                                    <span className="flex items-center gap-1.5 rounded-full bg-brand-500/15 px-2 py-1 font-semibold text-brand-700 dark:text-brand-400">
                                        <Icon name="tag" size={12} /> PSN-{pesanan}
                                        <button type="button" onClick={removeTag} className="ml-1 hover:text-brand-900"><Icon name="x" size={12} /></button>
                                    </span>
                                )}
                                {file && (
                                    <span className="flex items-center gap-1.5 rounded-full bg-blue-500/15 px-2 py-1 font-semibold text-blue-700 dark:text-blue-400">
                                        <Icon name="paperclip" size={12} /> {file.name}
                                        <button type="button" onClick={() => setFile(null)} className="ml-1 hover:text-blue-900"><Icon name="x" size={12} /></button>
                                    </span>
                                )}
                                {replyTo && (
                                    <span className="flex items-center gap-1.5 rounded-full bg-zinc-500/15 px-2 py-1 font-semibold text-zinc-700 dark:text-zinc-300">
                                        <Icon name="corner-up-left" size={12} /> Balas: {replyTo.sender_type === 'admin' ? 'Admin' : 'Anda'}
                                        <button type="button" onClick={() => setReplyTo(null)} className="ml-1 hover:text-zinc-900"><Icon name="x" size={12} /></button>
                                    </span>
                                )}
                            </div>
                        )}
                        <div className="flex items-end gap-1.5">
                            <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="shrink-0 p-3 text-ink-muted hover:text-brand-600 transition-colors rounded-full hover:bg-brand-500/10">
                                <Icon name="smile" size={20} />
                            </button>
                            <label className="shrink-0 p-3 text-ink-muted hover:text-brand-600 transition-colors rounded-full hover:bg-brand-500/10 cursor-pointer">
                                <Icon name="paperclip" size={20} />
                                <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => setFile(e.target.files[0])} />
                            </label>
                            <textarea
                                className="input min-h-[44px] flex-1 resize-none py-3"
                                rows="1"
                                value={msg}
                                onChange={(e) => {
                                    setMsg(e.target.value);
                                    e.target.style.height = 'auto';
                                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        send(e);
                                    }
                                }}
                                placeholder="Ketik pesan..."
                            />
                            <button type="submit" className="btn-primary shrink-0 !px-4 !py-3" disabled={sending || !msg.trim()}>
                                <Icon name="send" size={18} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <Confirm open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} onConfirm={() => handleDelete(confirmDeleteId)} title="Hapus Pesan?" message="Pesan ini akan dihapus secara permanen." />
        </div>
    );
}