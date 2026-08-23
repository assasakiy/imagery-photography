import { useEffect, useState } from 'react';
import api from '../../api';
import { toast } from '../../lib/toast';
import Icon from '../../components/Icon';
import { PageHeader, EmptyState, Spinner } from '../../components/ui';
import { StatCardsSkeleton, ChartSkeleton } from '../../components/Skeleton';

const fmt = (n) => (n ?? 0).toLocaleString('id-ID');

function TrendChart({ data = [] }) {
    const points = data;
    if (!points.length) return <EmptyState icon="trending-up" title="Belum ada data kunjungan" message="Data akan muncul setelah pengunjung mengizinkan cookie analitik." />;

    const max = Math.max(1, ...points.map((p) => Math.max(p.views, p.visitors)));
    const W = 700;
    const H = 220;
    const PAD = { top: 16, right: 16, bottom: 32, left: 48 };
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;

    const toY = (v) => PAD.top + innerH - (v / max) * innerH;
    const toX = (i) => PAD.left + i * stepX;

    const viewsCoords = points.map((p, i) => ({ x: toX(i), y: toY(p.views), ...p }));
    const visitorCoords = points.map((p, i) => ({ x: toX(i), y: toY(p.visitors) }));

    const viewsPath = viewsCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
    const visitorsPath = visitorCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
    const areaPath = viewsPath + ` L ${viewsCoords[viewsCoords.length - 1].x} ${PAD.top + innerH} L ${viewsCoords[0].x} ${PAD.top + innerH} Z`;

    const gridLines = 4;
    const gridYs = Array.from({ length: gridLines + 1 }, (_, i) => {
        const v = (max / gridLines) * i;
        return { y: toY(v), label: v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : Math.round(v) };
    });

    const midIdx = Math.floor(points.length / 2);

    return (
        <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
                <h2 className="flex items-center gap-2 font-bold text-ink">
                    <Icon name="trending-up" size={16} /> Tren Kunjungan 30 Hari
                </h2>
                <div className="flex items-center gap-4 text-xs font-medium text-ink-muted">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-500" /> Page Views</span>
                    <span className="flex items-center gap-1.5"><span className="h-px w-4 border-t-2 border-dashed border-emerald-500" /> Unique Visitor</span>
                </div>
            </div>
            <div className="px-2 pt-3 pb-1 sm:px-3">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 'clamp(170px, 22vw, 230px)' }} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Tren kunjungan 30 hari">
                    <defs>
                        <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-brand-500, #8b5cf6)" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="var(--color-brand-500, #8b5cf6)" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {gridYs.map((g, i) => (
                        <g key={i}>
                            <line x1={PAD.left} y1={g.y} x2={W - PAD.right} y2={g.y} className="stroke-line" strokeWidth="1" strokeDasharray={i === 0 ? '' : '3 3'} />
                            <text x={PAD.left - 8} y={g.y + 3} textAnchor="end" className="fill-ink-muted" fontSize="10" fontFamily="inherit">{g.label}</text>
                        </g>
                    ))}

                    <path d={areaPath} fill="url(#viewsFill)" />
                    <path d={viewsPath} fill="none" strokeWidth="2.5" className="stroke-brand-500" strokeLinecap="round" strokeLinejoin="round" />
                    <path d={visitorsPath} fill="none" strokeWidth="1.5" className="stroke-emerald-500" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />

                    {viewsCoords.map((c) => (
                        <circle key={c.date} cx={c.x} cy={c.y} r="3" className="fill-white stroke-brand-500 dark:fill-zinc-900" strokeWidth="2">
                            <title>{`${c.date}: ${fmt(c.views)} views / ${fmt(c.visitors)} visitor`}</title>
                        </circle>
                    ))}

                    <text x={viewsCoords[0].x} y={H - 6} textAnchor="middle" className="fill-ink-muted" fontSize="10" fontFamily="inherit">{points[0]?.label}</text>
                    <text x={viewsCoords[midIdx].x} y={H - 6} textAnchor="middle" className="fill-ink-muted" fontSize="10" fontFamily="inherit">{points[midIdx]?.label}</text>
                    <text x={viewsCoords[viewsCoords.length - 1].x} y={H - 6} textAnchor="middle" className="fill-ink-muted" fontSize="10" fontFamily="inherit">{points[points.length - 1]?.label}</text>
                </svg>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color = 'bg-brand-600/15 text-brand-600 dark:text-brand-400', trend }) {
    return (
        <div className="card p-4">
            <div className="flex items-start justify-between">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
                    <Icon name={icon} size={18} />
                </div>
                {trend && (
                    <span className={`badge ${trend.up ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'}`}>
                        <Icon name="trending-up" size={11} className={trend.up ? '' : 'rotate-180'} /> {trend.text}
                    </span>
                )}
            </div>
            <p className="mt-3 text-xl font-bold text-ink truncate">{value}</p>
            <p className="mt-0.5 text-xs text-ink-muted truncate" title={label}>{label}</p>
        </div>
    );
}

