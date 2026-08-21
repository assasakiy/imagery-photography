import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { Spinner, EmptyState } from './ui';
import { toast } from '../lib/toast';

const SOCIAL_LINKS = [
    { key: 'social_facebook', slug: 'facebook', label: 'Facebook' },
    { key: 'social_instagram', slug: 'instagram', label: 'Instagram' },
    { key: 'social_tiktok', slug: 'tiktok', label: 'TikTok' },
    { key: 'social_whatsapp', slug: 'whatsapp', label: 'WhatsApp' },
];

const STATUS_META = {
    active: { label: 'Aktif', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    pending: { label: 'Menunggu Aktivasi', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
    disabled: { label: 'Nonaktif', cls: 'bg-zinc-500/15 text-ink-muted' },
};

export default function UserDetailModal({ open, onClose, data, loading, onIssueToken, issuing, showProjects = true }) {
    const navigate = useNavigate();

    if (!open) return null;

    const isNew = !data || data.status !== 'active' || !data.has_password;
    const purpose = isNew ? 'invite' : 'recovery';
    const statusMeta = STATUS_META[data?.status] || STATUS_META.pending;

    const siteName = window.APP_CONFIG?.siteName || 'Sopian Lalu Imagery';
    const loginUrl = `${window.location.origin}/login`;

    const copy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success('Disalin ke clipboard.');
        } catch {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            toast.success('Disalin ke clipboard.');
        }
    };

    const buildInviteMessage = (url) =>
        [
            `Halo ${data?.name || ''},`,
            '',
            `Akun Anda di ${siteName} telah dibuat. Silakan masuk lalu aktifkan akun dan buat kata sandi melalui tautan berikut:`,
            '',
            `Login: ${loginUrl}`,
            `Username: ${data?.username || '-'}`,
            `Email/WhatsApp: ${data?.email || data?.phone || '-'}`,
            '',
            `Link aktivasi: ${url}`,
        ].join('\n');

    const buildRecoveryMessage = (url) =>
        [
            `Halo ${data?.name || ''},`,
            '',
            `Berikut tautan untuk mengatur ulang kata sandi akun Anda di ${siteName}:`,
            '',
            `Login: ${loginUrl}`,
            `Username: ${data?.username || '-'}`,
            `Email/WhatsApp: ${data?.email || data?.phone || '-'}`,
            '',
            `Link reset kata sandi: ${url}`,
        ].join('\n');

    const handleSend = () => onIssueToken?.(purpose, true);

    const handleCopy = async () => {
        try {
            const issued = await onIssueToken?.(purpose, false);
            const url = issued?.url;
            if (!url) {
                toast.error('Gagal menyiapkan tautan.');
                return;
            }
            await copy(isNew ? buildInviteMessage(url) : buildRecoveryMessage(url));
        } catch {
            toast.error('Gagal menyiapkan tautan.');
        }
    };

    const openProject = (id) => {
        onClose?.();
        navigate(`/dashboard/projects/${id}`);
    };

    const initials = (data?.name || '?').trim().charAt(0).toUpperCase();

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
                    <div className="flex shrink-0 items-center justify-between px-6 py-4">
                        <h2 className="text-lg font-bold text-ink">Detail User</h2>
                        <button onClick={onClose} className="rounded-lg p-1 text-ink-muted hover:bg-surface-muted" aria-label="Tutup">
                            <Icon name="x" size={20} />
                        </button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-6">
                        {loading ? (
                            <Spinner />
                        ) : data ? (
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-500/15 ring-2 ring-line">
                                        {data.avatar ? (
                                            <img src={data.avatar} alt={data.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-xl font-bold text-brand-600 dark:text-brand-400">{initials}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="truncate text-lg font-bold text-ink">{data.name}</p>
                                            <span className={`badge ${statusMeta.cls}`}>{statusMeta.label}</span>
                                        </div>
                                        {data.username && <p className="text-sm text-ink-muted">@{data.username}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl bg-surface-muted p-3">
                                        <p className="text-xs text-ink-muted">Email</p>
                                        <p className="truncate text-sm font-semibold text-ink">{data.email || '-'}</p>
                                    </div>
                                    <div className="rounded-xl bg-surface-muted p-3">
                                        <p className="text-xs text-ink-muted">Telepon / WhatsApp</p>
                                        <p className="text-sm font-semibold text-ink">{data.phone || '-'}</p>
                                    </div>
                                    <div className="rounded-xl bg-surface-muted p-3">
                                        <p className="text-xs text-ink-muted">Pekerjaan</p>
                                        <p className="truncate text-sm font-semibold text-ink">{data.occupation || '-'}</p>
                                    </div>
                                    <div className="rounded-xl bg-surface-muted p-3">
                                        <p className="text-xs text-ink-muted">Perusahaan</p>
                                        <p className="truncate text-sm font-semibold text-ink">{data.company || '-'}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">Bio</p>
                                    <p className="rounded-xl bg-surface-muted p-3 text-sm text-ink">{data.bio || '-'}</p>
                                </div>

                                <div>
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">Media Sosial</p>
                                    {SOCIAL_LINKS.some((s) => data[s.key]) ? (
                                        <div className="flex flex-wrap gap-2">
                                            {SOCIAL_LINKS.filter((s) => data[s.key]).map((s) => (
                                                <a
                                                    key={s.key}
                                                    href={data[s.key]}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-brand-500/15 hover:text-brand-600"
                                                >
                                                    <Icon name={s.slug} size={15} /> {s.label}
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-ink-muted">Belum ada media sosial.</p>
                                    )}
                                </div>

                                <div className="border-t border-line pt-5">
                                    <label className="label">Kirim Tautan</label>
                                    <p className="mb-3 text-xs text-ink-muted">
                                        {isNew
                                            ? 'Akun belum aktif — kirim undangan aktivasi (buat kata sandi).'
                                            : 'Akun sudah aktif — kirim tautan untuk mengatur ulang kata sandi.'}
                                        {' Prioritas pengiriman WhatsApp → Email. Salin untuk mengirim manual.'}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <button className="btn-primary" disabled={issuing === purpose} onClick={handleSend}>
                                            <Icon name="send" size={16} /> {issuing === purpose ? 'Mengirim...' : isNew ? 'Kirim Undangan' : 'Kirim Recovery'}
                                        </button>
                                        <button className="btn-outline" disabled={issuing === purpose} onClick={handleCopy}>
                                            <Icon name="copy" size={16} /> Salin {isNew ? 'Undangan' : 'Recovery'}
                                        </button>
                                    </div>
                                </div>

                                {showProjects && (
                                    <div className="border-t border-line pt-5">
                                        <label className="label">Proyek Terkait</label>
                                        {data.projects?.length ? (
                                            <div className="space-y-2">
                                                {data.projects.map((p) => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => openProject(p.id)}
                                                        className="flex w-full items-center justify-between gap-2 rounded-xl bg-surface-muted px-3 py-2 text-left transition-colors hover:bg-brand-500/15"
                                                    >
                                                        <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink">
                                                            <Icon name="briefcase" size={15} className="shrink-0 text-ink-muted" />
                                                            <span className="truncate">{p.name}</span>
                                                        </span>
                                                        <span className="flex shrink-0 items-center gap-2">
                                                            {p.status && <span className="badge">{p.status}</span>}
                                                            <Icon name="chevrons" size={14} className="text-ink-muted" />
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-ink-muted">Tidak ada proyek terkait.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <EmptyState title="Tidak ada data" />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
