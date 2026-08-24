import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { toast } from '../../lib/toast';
import { getApiErrorMessage } from '../../lib/errors';
import Icon from '../../components/Icon';
import { Spinner, EmptyState, Confirm, formatDate } from '../../components/ui';
import { ListSkeleton } from '../../components/Skeleton';
import { useBadges } from '../../context/BadgeContext';

export default function Messages() {
    const { id: paramId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const pesanan = searchParams.get('pesanan') || '';
    const { refresh } = useBadges();

    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [selectedConv, setSelectedConv] = useState(null);
    const [thread, setThread] = useState([]);
    const [loadingThread, setLoadingThread] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [replyMsg, setReplyMsg] = useState('');
    const [file, setFile] = useState(null);
    const [replyTo, setReplyTo] = useState(null);
    const [showEmoji, setShowEmoji] = useState(false);
    const [sending, setSending] = useState(false);
    
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);
    const pollIntervalRef = useRef(null);
    const currentPageRef = useRef(1);

    const EMOJIS = ['😀','😂','🥰','😎','🤔','👍','🙏','🔥','🎉','📷','✨','💡'];

    const [searchQuery, setSearchQuery] = useState('');

    const load = (page = 1) => {
        currentPageRef.current = page;
        setLoading(true);
        api.get('/messages', { params: { page, per_page: 25, unread_only: unreadOnly || undefined, project_id: pesanan || undefined, q: searchQuery || undefined } })
            .then(({ data }) => {
                setItems(data.data);
                setMeta(data);
                
                // Jika dari query string pesanan, otomatis pilih percakapan pertama (jika ada)
                if (pesanan && data.data.length > 0 && !selectedConv) {
                    openConversation(data.data[0]);
                }
            })
            .catch(() => toast.error('Gagal memuat pesan.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [unreadOnly, pesanan, searchQuery]);

    // Polling for new messages
    useEffect(() => {
        if (selectedConv) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = setInterval(() => {
                load(currentPageRef.current);
            }, 5000);
        } else {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        }
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, [selectedConv]);

    const openConversation = async (conv) => {
        setSelectedConv(conv);
        setLoadingThread(true);
        try {
            const { data } = await api.get(`/messages/${conv.id}/thread`);
            setThread(data);
            setTimeout(() => {
                if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }, 100);
            
            // Perbarui daftar di kiri agar tanda "unread" hilang
            setItems(items.map(item => item.id === conv.id ? { ...item, read_at: item.read_at || new Date().toISOString() } : item));
            // Force refresh after DB commit with staggered delays
            refresh();
            setTimeout(refresh, 1000);
            setTimeout(refresh, 2000);
            setTimeout(refresh, 3000);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal memuat percakapan.'));
        } finally {
            setLoadingThread(false);
        }
    };

    const sendReply = async (e) => {
        e.preventDefault();
        if ((!replyMsg.trim() && !file) || !selectedConv) return;
        
        setSending(true);
        try {
            const formData = new FormData();
            if (replyMsg.trim()) formData.append('message', replyMsg.trim());
            if (file) formData.append('file', file);
            if (replyTo) formData.append('reply_to_id', replyTo.id);
            if (selectedConv.project_id) formData.append('project_id', selectedConv.project_id);
            
            const { data } = await api.post(`/messages/${selectedConv.id}/reply`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setThread([...thread, data]);
            setReplyMsg('');
            setFile(null);
            setReplyTo(null);
            setShowEmoji(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            
            setTimeout(() => {
                if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }, 100);
            load(meta.current_page); // segarkan list kiri
            refresh();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal mengirim balasan.'));
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/messages/${deleting.id}`);
            toast.success('Pesan dihapus.');
            setDeleting(null);
            if (selectedConv?.id === deleting.id) {
                setSelectedConv(null);
                setThread([]);
            } else if (selectedConv) {
                openConversation(selectedConv);
            }
            load(meta.current_page);
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal menghapus percakapan.'));
        }
    };

    const renderListItem = (m) => {
        const isUnread = !m.read_at && m.sender_type !== 'admin';
        return (
            <li key={m.id}>
                <button
                    onClick={() => openConversation(m)}
                    className={`flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-surface-muted ${selectedConv?.id === m.id ? 'bg-surface-muted' : ''}`}
                >
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${!isUnread ? 'bg-surface-muted ring-1 ring-line' : 'bg-brand-500'}`} />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-ink">{m.user?.name || m.name}</p>
                            <span className="shrink-0 text-[10px] text-ink-muted">{formatDate(m.created_at)}</span>
                        </div>
                        {m.project && (
                            <p className="mt-0.5 text-[10px] font-mono text-brand-600 dark:text-brand-400">PSN-{m.project.order_no}</p>
                        )}
                        <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
                            {m.sender_type === 'admin' ? 'Anda: ' : ''}{m.message || (m.attachment_url ? 'Mengirim file' : '')}
                        </p>
                    </div>
                </button>
            </li>
        );
    };

    return (
        <div className="flex h-[calc(100vh-64px)] flex-col -mx-4 sm:-mx-6 lg:-mx-8 -my-6">
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3">
                <div className={`flex flex-col overflow-hidden border-r border-line bg-surface ${selectedConv ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-line">
                        <h1 className="text-xl font-bold text-ink mb-4">Pesan</h1>
                        
                        <div className="relative mb-4">
                            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                            <input 
                                type="text" 
                                className="input !pl-9" 
                                placeholder="Cari nama atau email..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        
                        <div className="flex flex-wrap gap-2 items-center">
                            <button className={`chip ${!unreadOnly ? 'chip-active' : ''}`} onClick={() => setUnreadOnly(false)}>Semua</button>
                            <button className={`chip ${unreadOnly ? 'chip-active' : ''}`} onClick={() => setUnreadOnly(true)}>Belum dibaca</button>
                            {pesanan && (
                                <span className="badge bg-brand-500/15 text-brand-600 font-mono flex items-center gap-1.5">
                                    PSN-{pesanan}
                                    <button className="hover:text-brand-800" onClick={() => navigate('/dashboard/messages', { replace: true })}><Icon name="x" size={12} /></button>
                                </span>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-2"><ListSkeleton rows={7} leading="avatar" /></div>
                    ) : items.length ? (
                        <>
                            <ul className="divide-y divide-line flex-1 overflow-y-auto">
                                {(() => {
                                    const clientItems = items.filter(m => m.user_id);
                                    const contactItems = items.filter(m => !m.user_id);
                                    return (
                                        <>
                                            {clientItems.length > 0 && (
                                                <>
                                                    <li className="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-ink-muted border-b border-line">Klien</li>
                                                    {clientItems.map(renderListItem)}
                                                </>
                                            )}
                                            {contactItems.length > 0 && (
                                                <>
                                                    <li className="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-ink-muted border-b border-line">Kontak Publik</li>
                                                    {contactItems.map(renderListItem)}
                                                </>
                                            )}
                                        </>
                                    );
                                })()}
                            </ul>
                            {meta.last_page > 1 && (
                                <div className="flex items-center justify-between border-t border-line px-4 py-3">
                                    <button className="btn-outline !py-1 text-xs disabled:opacity-40" disabled={!meta.prev_page_url} onClick={() => load(meta.current_page - 1)}>
                                        Sebelumnya
                                    </button>
                                    <span className="text-xs text-ink-muted">{meta.current_page}/{meta.last_page}</span>
                                    <button className="btn-outline !py-1 text-xs disabled:opacity-40" disabled={!meta.next_page_url} onClick={() => load(meta.current_page + 1)}>
                                        Berikutnya
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-10 text-center">
                            <p className="text-sm text-ink-muted">Tidak ada percakapan.</p>
                        </div>
                    )}
                </div>

                <div className={`flex flex-col overflow-hidden bg-surface lg:col-span-2 ${!selectedConv ? 'hidden lg:flex' : 'flex'}`}>
                    {selectedConv ? (
                        <>
                            <div className="border-b border-line p-4 flex items-center justify-between bg-surface">
                                <div className="flex items-center gap-3">
                                    <button className="lg:hidden p-1.5 -ml-1.5 text-ink-muted hover:text-ink" onClick={() => setSelectedConv(null)}>
                                        <Icon name="arrow-left" size={20} />
                                    </button>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-sm font-bold text-ink">{selectedConv.user?.name || selectedConv.name}</h2>
                                            {!selectedConv.user_id && (
                                                <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">Kontak</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-ink-muted">{selectedConv.user?.email || selectedConv.email || selectedConv.phone || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {selectedConv.phone && (
                                        <a className="btn-outline !px-2 !py-1.5 text-xs" href={`https://wa.me/${selectedConv.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" title="Chat via WhatsApp">
                                            <Icon name="message-circle" size={14} />
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 sm:p-6" ref={scrollRef}>
                                {loadingThread ? (
                                    <Spinner />
                                ) : (
                                    <div className="space-y-4">
                                        {thread.map((m) => {
                                            const isAdmin = m.sender_type === 'admin';
                                            return (
                                                <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] sm:max-w-[75%] ${isAdmin ? 'flex flex-col items-end' : ''}`}>
                                                        <div className="mb-1 flex items-center gap-2 px-1 text-[11px] text-ink-muted">
                                                            <span>{isAdmin ? 'Anda' : (m.user?.name || m.name)}</span>
                                                            <span>•</span>
                                                            <span>{formatDate(m.created_at)}</span>
                                                        </div>
                                                        
                                                        <div className="group relative flex items-center gap-2">
                                                            {isAdmin && (
                                                                 <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                                                                     <button onClick={() => setDeleting(m)} className="p-1 text-red-500 hover:bg-red-500/10 rounded-full" title="Hapus">
                                                                         <Icon name="trash" size={14} />
                                                                     </button>
                                                                     {selectedConv.user_id && (
                                                                         <button onClick={() => setReplyTo(m)} className="p-1 text-ink-muted hover:text-ink hover:bg-surface-muted rounded-full" title="Balas">
                                                                             <Icon name="corner-up-left" size={14} />
                                                                         </button>
                                                                     )}
                                                                 </div>
                                                             )}
                                                            <div className={`relative rounded-2xl px-4 py-3 text-sm ${isAdmin ? 'rounded-tr-sm bg-brand-600 text-white' : 'rounded-tl-sm bg-surface-muted text-ink'}`}>
                                                                {m.reply_to_id && m.reply_to && (
                                                                    <div className={`mb-2 rounded-lg p-2 text-xs border-l-2 ${isAdmin ? 'bg-black/10 border-white/30 text-white/80' : 'bg-white/50 border-ink-muted/30 text-ink-muted'}`}>
                                                                        <p className="font-semibold">{m.reply_to.sender_type === 'admin' ? 'Anda' : (m.reply_to.user?.name || m.reply_to.name)}</p>
                                                                        <p className="line-clamp-1 truncate">{m.reply_to.message || 'Mengirim file'}</p>
                                                                    </div>
                                                                )}
                                                                {m.project && (
                                                                    <a
                                                                        href={`/dashboard/projects/${m.project.order_no || m.project.id}`}
                                                                        className={`mb-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold no-underline transition-colors ${isAdmin ? 'bg-black/20 text-white hover:bg-black/30' : 'bg-white/60 text-brand-700 hover:bg-white'}`}
                                                                    >
                                                                        <Icon name="tag" size={12} /> PSN-{m.project.order_no || m.project.id}
                                                                    </a>
                                                                )}
                                                                {m.message && <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>}
                                                                {m.attachment_url && (
                                                                    <a href={m.attachment_url} target="_blank" rel="noreferrer" className={`mt-2 flex items-center gap-2 rounded-lg p-2 text-xs no-underline ${isAdmin ? 'bg-black/20 text-white hover:bg-black/30' : 'bg-white text-ink hover:bg-white/80'}`}>
                                                                        <Icon name="paperclip" size={14} /> <span>Lihat Lampiran</span>
                                                                    </a>
                                                                )}
                                                            </div>
                                                            {!isAdmin && selectedConv.user_id && (
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
                                {selectedConv.user_id ? (
                                    <form onSubmit={sendReply} className="mx-auto max-w-4xl relative">
                                        {showEmoji && (
                                            <div className="absolute bottom-full mb-2 left-0 z-10 rounded-xl border border-line bg-surface p-2 shadow-lg grid grid-cols-6 gap-1">
                                                {EMOJIS.map(e => (
                                                    <button key={e} type="button" onClick={() => { setReplyMsg(replyMsg + e); setShowEmoji(false); }} className="p-2 text-xl hover:bg-surface-muted rounded-lg transition-colors">{e}</button>
                                                ))}
                                            </div>
                                        )}
                                        {(file || replyTo) && (
                                            <div className="absolute -top-12 left-0 flex flex-wrap items-center gap-2 rounded-t-lg bg-surface/90 backdrop-blur px-3 py-1.5 text-xs">
                                                {file && (
                                                    <span className="flex items-center gap-1.5 rounded-full bg-blue-500/15 px-2 py-1 font-semibold text-blue-700 dark:text-blue-400">
                                                        <Icon name="paperclip" size={12} /> {file.name}
                                                        <button type="button" onClick={() => setFile(null)} className="ml-1 hover:text-blue-900"><Icon name="x" size={12} /></button>
                                                    </span>
                                                )}
                                                {replyTo && (
                                                    <span className="flex items-center gap-1.5 rounded-full bg-zinc-500/15 px-2 py-1 font-semibold text-zinc-700 dark:text-zinc-300">
                                                        <Icon name="corner-up-left" size={12} /> Balas: {replyTo.sender_type === 'admin' ? 'Anda' : (replyTo.user?.name || replyTo.name)}
                                                        <button type="button" onClick={() => setReplyTo(null)} className="ml-1 hover:text-zinc-900"><Icon name="x" size={12} /></button>
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <label className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full text-ink-muted hover:text-brand-600 hover:bg-brand-500/10 transition-colors cursor-pointer">
                                                <Icon name="paperclip" size={20} />
                                                <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => setFile(e.target.files[0])} />
                                            </label>
                                            <div className="flex-1 flex items-center gap-1 rounded-[26px] border border-line bg-surface-muted/50 px-2 py-1 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
                                                <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="shrink-0 p-1.5 text-ink-muted hover:text-brand-600 transition-colors rounded-full hover:bg-brand-500/10">
                                                    <Icon name="smile" size={20} />
                                                </button>
                                                <textarea
                                                    className="flex-1 min-h-[40px] resize-none bg-transparent py-2 text-sm text-ink placeholder:text-ink-muted outline-none"
                                                    rows="1"
                                                    value={replyMsg}
                                                    onChange={(e) => {
                                                        setReplyMsg(e.target.value);
                                                        e.target.style.height = 'auto';
                                                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            sendReply(e);
                                                        }
                                                    }}
                                                    placeholder="Ketik balasan..."
                                                />
                                            </div>
                                            <button type="submit" className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-40" disabled={sending || (!replyMsg.trim() && !file)}>
                                                <Icon name="send" size={18} />
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Pesan dari kontak publik</p>
                                            <p className="text-xs text-ink-muted">Balasan tidak bisa dikirim lewat aplikasi ini. Hubungi melalui email atau WhatsApp.</p>
                                            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                                                {selectedConv.email && (
                                                    <a href={`mailto:${selectedConv.email}`} className="btn-outline !px-4 !py-2 text-sm">
                                                        <Icon name="mail" size={16} /> Balas via Email
                                                    </a>
                                                )}
                                                {selectedConv.phone && (
                                                    <a href={`https://wa.me/${selectedConv.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="btn-primary !px-4 !py-2 text-sm">
                                                        <Icon name="message-circle" size={16} /> Balas via WhatsApp
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center p-10 text-center bg-surface-muted/30">
                            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-ink-muted shadow-sm">
                                <Icon name="message-circle" size={28} />
                            </div>
                            <p className="font-semibold text-ink">Pilih percakapan</p>
                            <p className="mt-1 text-sm text-ink-muted">Klik pesan di kiri untuk membalas.</p>
                        </div>
                    )}
                </div>
            </div>

            <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} />
        </div>
    );
}
