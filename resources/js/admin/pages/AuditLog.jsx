import { useEffect, useState } from 'react';
import api from '../api';
import Icon from '../components/Icon';
import { PageHeader, Spinner, EmptyState } from '../components/ui';

const VIEWS = [
    { key: 'login', label: 'Riwayat Login', icon: 'clock' },
    { key: 'activity', label: 'Log Aktivitas', icon: 'list' },
    { key: 'links', label: 'Riwayat Tautan', icon: 'link' },
];

const STATUS_META = {
    success: { label: 'Berhasil', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    failed: { label: 'Gagal', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
};

const LINK_STATUS_META = {
    pending: { label: 'Menunggu', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    expired: { label: 'Kedaluwarsa', cls: 'bg-zinc-500/15 text-ink-muted' },
    accepted: { label: 'Dipakai', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    cancelled: { label: 'Dibatalkan', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
};

const PURPOSE_LABEL = { invite: 'Undangan', recovery: 'Recovery', project: 'Akses Proyek' };

const METHOD_LABEL = { password: 'Password', otp: 'OTP', google: 'Google' };

function formatDateTime(value) {
    if (!value) return '-';
    const d = new Date(value);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) +
        ', ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(seconds) {
    if (!seconds && seconds !== 0) return '-';
    if (seconds < 60) return `${seconds} dtk`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s ? `${m} mnt ${s} dtk` : `${m} mnt`;
}

function shortUA(ua) {
    if (!ua) return '-';
    if (ua.length <= 60) return ua;
    return ua.slice(0, 58) + '…';
}

export default function AuditLog() {
    const [view, setView] = useState('login');
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({});
    const [actions, setActions] = useState([]);
    const [action, setAction] = useState('');
    const [status, setStatus] = useState('');
    const [q, setQ] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/audit/actions').then(({ data }) => setActions(data)).catch(() => {});
    }, []);

    const load = (page = 1) => {
        setLoading(true);
        const endpoint = view === 'login' ? '/audit/login-history' : view === 'links' ? '/audit/links' : '/audit';
        const params = { page, per_page: 25 };
        if (view === 'login') {
            if (status) params.status = status;
        } else if (view === 'links') {
            if (action) params.purpose = action;
            if (status) params.status = status;
        } else {
            if (action) params.action = action;
        }
        if (q.trim()) params.q = q.trim();

        api.get(endpoint, { params })
            .then(({ data }) => {
                setItems(data.data);
                setMeta(data);
            })
            .finally(() => setLoading(false));
    };

    useEffect(load, [view]);

    const switchView = (v) => {
        setView(v);
        setStatus('');
        setAction('');
        setQ('');
        setItems([]);
    };

    return (
        <>
            <PageHeader title="Audit & Log" subtitle="Riwayat login keamanan dan jejak aktivitas penting di sistem." />

            <div className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1">
                {VIEWS.map((v) => (
                    <button
                        key={v.key}
                        type="button"
                        onClick={() => switchView(v.key)}
                        className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                            view === v.key ? 'bg-brand-600 text-white shadow' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                        }`}
                    >
                        <Icon name={v.icon} size={16} /> {v.label}
                    </button>
                ))}
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
                {view === 'login' ? (
                    <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); }}>
                        <option value="">Semua status</option>
                        <option value="success">Berhasil</option>
                        <option value="failed">Gagal</option>
                    </select>
                ) : view === 'links' ? (
                    <>
                        <select className="input w-auto" value={action} onChange={(e) => { setAction(e.target.value); }}>
                            <option value="">Semua jenis</option>
                            {Object.entries(PURPOSE_LABEL).map(([k, label]) => (
                                <option key={k} value={k}>{label}</option>
                            ))}
                        </select>
                        <select className="input w-auto" value={status} onChange={(e) => { setStatus(e.target.value); }}>
                            <option value="">Semua status</option>
                            {Object.entries(LINK_STATUS_META).map(([k, m]) => (
                                <option key={k} value={k}>{m.label}</option>
                            ))}
                        </select>
                    </>
                ) : (
                    <select className="input w-auto" value={action} onChange={(e) => { setAction(e.target.value); }}>
                        <option value="">Semua aksi</option>
                        {actions.map((a) => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>
                )}
                <input
                    className="input w-56"
                    placeholder="Cari nama / IP / aksi…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') load(); }}
                />
                <button className="btn-outline" onClick={() => load()} disabled={loading}>
                    <Icon name="search" size={16} /> Cari
                </button>
            </div>

            {loading ? (
                <Spinner />
            ) : items.length === 0 ? (
                <EmptyState icon="clock" title={view === 'login' ? 'Belum ada riwayat login' : view === 'links' ? 'Belum ada riwayat tautan' : 'Belum ada log aktivitas'} />
            ) : view === 'login' ? (
                <div className="card overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Status</th>
                                <th>Metode</th>
                                <th>IP</th>
                                <th>Perangkat</th>
                                <th>Masuk</th>
                                <th>Durasi</th>
                                <th>Keamanan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it) => (
                                <tr key={it.id}>
                                    <td>
                                        <p className="font-medium text-ink">{it.user?.name || it.user_name || 'Akun terhapus'}</p>
                                        {it.user?.email && <p className="text-xs text-ink-muted">{it.user.email}</p>}
                                    </td>
                                    <td>
                                        <span className={`badge ${STATUS_META[it.status]?.cls || 'bg-zinc-500/15 text-ink-muted'}`}>
                                            {STATUS_META[it.status]?.label || it.status}
                                        </span>
                                    </td>
                                    <td className="text-ink">{METHOD_LABEL[it.method] || it.method || '-'}</td>
                                    <td className="font-mono text-xs text-ink">{it.ip || '-'}</td>
                                    <td className="max-w-[220px] truncate text-xs text-ink-muted" title={it.user_agent || ''}>
                                        {shortUA(it.user_agent)}
                                    </td>
                                    <td className="whitespace-nowrap text-xs text-ink-muted">{formatDateTime(it.logged_in_at)}</td>
                                    <td className="text-xs text-ink-muted">{it.status === 'success' ? formatDuration(it.duration_seconds) : '-'}</td>
                                    <td>
                                        {it.suspicious ? (
                                            <span className="badge bg-red-500/15 text-red-600 dark:text-red-400">Mencurigakan</span>
                                        ) : (
                                            <span className="text-xs text-ink-muted">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : view === 'links' ? (
                <div className="card overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Dibuat</th>
                                <th>User</th>
                                <th>Jenis</th>
                                <th>Status</th>
                                <th>Tautan</th>
                                <th>Kedaluwarsa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it) => (
                                <tr key={it.id}>
                                    <td className="whitespace-nowrap text-xs text-ink-muted">{formatDateTime(it.created_at)}</td>
                                    <td>
                                        <p className="font-medium text-ink">{it.user?.name || 'Akun terhapus'}</p>
                                        {it.user?.email && <p className="text-xs text-ink-muted">{it.user.email}</p>}
                                    </td>
                                    <td>
                                        <span className="badge">{PURPOSE_LABEL[it.purpose] || it.purpose}</span>
                                    </td>
                                    <td>
                                        <span className={`badge ${LINK_STATUS_META[it.status]?.cls || 'bg-zinc-500/15 text-ink-muted'}`}>
                                            {LINK_STATUS_META[it.status]?.label || it.status}
                                            {it.used_at ? ' · dipakai' : ''}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="max-w-[220px] truncate font-mono text-xs text-brand-600 dark:text-brand-400 hover:underline"
                                            title={it.url}
                                            onClick={() => { navigator.clipboard.writeText(it.url).then(() => {}); }}
                                        >
                                            {it.url || it.token}
                                        </button>
                                    </td>
                                    <td className="whitespace-nowrap text-xs text-ink-muted">{it.expires_at ? formatDateTime(it.expires_at) : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Waktu</th>
                                <th>User</th>
                                <th>Aksi</th>
                                <th>Deskripsi</th>
                                <th>IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it) => (
                                <tr key={it.id}>
                                    <td className="whitespace-nowrap text-xs text-ink-muted">{formatDateTime(it.created_at)}</td>
                                    <td>
                                        <p className="font-medium text-ink">{it.user_name || '-'}</p>
                                        {it.user_role && <p className="text-xs text-ink-muted">{it.user_role}</p>}
                                    </td>
                                    <td>
                                        <code className="rounded-md bg-surface-muted px-1.5 py-0.5 text-xs text-ink">{it.action}</code>
                                    </td>
                                    <td className="max-w-[320px] text-sm text-ink">{it.description || '-'}</td>
                                    <td className="font-mono text-xs text-ink-muted">{it.ip || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {meta.last_page > 1 && (
                <div className="mt-5 flex items-center justify-between gap-3">
                    <button className="btn-outline disabled:opacity-40" disabled={!meta.prev_page_url} onClick={() => load(meta.current_page - 1)}>
                        Sebelumnya
                    </button>
                    <span className="text-sm text-ink-muted">Halaman {meta.current_page} dari {meta.last_page}</span>
                    <button className="btn-outline disabled:opacity-40" disabled={!meta.next_page_url} onClick={() => load(meta.current_page + 1)}>
                        Berikutnya
                    </button>
                </div>
            )}
        </>
    );
}
