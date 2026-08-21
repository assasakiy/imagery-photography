import { useEffect, useState } from 'react';
import api from '../../api';
import { toast } from '../../lib/toast';
import Icon from '../../components/Icon';
import PresenceBadge from '../../components/PresenceBadge';
import FilterDropdown from '../../components/FilterDropdown';
import { PageHeader, EmptyState } from '../../components/ui';
import Skeleton from '../../components/Skeleton';

const VIEWS = [
    { key: 'presence', label: 'Kehadiran', icon: 'activity' },
    { key: 'login', label: 'Riwayat Login', icon: 'clock' },
    { key: 'activity', label: 'Log Aktivitas', icon: 'list' },
    { key: 'links', label: 'Riwayat Tautan', icon: 'link' },
];

const STATUS_META = {
    success: { label: 'Berhasil', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    failed: { label: 'Gagal', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
};

const ACCOUNT_STATE_META = {
    registered: { label: 'Terdaftar', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    pending: { label: 'Belum diaktifkan', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    disabled: { label: 'Dinonaktifkan', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
    deleted: { label: 'Akun dihapus', cls: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400' },
    unknown: { label: 'Belum terdaftar', cls: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400' },
};

function AccountStateBadge({ state }) {
    if (!state || state === 'registered') return null;
    const meta = ACCOUNT_STATE_META[state];
    if (!meta) return null;
    if (state === 'deleted' || state === 'unknown') {
        return <span className={`italic ${meta.cls.replace('bg-zinc-500/15 ', '')}`}>{meta.label}</span>;
    }
    return <span className={`badge ${meta.cls}`}>{meta.label}</span>;
}

const LINK_STATUS_META = {
    pending: { label: 'Menunggu', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    expired: { label: 'Kedaluwarsa', cls: 'bg-zinc-500/15 text-ink-muted' },
    accepted: { label: 'Dipakai', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    cancelled: { label: 'Dibatalkan', cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
};

const PURPOSE_LABEL = { invite: 'Undangan', recovery: 'Recovery', project: 'Akses Proyek' };

function linkStatusMeta(it) {
    if (it.used_at || it.status === 'accepted') {
        return { label: 'Dipakai', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' };
    }
    return LINK_STATUS_META[it.status] || { label: it.status, cls: 'bg-zinc-500/15 text-ink-muted' };
}

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
    const [categorySel, setCategorySel] = useState('');
    const [status, setStatus] = useState('');
    const [q, setQ] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/audit/actions').then(({ data }) => setActions(data)).catch(() => {});
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q.trim()), 400);
        return () => clearTimeout(t);
    }, [q]);

    const load = (page = 1) => {
        setLoading(true);
        const endpoint = view === 'login' ? '/audit/login-history' : view === 'links' ? '/audit/links' : view === 'presence' ? '/audit/online-users' : '/audit';
        const params = { page, per_page: 25 };
        if (view === 'login') {
            if (status) params.status = status;
        } else if (view === 'links') {
            if (action) params.purpose = action;
            if (status) params.status = status;
        } else if (view === 'presence') {
            if (action) params.role = action;
        } else {
            if (categorySel) params.category = categorySel;
        }
        if (debouncedQ) params.q = debouncedQ;

        api.get(endpoint, { params })
            .then(({ data }) => {
                if (view === 'presence') {
                    setItems(data);
                    setMeta({ total: data.length });
                } else {
                    setItems(data.data);
                    setMeta(data);
                }
            })
            .catch(() => toast.error('Gagal memuat data.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, action, categorySel, status, debouncedQ]);

    const switchView = (v) => {
        setView(v);
        setStatus('');
        setAction('');
        setCategorySel('');
        setQ('');
        setItems([]);
    };

    const categories = [...new Set((actions || []).map((a) => a.split('.')[0]).filter(Boolean))];

    const CATEGORY_ICONS = { blog: 'file', media: 'images', page: 'file', portfolio: 'briefcase', settings: 'settings', team: 'users', payment: 'wallet', project: 'package', review: 'star', auth: 'lock', booking: 'calendar' };

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

            <div className="mb-4 flex flex-wrap items-center gap-y-2 gap-x-1.5">
                <div className="relative w-full md:w-96">
                    <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input
                        className="input pl-9"
                        placeholder="Cari nama / email / IP / aksi…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                </div>
                <div className="ml-auto flex w-full flex-wrap items-center gap-1.5 md:w-auto">
                    {view === 'presence' ? (
                        <FilterDropdown
                            title="Filter Role"
                            icon="users"
                            value={action}
                            onChange={setAction}
                            options={[
                                { key: 'owner', label: 'Owner', icon: 'shield' },
                                { key: 'admin', label: 'Admin', icon: 'users' },
                                { key: 'client', label: 'Client', icon: 'user' },
                                { key: 'subscriber', label: 'Subscriber', icon: 'user' },
                            ]}
                        />
                    ) : view === 'login' ? (
                        <FilterDropdown
                            title="Status Login"
                            icon="clock"
                            value={status}
                            onChange={setStatus}
                            options={Object.entries(STATUS_META).map(([k, m]) => ({ key: k, label: m.label, icon: k === 'success' ? 'check' : 'x' }))}
                        />
                    ) : view === 'links' ? (
                        <FilterDropdown
                            title="Jenis & Status"
                            icon="link"
                            multi
                            singlePerGroup
                            value={[
                                ...(action ? [`purpose:${action}`] : []),
                                ...(status ? [`status:${status}`] : []),
                            ]}
                            onChange={(keys) => {
                                const purpose = keys.find((k) => k.startsWith('purpose:'));
                                const st = keys.find((k) => k.startsWith('status:'));
                                setAction(purpose ? purpose.slice(8) : '');
                                setStatus(st ? st.slice(7) : '');
                            }}
                            options={[
                                ...Object.entries(PURPOSE_LABEL).map(([k, label]) => ({ key: 'purpose:' + k, label, icon: k === 'invite' ? 'mail' : k === 'recovery' ? 'lock' : 'folder', group: 'types' })),
                                ...Object.entries(LINK_STATUS_META).map(([k, m]) => ({ key: 'status:' + k, label: m.label, icon: k === 'accepted' ? 'check' : k === 'cancelled' ? 'x' : 'clock', group: 'status' })),
                            ]}
                        />
                    ) : (
                        <FilterDropdown
                            title="Filter Kategori"
                            icon="file"
                            value={categorySel}
                            onChange={setCategorySel}
                            options={categories.map((c) => ({ key: c, label: c, icon: CATEGORY_ICONS[c] }))}
                        />
                    )}
                </div>
            </div>

            {loading ? (
                <Skeleton variant="table" />
            ) : items.length === 0 ? (
                <EmptyState icon="clock" title={view === 'login' ? 'Belum ada riwayat login' : view === 'links' ? 'Belum ada riwayat tautan' : view === 'presence' ? 'Belum ada pengguna' : 'Belum ada log aktivitas'} />
            ) : view === 'presence' ? (
                <div className="card overflow-x-auto">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Terakhir Aktif</th>
                                <th>Sesi Aktif</th>
                                <th>Perangkat</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it) => (
                                <tr key={it.id}>
                                    <td>
                                        <p className="font-medium text-ink">{it.name}</p>
                                        <p className="text-xs text-ink-muted">{it.email || it.username}</p>
                                    </td>
                                    <td>
                                        <span className="badge">{it.role}</span>
                                    </td>
                                    <td>
                                        <PresenceBadge online={it.online} lastSeenAt={it.last_seen_at} />
                                    </td>
                                    <td className="whitespace-nowrap text-xs text-ink-muted">
                                        {it.last_seen_at ? formatDateTime(it.last_seen_at) : 'belum pernah aktif'}
                                    </td>
                                    <td className="whitespace-nowrap text-xs text-ink-muted">
                                        {it.online && it.session_duration != null ? formatDuration(it.session_duration) : it.session_open ? formatDateTime(it.session_open) : '-'}
                                    </td>
                                    <td className="max-w-[220px] truncate text-xs text-ink-muted" title={it.session_device || ''}>
                                        {shortUA(it.session_device)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                            <p className="font-medium text-ink">{it.account_identity || it.user?.name || (it.account_state === 'unknown' ? it.identifier : 'Akun terhapus')}</p>
                                            <AccountStateBadge state={it.account_state} />
                                        </div>
                                        {it.account_state !== 'unknown' && (
                                            <p className="text-xs text-ink-muted">{it.account_email || it.user?.email || ''}</p>
                                        )}
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
                                        {it.online ? (
                                            <PresenceBadge online lastSeenAt={it.logged_in_at} />
                                        ) : it.suspicious ? (
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
                                        <span className={`badge ${linkStatusMeta(it).cls}`}>
                                            {linkStatusMeta(it).label}
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
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                            <p className="font-medium text-ink">
                                                {it.account_identity || it.user_name || (it.account_state === 'unknown' && it.identifier ? it.identifier : '-')}
                                            </p>
                                            <AccountStateBadge state={it.account_state} />
                                        </div>
                                        {it.account_state === 'unknown' ? (
                                            <p className="font-mono text-xs text-ink-muted">{it.identifier || ''}</p>
                                        ) : (
                                            <p className="text-xs text-ink-muted">{it.user_role || ''}</p>
                                        )}
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