function RankedList({ title, icon, items, valueKey = 'total', labelKey = 'name', suffix = '' }) {
    if (!items || !items.length) return null;
    return (
        <div className="card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line px-5 py-4">
                <Icon name={icon} size={16} className="text-ink-muted" />
                <h3 className="font-bold text-ink">{title}</h3>
            </div>
            <div className="divide-y divide-line">
                {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 px-5 py-2.5">
                        <div className="flex min-w-0 items-center gap-3">
                            <span className="w-5 shrink-0 text-xs font-bold text-ink-muted">{i + 1}</span>
                            <span className="min-w-0 truncate text-sm text-ink">{item[labelKey] || '—'}</span>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-ink-muted">{fmt(item[valueKey])}{suffix}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ShareBar({ items = [], valueKey = 'total', labelKey = 'path' }) {
    if (!items.length) return null;
    const max = Math.max(1, ...items.map((i) => i[valueKey]));
    return (
        <div className="card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line px-5 py-4">
                <Icon name="bar-chart-3" size={16} className="text-ink-muted" />
                <h3 className="font-bold text-ink">Halaman Terpopuler</h3>
            </div>
            <div className="space-y-3 p-5">
                {items.map((item, i) => (
                    <div key={i}>
                        <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                            <span className="min-w-0 truncate font-medium text-ink">{item[labelKey] || '/'}</span>
                            <span className="shrink-0 text-ink-muted">{fmt(item[valueKey])}</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                            <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(3, (item[valueKey] / max) * 100)}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function DeviceList({ items = [] }) {
    if (!items.length) return null;
    return (
        <div className="card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line px-5 py-4">
                <Icon name="laptop" size={16} className="text-ink-muted" />
                <h3 className="font-bold text-ink">Perangkat</h3>
            </div>
            <div className="divide-y divide-line">
                {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-2.5">
                        <span className="text-sm capitalize text-ink">{item.device_type || 'unknown'}</span>
                        <span className="text-sm font-semibold text-ink-muted">{fmt(item.total)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Analytics() {
    const [overview, setOverview] = useState(null);
    const [visits, setVisits] = useState(null);
    const [accounts, setAccounts] = useState(null);
    const [behavior, setBehavior] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('visits');

    useEffect(() => {
        Promise.all([
            api.get('/analytics/overview'),
            api.get('/analytics/visits'),
            api.get('/analytics/accounts'),
            api.get('/analytics/behavior'),
        ])
            .then(([o, v, a, b]) => {
                setOverview(o.data);
                setVisits(v.data);
                setAccounts(a.data);
                setBehavior(b.data);
            })
            .catch(() => toast.error('Gagal memuat analitik.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <>
                <PageHeader title="Analitik" subtitle="Analisis akun, perilaku pengguna, dan kunjungan." />
                <StatCardsSkeleton count={4} colsClass="sm:grid-cols-2 lg:grid-cols-4" />
                <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <ChartSkeleton tall />
                    <ChartSkeleton tall />
                </div>
            </>
        );
    }

    const consents = overview?.consents || {};
    const diffToday = overview && overview.views_yesterday > 0
        ? Math.round(((overview.views_today - overview.views_yesterday) / overview.views_yesterday) * 100)
        : 0;

    const tabs = [
        { key: 'visits', label: 'Kunjungan', icon: 'trending-up' },
        { key: 'accounts', label: 'Akun', icon: 'users' },
        { key: 'behavior', label: 'Perilaku', icon: 'activity' },
    ];

    return (
        <>
            <PageHeader
                title="Analitik"
                subtitle="Analisis akun pengguna, perilaku, dan kunjungan situs."
                action={
                    <button
                        type="button"
                        onClick={() => {
                            api.post('/analytics/rollup').then(() => window.location.reload());
                        }}
                        className="btn btn-secondary"
                    >
                        <Icon name="refresh" size={16} /> Rollup
                    </button>
                }
            />

            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard 
                    icon="eye" 
                    label="Page Views (Hari Ini)" 
                    value={fmt(overview?.views_today)} 
                    trend={{ up: diffToday >= 0, text: `${Math.abs(diffToday)}%` }} 
                    color="bg-brand-600/15 text-brand-600 dark:text-brand-400" 
                />
                <StatCard 
                    icon="users" 
                    label={`Unique Visitors (${fmt(overview?.visitors_total)} total)`} 
                    value={fmt(overview?.visitors_today)} 
                    color="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" 
                />
                <StatCard 
                    icon="user-check" 
                    label={`Pengguna Aktif (${fmt(overview?.total_users)} total)`} 
                    value={fmt(overview?.active_users)} 
                    color="bg-amber-500/15 text-amber-600 dark:text-amber-400" 
                />
                <StatCard 
                    icon="check-square" 
                    label="Penerimaan Cookie" 
                    value={`${consents.acceptance_rate ?? 0}%`} 
                    color="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" 
                />
            </div>

            <TrendChart data={overview?.trend || []} />

            <div className="mb-6 mt-6 flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1.5">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setTab(t.key)}
                        className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                            tab === t.key ? 'bg-brand-600 text-white shadow' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                        }`}
                    >
                        <Icon name={t.icon} size={16} />
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'visits' && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <ShareBar items={visits?.top_pages || []} valueKey="views" labelKey="path" />
                    <RankedList title="Referrer" icon="globe" items={(visits?.referrers || []).map((r) => ({ ...r, name: r.referrer }))} valueKey="views" />
                    <DeviceList items={visits?.devices || []} />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <RankedList title="Browser" icon="globe" items={(visits?.browsers || []).map((b) => ({ ...b, name: b.browser }))} />
                        <RankedList title="Sistem Operasi" icon="laptop" items={(visits?.os || []).map((o) => ({ ...o, name: o.os }))} />
                    </div>
                </div>
            )}

            {tab === 'accounts' && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="card overflow-hidden">
                        <div className="flex items-center gap-2 border-b border-line px-5 py-4">
                            <Icon name="users" size={16} className="text-ink-muted" />
                            <h3 className="font-bold text-ink">Distribusi Role</h3>
                        </div>
                        <div className="divide-y divide-line">
                            {(accounts?.role_distribution || []).map((r, i) => (
                                <div key={i} className="flex items-center justify-between px-5 py-2.5">
                                    <span className="text-sm capitalize text-ink">{r.role}</span>
                                    <span className="text-sm font-semibold text-ink-muted">{fmt(r.total)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="card overflow-hidden">
                        <div className="flex items-center gap-2 border-b border-line px-5 py-4">
                            <Icon name="lock" size={16} className="text-ink-muted" />
                            <h3 className="font-bold text-ink">Metode Login</h3>
                        </div>
                        <div className="divide-y divide-line">
                            {(accounts?.login_methods || []).map((m, i) => (
                                <div key={i} className="flex items-center justify-between px-5 py-2.5">
                                    <span className="text-sm capitalize text-ink">{m.method}</span>
                                    <span className="text-sm font-semibold text-ink-muted">{fmt(m.total)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="card overflow-hidden">
                        <div className="flex items-center gap-2 border-b border-line px-5 py-4">
                            <Icon name="user-check" size={16} className="text-ink-muted" />
                            <h3 className="font-bold text-ink">Pengguna Aktif</h3>
                        </div>
                        <div className="grid grid-cols-3 divide-x divide-line">
                            {[
                                { label: 'Hari Ini', value: accounts?.active?.today },
                                { label: '7 Hari', value: accounts?.active?.week },
                                { label: '30 Hari', value: accounts?.active?.month },
                            ].map((s, i) => (
                                <div key={i} className="px-5 py-4 text-center">
                                    <p className="text-xl font-bold text-ink">{fmt(s.value)}</p>
                                    <p className="mt-1 text-xs text-ink-muted">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="card overflow-hidden">
                        <div className="flex items-center gap-2 border-b border-line px-5 py-4">
                            <Icon name="calendar" size={16} className="text-ink-muted" />
                            <h3 className="font-bold text-ink">Registrasi 6 Bulan</h3>
                        </div>
                        <div className="flex items-end gap-2 p-5">
                            {(accounts?.registrations || []).map((r, i) => {
                                const max = Math.max(1, ...(accounts?.registrations || []).map((x) => x.total));
                                return (
                                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                                        <span className="text-xs font-semibold text-ink">{r.total || ''}</span>
                                        <div className="w-full rounded-t-md bg-brand-500" style={{ height: `${Math.max(4, (r.total / max) * 80)}px` }} />
                                        <span className="text-[10px] text-ink-muted">{r.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {tab === 'behavior' && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="card overflow-hidden">
                        <div className="flex items-center gap-2 border-b border-line px-5 py-4">
                            <Icon name="clock" size={16} className="text-ink-muted" />
                            <h3 className="font-bold text-ink">Aktivitas per Jam (Kunjungan)</h3>
                        </div>
                        <div className="flex items-end gap-1 p-5">
                            {(behavior?.hourly_activity || []).map((h, i) => {
                                const max = Math.max(1, ...(behavior?.hourly_activity || []).map((x) => x.total));
                                return (
                                    <div key={i} className="group relative flex flex-1 flex-col items-center">
                                        <div className="w-full rounded-t bg-emerald-500/80 transition-colors hover:bg-emerald-500" style={{ height: `${Math.max(3, (h.total / max) * 110)}px` }}>
                                            <title>{`${h.label}: ${fmt(h.total)}`}</title>
                                        </div>
                                        <span className="mt-1 hidden text-[9px] text-ink-muted sm:block">{h.hour % 6 === 0 ? h.label : ''}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <RankedList title="Aksi Klien Teratas" icon="activity" items={(behavior?.top_actions || []).map((a) => ({ ...a, name: a.action }))} />
                    <RankedList title="Aksi Admin Teratas" icon="shield" items={(behavior?.top_audit_actions || []).map((a) => ({ ...a, name: a.action }))} />
                    <RankedList title="Pengguna Paling Aktif" icon="users" items={(behavior?.top_active_users || []).map((u) => ({ ...u, name: u.name }))} valueKey="total" />
                </div>
            )}
        </>
    );
}