import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import Icon from '../../components/Icon';
import { PageHeader, Spinner, EmptyState, formatDate, formatRupiah } from '../../components/ui';

const STATUS_META = {
    unpaid: { label: 'Belum Bayar', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
    awaiting_dp: { label: 'Menunggu DP', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
    partial: { label: 'Cicilan/DP', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    paid: { label: 'Lunas', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
};

export default function Invoices() {
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [status, setStatus] = useState('');
    const [q, setQ] = useState('');
    const [debounced, setDebounced] = useState('');
    const [loading, setLoading] = useState(true);

    const load = (page = 1, search = debounced) => {
        setLoading(true);
        api.get('/invoices', { params: { page, per_page: 15, status: status || undefined, q: search || undefined } })
            .then(({ data }) => {
                setItems(data.data);
                setMeta(data);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        const t = setTimeout(() => setDebounced(q), 400);
        return () => clearTimeout(t);
    }, [q]);

    useEffect(() => {
        load(1, debounced);
    }, [status, debounced]);

    return (
        <>
            <PageHeader title="Invoice & Tagihan" subtitle="Semua tagihan klien dari berbagai proyek." />

            <div className="mb-4 flex flex-wrap items-center gap-2">
                <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">Semua Status</option>
                    <option value="awaiting_dp">Menunggu DP</option>
                    <option value="unpaid">Belum Bayar</option>
                    <option value="partial">Cicilan/DP</option>
                    <option value="paid">Lunas</option>
                </select>
                <div className="relative flex-1 max-w-sm">
                    <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input className="input pl-9" placeholder="Cari no invoice, proyek, klien..." value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
            </div>

            {loading ? (
                <Spinner />
            ) : items.length ? (
                <div className="card overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>No. Invoice</th>
                                <th>Proyek & Klien</th>
                                <th>Tanggal</th>
                                <th>Status</th>
                                <th>Total Tagihan</th>
                                <th>Kekurangan</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id}>
                                    <td className="font-mono text-sm font-semibold text-ink">{item.number}</td>
                                    <td>
                                        <p className="font-medium text-ink">{item.project || '-'}</p>
                                        <p className="text-xs text-ink-muted">{item.client || '-'}</p>
                                    </td>
                                    <td className="text-sm text-ink-muted">{item.issued_at ? formatDate(item.issued_at) : '-'}</td>
                                    <td>
                                        <span className={`badge ${STATUS_META[item.status]?.cls}`}>{STATUS_META[item.status]?.label}</span>
                                    </td>
                                    <td className="text-sm font-semibold text-ink">{formatRupiah(item.price)}</td>
                                    <td className={`text-sm font-semibold ${item.remaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {formatRupiah(item.remaining)}
                                    </td>
                                    <td>
                                        <Link to={`/dashboard/projects/${item.project_id}`} className="btn-outline text-xs">
                                            Detail Proyek
                                        </Link>
                                    </td>
                                </tr>
                            ))}
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
                <EmptyState icon="credit-card" title="Tidak ada invoice" message="Belum ada tagihan yang sesuai." />
            )}
        </>
    );
}