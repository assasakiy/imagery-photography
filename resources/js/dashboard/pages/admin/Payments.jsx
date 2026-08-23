import { useEffect, useState } from 'react';
import api from '../../api';
import { toast } from '../../lib/toast';
import { getApiErrorMessage } from '../../lib/errors';
import Icon from '../../components/Icon';
import { PageHeader, EmptyState, Modal, formatRupiah, formatDate } from '../../components/ui';
import Skeleton from '../../components/Skeleton';
import { refreshBadges } from '../../context/BadgeContext';

const STATUS_TABS = [
    { key: '', label: 'Semua', icon: 'list' },
    { key: 'pending', label: 'Menunggu', icon: 'clock' },
    { key: 'confirmed', label: 'Terkonfirmasi', icon: 'check' },
    { key: 'failed', label: 'Ditolak', icon: 'x' },
];

const STATUS_META = {
    confirmed: { label: 'Terkonfirmasi', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    pending: { label: 'Menunggu', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    expired: { label: 'Kadaluarsa', cls: 'bg-zinc-500/15 text-ink-muted' },
    failed: { label: 'Ditolak', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
};

function methodMeta(p) {
    if (p.method === 'gateway') {
        const gw = (p.gateway || '').toLowerCase();
        const gwName = gw === 'tripay' ? 'TriPay' : gw ? gw.charAt(0).toUpperCase() + gw.slice(1) : null;
        return { label: 'Payment Gateway', channel: [p.gateway_method, gwName].filter(Boolean).join(' · ') };
    }
    const notes = (p.notes || '').trim();
    let channel = null;
    if (/^bayar via qris/i.test(notes)) {
        const merchant = notes.replace(/^bayar via qris/i, '').trim();
        channel = merchant ? `QRIS · ${merchant}` : 'QRIS';
    } else if (/^transfer ke /i.test(notes)) {
        channel = notes.replace(/^transfer ke /i, '');
    } else if (notes) {
        channel = notes;
    }
    return { label: 'Transfer Manual', channel };
}

export default function Payments() {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [status, setStatus] = useState('');
    const [q, setQ] = useState('');
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(null);
    const [detail, setDetail] = useState(null);
    const [proofView, setProofView] = useState(null);

    const load = (page = 1) => {
        setLoading(true);
        api.get('/payments', { params: { page, per_page: 15, status: status || undefined } })
            .then(({ data }) => {
                setItems(data.data);
                setMeta(data);
            })
            .catch(() => toast.error('Gagal memuat data.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [status]);

    const act = async (payment, action) => {
        setActing(payment.id);
        try {
            await api.patch(`/payments/${payment.id}/${action}`);
            toast.success(action === 'confirm' ? 'Pembayaran dikonfirmasi.' : 'Pembayaran ditolak.');
            setDetail((d) => (d && d.id === payment.id ? null : d));
            load(meta.current_page);
            refreshBadges();
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal memproses pembayaran.'));
        } finally {
            setActing(null);
        }
    };

    const filtered = items.filter((p) => {
        if (!q.trim()) return true;
        const hay = `${p.project?.user?.name || ''} ${p.project?.user?.email || ''} ${p.project?.name || ''}`.toLowerCase();
        return hay.includes(q.trim().toLowerCase());
    });

    return (
        <>
            <PageHeader title="Pembayaran" subtitle="Konfirmasi pembayaran dari klien." />

            <div className="mb-4 flex items-center gap-3 border-b border-line pb-4">
                <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
                    {STATUS_TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setStatus(t.key)}
                            className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                status === t.key ? 'bg-brand-600 text-white' : 'bg-surface-muted text-ink-muted hover:text-ink'
                            }`}
                        >
                            <Icon name={t.icon} size={16} /> <span className="hidden sm:inline">{t.label}</span>
                        </button>
                    ))}
                </div>
                <div className="relative min-w-0 flex-1">
                    <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input className="input w-full pl-9 py-1.5" placeholder="Cari klien atau pesanan..." value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
            </div>

            {loading ? (
                <Skeleton variant="table" />
            ) : filtered.length ? (
                <div className="card overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Klien</th>
                                <th>Pesanan</th>
                                <th>Jumlah</th>
                                <th>Metode</th>
                                <th>Status</th>
                                <th className="w-24">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => {
                                const { label: methodLabel, channel } = methodMeta(p);
                                return (
                                    <tr key={p.id}>
                                        <td className="text-xs text-ink-muted">{formatDate(p.created_at)}</td>
                                        <td>
                                            <p className="font-medium text-ink">{p.project?.user?.name || '-'}</p>
                                            <p className="text-xs text-ink-muted">{p.project?.user?.email || ''}</p>
                                        </td>
                                        <td className="text-sm text-ink">{p.project?.name || '-'}</td>
                                        <td className="font-semibold text-ink">{formatRupiah(p.amount)}</td>
                                        <td>
                                            <p className="text-sm font-medium text-ink">{methodLabel}</p>
                                            {channel && <p className="truncate text-xs text-ink-muted">{channel}</p>}
                                        </td>
                                        <td><span className={`badge ${STATUS_META[p.status]?.cls || ''}`}>{STATUS_META[p.status]?.label || p.status}</span></td>
                                        <td>
                                            <div className="flex items-center gap-1.5">
                                                <button className="icon-btn" onClick={() => setDetail(p)} title="Lihat detail pembayaran">
                                                    <Icon name="eye" size={16} />
                                                </button>
                                                {p.status === 'pending' && (
                                                    <>
                                                        <button className="icon-btn !text-emerald-600 hover:!bg-emerald-500/10" title="Terima pembayaran" disabled={acting === p.id} onClick={() => act(p, 'confirm')}>
                                                            <Icon name="check" size={16} />
                                                        </button>
                                                        <button className="icon-btn !text-red-600 hover:!bg-red-500/10" title="Tolak pembayaran" disabled={acting === p.id} onClick={() => act(p, 'reject')}>
                                                            <Icon name="x" size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {meta.last_page > 1 && (
                        <div className="flex items-center justify-between px-4 py-3">
                            <button className="btn-outline disabled:opacity-40" disabled={!meta.prev_page_url} onClick={() => load(meta.current_page - 1)}>Sebelumnya</button>
                            <span className="text-sm text-ink-muted">Halaman {meta.current_page} dari {meta.last_page}</span>
                            <button className="btn-outline disabled:opacity-40" disabled={!meta.next_page_url} onClick={() => load(meta.current_page + 1)}>Berikutnya</button>
                        </div>
                    )}
                </div>
            ) : (
                <EmptyState icon="credit-card" title="Belum ada pembayaran" message="Belum ada pembayaran pada status ini." />
            )}

            <Modal
                open={!!detail}
                onClose={() => setDetail(null)}
                title="Detail Pembayaran"
                wide
                footer={
                    detail?.status === 'pending' ? (
                        <div className="flex w-full justify-between gap-2">
                            <button
                                className="btn-outline text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 dark:hover:bg-red-500/10"
                                disabled={acting === detail.id}
                                onClick={() => act(detail, 'reject')}
                            >
                                Tolak
                            </button>
                            <button className="btn-primary" disabled={acting === detail.id} onClick={() => act(detail, 'confirm')}>
                                {acting === detail.id ? '...' : 'Konfirmasi Pembayaran'}
                            </button>
                        </div>
                    ) : null
                }
            >
                {detail && (() => {
                    const { label: methodLabel, channel } = methodMeta(detail);
                    return (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 border-b border-line pb-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-600">
                                    <Icon name="user" size={20} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="truncate font-bold text-ink">{detail.project?.user?.name || '-'}</h3>
                                    <p className="truncate text-sm text-ink-muted">{detail.project?.user?.email || ''}</p>
                                </div>
                                <div className="ml-auto shrink-0">
                                    <span className={`badge ${STATUS_META[detail.status]?.cls || ''}`}>{STATUS_META[detail.status]?.label || detail.status}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-xs text-ink-muted">Pesanan</p><p className="text-sm font-semibold text-ink">{detail.project?.name || '-'}</p></div>
                                <div><p className="text-xs text-ink-muted">Jumlah</p><p className="font-mono text-sm font-bold text-ink">{formatRupiah(detail.amount)}</p></div>
                                <div><p className="text-xs text-ink-muted">Metode</p><p className="text-sm font-semibold text-ink">{methodLabel}</p></div>
                                <div><p className="text-xs text-ink-muted">Kanal</p><p className="text-sm font-semibold text-ink">{channel || '-'}</p></div>
                                <div><p className="text-xs text-ink-muted">Tanggal Bayar</p><p className="text-sm font-semibold text-ink">{detail.paid_at ? formatDate(detail.paid_at) : '-'}</p></div>
                                <div><p className="text-xs text-ink-muted">Dibuat</p><p className="text-sm font-semibold text-ink">{formatDate(detail.created_at)}</p></div>
                                {detail.gateway_ref && (
                                    <div><p className="text-xs text-ink-muted">Referensi Gateway</p><p className="font-mono text-sm font-semibold text-ink">{detail.gateway_ref}</p></div>
                                )}
                            </div>

                            {detail.notes && !methodMeta(detail).channel && (
                                <div>
                                    <p className="mb-1 text-xs text-ink-muted">Catatan</p>
                                    <div className="rounded-xl bg-surface-muted p-3 text-sm text-ink">{detail.notes}</div>
                                </div>
                            )}

                            <div>
                                <p className="mb-2 text-xs text-ink-muted">Bukti Pembayaran</p>
                                {detail.proof_url ? (
                                    detail.proof_mime === 'application/pdf' ? (
                                        <button type="button" onClick={() => setProofView({ url: detail.proof_url, pdf: true })} className="flex w-fit items-center gap-3 rounded-xl border border-line bg-surface-muted/30 p-4 transition-opacity hover:opacity-85">
                                            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
                                                <Icon name="file-text" size={22} />
                                            </span>
                                            <span className="text-sm font-semibold text-brand-600 underline dark:text-brand-400">Lihat Bukti (PDF)</span>
                                        </button>
                                    ) : (
                                        <button type="button" onClick={() => setProofView({ url: detail.proof_url, pdf: false })} title="Lihat gambar penuh" className="block w-fit">
                                            <img
                                                src={detail.proof_url}
                                                alt="Bukti pembayaran"
                                                className="max-h-72 rounded-xl border border-line object-contain transition-opacity hover:opacity-85"
                                            />
                                        </button>
                                    )
                                ) : (
                                    <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-line bg-surface-muted/30 p-6 text-center">
                                        <Icon name="credit-card" size={22} className="text-ink-muted" />
                                        <p className="text-xs text-ink-muted">Tidak ada bukti terlampir.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </Modal>

            <Modal
                open={!!proofView}
                onClose={() => setProofView(null)}
                title="Bukti Pembayaran"
                wide
                bodyClassName="bg-zinc-950 flex items-center justify-center"
            >
                {proofView && (proofView.pdf ? (
                    <iframe src={proofView.url} title="Bukti pembayaran" className="h-[80vh] w-full rounded-xl bg-white" />
                ) : (
                    <img src={proofView.url} alt="Bukti pembayaran" className="max-h-[85vh] max-w-full rounded-xl object-contain" />
                ))}
            </Modal>
        </>
    );
}
