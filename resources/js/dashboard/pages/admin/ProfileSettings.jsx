import { useEffect, useState } from 'react';
import api from '../../api';
import Icon from '../../components/Icon';
import Avatar from '../../components/Avatar';
import MediaPicker from '../../components/MediaPicker';
import { PageHeader, Field, Modal, ButtonSpinner } from '../../components/ui';
import Skeleton from '../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';
import SocialSelect from './landing/sections/SocialSelect';
import { SOCIAL_PLATFORMS, SocialLogo } from './landing/sections/socialPlatforms';
import { toast } from '../../lib/toast';
import { getApiErrorMessage } from '../../lib/errors';

const ROLE_LABEL = { owner: 'Pemilik', admin: 'Dashboard Admin', client: 'Portal Klien' };

const TABS = [
    { key: 'profile', label: 'Profil', icon: 'user' },
    { key: 'social', label: 'Media Sosial', icon: 'link' },
    { key: 'password', label: 'Kata Sandi', icon: 'lock' },
    { key: 'prefs', label: 'Preferensi', icon: 'bell' },
];

function Toggle({ checked, onChange, label, desc }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div>
                <p className="text-sm font-semibold text-ink">{label}</p>
                {desc && <p className="mt-0.5 text-xs text-ink-muted">{desc}</p>}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    checked ? 'bg-brand-600' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
            >
                <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        checked ? 'translate-x-5' : ''
                    }`}
                />
            </button>
        </div>
    );
}

export default function ProfileSettings() {
    const { user, refresh } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tab, setTab] = useState('profile');
    const [errors, setErrors] = useState({});
    const [baseline, setBaseline] = useState(null);

    const [profile, setProfile] = useState({ name: '', email: '', phone: '', bio: '' });
    const [socials, setSocials] = useState([]);
    const [prefs, setPrefs] = useState({ notif_inapp: true, notif_email: true, notif_whatsapp: true });
    const [notifEvents, setNotifEvents] = useState({ email: [], whatsapp: [] });
    const [otpChannel, setOtpChannel] = useState('');
    const [notifMeta, setNotifMeta] = useState({});
    const [pass, setPass] = useState({ current_password: '', password: '', password_confirmation: '' });
    const [deletePass, setDeletePass] = useState('');

    const [avatarUrl, setAvatarUrl] = useState(null);
    const [avatarValue, setAvatarValue] = useState(undefined);
    const [coverUrl, setCoverUrl] = useState(null);
    const [pendingCover, setPendingCover] = useState(null);
    const [coverViewOpen, setCoverViewOpen] = useState(false);
    const [coverRemoveOpen, setCoverRemoveOpen] = useState(false);
    const [mediaTarget, setMediaTarget] = useState(null);
    const [pendingAvatar, setPendingAvatar] = useState(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [removeOpen, setRemoveOpen] = useState(false);
    const [mediaOpen, setMediaOpen] = useState(false);
    const [newOpen, setNewOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null });

    useEffect(() => {
        const raw = (profile.username || '').trim();
        if (!raw || raw === (user?.username || '')) {
            setUsernameStatus({ checking: false, available: null });
            return;
        }
        if (!/^[a-z0-9_]{3,40}$/.test(raw) || /^\d+$/.test(raw)) {
            setUsernameStatus({ checking: false, available: false });
            return;
        }
        setUsernameStatus({ checking: true, available: null });
        const t = setTimeout(async () => {
            try {
                const { data } = await api.get('/username-check', { params: { username: raw } });
                setUsernameStatus({ checking: false, available: data.available });
            } catch {
                setUsernameStatus({ checking: false, available: null });
            }
        }, 400);
        return () => clearTimeout(t);
    }, [profile.username]);

    useEffect(() => {
        api.get('/profile')
            .then(({ data }) => {
                const u = data.user;
                const profileLoaded = { full_name: u.name, username: u.username || '', email: u.email, phone: u.phone || '', bio: u.bio || '', company: u.company || '', occupation: u.occupation || '', website: u.website || '' };
                const socialList = Array.isArray(u.socials) && u.socials.length > 0
                    ? u.socials.map((s) => ({ slug: s.slug, url: s.url || '' }))
                    : [
                        { slug: 'instagram', url: u.social_instagram || '' },
                        { slug: 'facebook', url: u.social_facebook || '' },
                        { slug: 'tiktok', url: u.social_tiktok || '' },
                        { slug: 'whatsapp', url: u.social_whatsapp || '' },
                    ].filter((s) => s.url);
                const prefsLoaded = { notif_inapp: u.notif_inapp !== false, notif_email: u.notif_email !== false, notif_whatsapp: u.notif_whatsapp !== false };
                const eventsLoaded = Array.isArray(u.notif_events) || !u.notif_events || typeof u.notif_events !== 'object'
                    ? { email: [], whatsapp: [] }
                    : { email: u.notif_events.email || [], whatsapp: u.notif_events.whatsapp || [] };
                const otpLoaded = u.notif_otp_channel || '';
                setProfile(profileLoaded);
                setSocials(socialList);
                setPrefs(prefsLoaded);
                setNotifEvents(eventsLoaded);
                setOtpChannel(otpLoaded);
                setNotifMeta(u.notif || {});
                setAvatarUrl(u.avatar || null);
                setCoverUrl(u.cover || null);
                setBaseline({
                    profile: profileLoaded,
                    socials: socialList.map((s) => ({ slug: s.slug, url: s.url || '' })),
                    prefs: prefsLoaded,
                    notifEvents: { email: eventsLoaded.email.slice(), whatsapp: eventsLoaded.whatsapp.slice() },
                    otpChannel: otpLoaded,
                });
            })
            .catch(() => toast.error('Gagal memuat profil.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Skeleton variant="form" />;

    const save = async (payload, successMsg) => {
        setSaving(true);
        setErrors({});
        try {
            await api.put('/profile', payload);
            await refresh();
            toast.success(successMsg);
            return true;
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
            else toast.error('Gagal menyimpan.');
            return false;
        } finally {
            setSaving(false);
        }
    };

    const sameSocials = (a, b) => {
        const norm = (l) => (l || []).filter((s) => s.url).map((s) => `${s.slug}:${s.url}`).sort().join('|');
        return norm(a) === norm(b);
    };

    const saveProfile = async (e) => {
        e.preventDefault();
        const username = (profile.username || '').trim().toLowerCase();
        if (!username || usernameStatus.checking || usernameStatus.available === false) return;
        const payload = { ...profile, username };
        if (avatarValue !== undefined) payload.avatar = avatarValue;
        const ok = await save(payload, 'Profil diperbarui.');
        if (ok) {
            setAvatarValue(undefined);
            setBaseline((b) => ({ ...b, profile: { ...profile } }));
        }
    };

    const saveSocials = async (e) => {
        e.preventDefault();
        const ok = await save({ socials }, 'Media sosial diperbarui.');
        if (ok) setBaseline((b) => ({ ...b, socials: socials.map((s) => ({ slug: s.slug, url: s.url || '' })) }));
    };

    const savePassword = async (e) => {
        e.preventDefault();
        if (pass.password !== pass.password_confirmation) {
            setErrors({ password_confirmation: ['Konfirmasi kata sandi tidak cocok.'] });
            return;
        }
        const ok = await save({ current_password: pass.current_password, password: pass.password }, 'Kata sandi diubah.');
        if (ok) setPass({ current_password: '', password: '', password_confirmation: '' });
    };

    const savePrefs = async () => {
        const events = { email: [], whatsapp: [] };
        for (const ch of ['email', 'whatsapp']) {
            events[ch] = (notifEvents[ch] || []).slice();
            (notifMeta.events?.[ch] || [])
                .filter((e) => e.mandatory)
                .forEach((e) => {
                    if (!events[ch].includes(e.key)) events[ch].push(e.key);
                });
        }
        const payload = {
            ...prefs,
            notif_events: events,
        };
        if (otpChannel) payload.notif_otp_channel = otpChannel;
        const ok = await save(payload, 'Preferensi notifikasi diperbarui.');
        if (ok) {
            setBaseline((b) => ({
                ...b,
                prefs: { ...prefs },
                notifEvents: { email: (notifEvents.email || []).slice(), whatsapp: (notifEvents.whatsapp || []).slice() },
                otpChannel,
            }));
            const { data } = await api.get('/profile');
            setNotifMeta(data.user.notif || {});
        }
    };

    const toggleEvent = (channel, key) => {
        const list = notifEvents[channel] || [];
        setNotifEvents({ ...notifEvents, [channel]: list.includes(key) ? list.filter((k) => k !== key) : [...list, key] });
    };

    const onMediaPick = (sel) => {
        const raw = sel.source === 'url' ? sel.url.trim() : `media:${sel.mediaId}`;
        if (mediaTarget === 'cover') {
            setPendingCover({ value: raw, url: sel.url });
            return;
        }
        setPendingAvatar({ value: raw, url: sel.thumbnail_url || sel.url });
    };

    const confirmCover = async () => {
        if (!pendingCover) return;
        setSaving(true);
        try {
            await api.put('/profile', { cover: pendingCover.value });
            setCoverUrl(pendingCover.url);
            setPendingCover(null);
            await refresh();
            toast.success('Banner diperbarui.');
        } catch (e) {
            toast.error(getApiErrorMessage(e, 'Gagal menyimpan banner.'));
        } finally {
            setSaving(false);
        }
    };

    const cancelCover = () => {
        setPendingCover(null);
    };

    const removeCover = async () => {
        setSaving(true);
        try {
            await api.put('/profile', { cover: '' });
            setCoverUrl(null);
            setPendingCover(null);
            setCoverRemoveOpen(false);
            await refresh();
            toast.success('Banner dihapus.');
        } catch (e) {
            toast.error(getApiErrorMessage(e, 'Gagal menghapus banner.'));
        } finally {
            setSaving(false);
        }
    };

    const openCoverView = () => {
        setCoverViewOpen(true);
    };

    const confirmAvatar = async () => {
        if (!pendingAvatar) return;
        setSaving(true);
        try {
            await api.put('/profile', { avatar: pendingAvatar.value });
            setAvatarValue(pendingAvatar.value);
            setAvatarUrl(pendingAvatar.url);
            setPendingAvatar(null);
            await refresh();
            toast.success('Foto profil diperbarui.');
        } catch (e) {
            toast.error(getApiErrorMessage(e, 'Gagal menyimpan foto profil.'));
        } finally {
            setSaving(false);
        }
    };

    const cancelAvatar = () => {
        setPendingAvatar(null);
    };

    const removeAvatar = async () => {
        setSaving(true);
        try {
            await api.put('/profile', { avatar: '' });
            setAvatarValue('');
            setAvatarUrl(null);
            setPendingAvatar(null);
            setRemoveOpen(false);
            await refresh();
            toast.success('Foto profil dihapus.');
        } catch (e) {
            toast.error(getApiErrorMessage(e, 'Gagal menghapus foto profil.'));
        } finally {
            setSaving(false);
        }
    };

    const deleteAccount = async (e) => {
        e.preventDefault();
        setDeleting(true);
        setErrors({});
        try {
            await api.delete('/profile', { data: { password: deletePass } });
            toast.success('Akun dihapus. Mengarahkan ke halaman masuk…');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1200);
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
            else toast.error('Gagal menghapus akun.');
            setDeleting(false);
        }
    };

    const isOwner = user?.role === 'owner';
    const initials = (profile.full_name || '?').charAt(0).toUpperCase();
    const emailActive = !!notifMeta.email_configured && notifMeta.email_enabled !== false;
    const waActive = !!notifMeta.whatsapp_configured && notifMeta.whatsapp_enabled !== false;

    const profileDirty = !!baseline && (JSON.stringify(profile) !== JSON.stringify(baseline.profile) || avatarValue !== undefined);
    const socialsDirty = !!baseline && !sameSocials(socials, baseline.socials);
    const passDirty = !!pass.current_password && !!pass.password && pass.password === pass.password_confirmation;
    const prefsDirty = !!baseline && (
        JSON.stringify(prefs) !== JSON.stringify(baseline.prefs) ||
        JSON.stringify(notifEvents) !== JSON.stringify(baseline.notifEvents) ||
        otpChannel !== baseline.otpChannel
    );

    return (
        <>
            <PageHeader title="Profil Saya" subtitle="Kelola profil, media sosial, kata sandi, preferensi notifikasi, dan keamanan akun Anda." />

            {/* Hero */}
            <div className="card overflow-hidden">
                <button
                    type="button"
                    onClick={openCoverView}
                    className="group relative block h-32 w-full overflow-hidden sm:h-40"
                    aria-label="Lihat banner profil"
                >
                    {coverUrl ? (
                        <img src={coverUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full bg-gradient-to-r from-brand-700 via-brand-500 to-brand-400" />
                    )}
                    <span className="absolute inset-0 hidden bg-black/40 transition-opacity lg:flex lg:items-center lg:justify-center lg:opacity-0 lg:group-hover:opacity-100">
                        <span className="flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-sm font-semibold text-white">
                            <Icon name="camera" size={16} /> Ubah Banner
                        </span>
                    </span>
                    <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white shadow-lg backdrop-blur lg:hidden">
                        <Icon name="camera" size={18} />
                    </span>
                </button>
                <div className="px-5 pb-6 sm:px-8">
                    <div className="-mt-12 flex items-end justify-between sm:-mt-14">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setViewOpen(true)}
                                className="group relative"
                                aria-label="Lihat foto profil"
                            >
                                <Avatar src={avatarUrl} name={profile.full_name} size="2xl" shape="full" className="ring-4 ring-surface" />
                                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 rounded-full">
                                    <Icon name="camera" size={22} />
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-bold text-ink sm:text-2xl">{profile.full_name || '…'}</h2>
                            <span className="badge bg-brand-600/10 text-brand-600 dark:text-brand-400">{ROLE_LABEL[user?.role] || 'Pengguna'}</span>
                        </div>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                            <span className="inline-flex items-center gap-1.5">
                                <Icon name="mail" size={14} /> {profile.email}
                            </span>
                            {profile.phone && (
                                <span className="inline-flex items-center gap-1.5">
                                    <Icon name="phone" size={14} /> {profile.phone}
                                </span>
                            )}
                        </p>
                        {profile.bio && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink">{profile.bio}</p>}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mt-6 flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setTab(t.key)}
                        className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                            tab === t.key ? 'bg-brand-600 text-white shadow' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                        }`}
                    >
                        <Icon name={t.icon} size={16} /> <span className="hidden sm:inline">{t.label}</span>
                    </button>
                ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Content */}
                {tab === 'profile' && (
                    <form onSubmit={saveProfile} className="card p-5 lg:col-span-2">
                        <h3 className="mb-4 flex items-center gap-2 font-semibold text-ink">
                            <Icon name="user" size={18} /> Informasi Profil
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Nama" required error={errors.full_name?.[0]}>
                                    <input className="input" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} required />
                                </Field>
                                <Field
                                    label="Username"
                                    required
                                    hint={
                                        usernameStatus.checking
                                            ? 'Memeriksa…'
                                            : usernameStatus.available === false
                                                ? 'Username sudah dipakai.'
                                                : 'untuk login'
                                    }
                                    error={errors.username?.[0] || (usernameStatus.available === false && !errors.username?.[0] ? ['Username sudah dipakai.'] : undefined)}
                                >
                                    <div className="relative">
                                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">@</span>
                                        <input
                                            className={`input pl-7 ${usernameStatus.available === false ? '!border-red-500' : usernameStatus.available === true ? '!border-emerald-500' : ''}`}
                                            autoComplete="username"
                                            minLength={3}
                                            maxLength={40}
                                            required
                                            value={profile.username || ''}
                                            onChange={(e) => setProfile({ ...profile, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                                        />
                                        {usernameStatus.available === true && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                                                <Icon name="check" size={16} />
                                            </span>
                                        )}
                                        {usernameStatus.available === false && (
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                                                <Icon name="x" size={16} />
                                            </span>
                                        )}
                                    </div>
                                </Field>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Email" required error={errors.email?.[0]}>
                                    <input className="input" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required />
                                </Field>
                                <Field label="Nomor Ponsel" hint="opsional" error={errors.phone?.[0]}>
                                    <input className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                                </Field>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Perusahaan" hint="opsional" error={errors.company?.[0]}>
                                    <input className="input" value={profile.company || ''} onChange={(e) => setProfile({ ...profile, company: e.target.value })} />
                                </Field>
                                <Field label="Pekerjaan" hint="opsional" error={errors.occupation?.[0]}>
                                    <input className="input" value={profile.occupation || ''} onChange={(e) => setProfile({ ...profile, occupation: e.target.value })} />
                                </Field>
                            </div>
                            <Field label="Website" hint="opsional" error={errors.website?.[0]}>
                                <input className="input" value={profile.website || ''} onChange={(e) => setProfile({ ...profile, website: e.target.value })} />
                            </Field>
                            <Field label="Bio" hint="ceritakan tentang Anda" error={errors.bio?.[0]}>
                                <textarea
                                    className="input min-h-[100px] resize-y"
                                    maxLength={1000}
                                    value={profile.bio}
                                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                    placeholder="Contoh: Fotografer & videografer berbasis di Lombok. Menyukai momen golden hour."
                                />
                            </Field>
                            <div className="flex justify-end pt-2">
                                <button type="submit" className="btn-primary" disabled={saving || !profileDirty || !profile.username?.trim() || usernameStatus.checking || usernameStatus.available === false}>
                                    <Icon name="check" size={16} /> Simpan Profil
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {tab === 'social' && (
                    <form onSubmit={saveSocials} className="card p-5 lg:col-span-2">
                        <h3 className="mb-1 flex items-center gap-2 font-semibold text-ink">
                            <Icon name="link" size={18} /> Media Sosial
                        </h3>
                        <p className="mb-5 text-sm text-ink-muted">Tambahkan akun sosial media Anda yang ingin ditampilkan di profil.</p>

                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-ink">Daftar Sosial Media</p>
                            <button
                                type="button"
                                className="btn-outline text-xs py-1.5 px-3"
                                onClick={() => setSocials([...socials, { slug: 'instagram', url: '' }])}
                            >
                                <Icon name="plus" size={14} /> Tambah
                            </button>
                        </div>

                        {socials.length === 0 ? (
                            <div className="mt-3 rounded-lg border border-dashed border-line p-4 text-center text-sm text-ink-muted">
                                Belum ada sosial media. Klik "Tambah" untuk mulai.
                            </div>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {socials.map((row, i) => (
                                    <div key={i} className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[200px_1fr_auto]">
                                        <SocialSelect value={row.slug || ''} onChange={(slug) => {
                                            const next = socials.slice();
                                            next[i] = { ...next[i], slug };
                                            setSocials(next);
                                        }} />
                                        <input
                                            className="input"
                                            placeholder="https://..."
                                            value={row.url || ''}
                                            onChange={(e) => {
                                                const next = socials.slice();
                                                next[i] = { ...next[i], url: e.target.value };
                                                setSocials(next);
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="btn-outline text-red-500 !px-2.5 !py-2"
                                            onClick={() => setSocials(socials.filter((_, x) => x !== i))}
                                            title="Hapus"
                                        >
                                            <Icon name="trash" size={15} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {socials.length > 0 && socials.some((r) => r.url) && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {socials.filter((r) => r.url).map((r, i) => {
                                    const found = SOCIAL_PLATFORMS.find((p) => p.type === r.slug);
                                    return (
                                        <span key={i} className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-ink-muted">
                                            <SocialLogo type={r.slug} size={14} className="text-ink" /> {found ? found.label : r.slug}
                                        </span>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <button type="submit" className="btn-primary" disabled={saving || !socialsDirty}>
                                <Icon name="check" size={16} /> Simpan Media Sosial
                            </button>
                        </div>
                    </form>
                )}

                {tab === 'password' && (
                    <form onSubmit={savePassword} className="card p-5 lg:col-span-2">
                        <h3 className="mb-4 flex items-center gap-2 font-semibold text-ink">
                            <Icon name="lock" size={18} /> Ubah Kata Sandi
                        </h3>
                        <div className="space-y-4">
                            <Field label="Kata sandi saat ini" required error={errors.current_password?.[0]}>
                                <input className="input" type="password" value={pass.current_password} onChange={(e) => setPass({ ...pass, current_password: e.target.value })} required />
                            </Field>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Field label="Kata sandi baru" required error={errors.password?.[0]}>
                                    <input className="input" type="password" minLength={6} value={pass.password} onChange={(e) => setPass({ ...pass, password: e.target.value })} required />
                                </Field>
                                <Field label="Ulangi kata sandi baru" required error={errors.password_confirmation?.[0]}>
                                    <input
                                        className="input"
                                        type="password"
                                        value={pass.password_confirmation}
                                        onChange={(e) => setPass({ ...pass, password_confirmation: e.target.value })}
                                        required
                                    />
                                </Field>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="submit" className="btn-primary" disabled={saving || !passDirty}>
                                    <Icon name="lock" size={16} /> Ubah Kata Sandi
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {tab === 'prefs' && (
                    <div className="card p-5 lg:col-span-2">
                        <h3 className="mb-1 flex items-center gap-2 font-semibold text-ink">
                            <Icon name="bell" size={18} /> Preferensi Notifikasi
                        </h3>
                        <p className="mb-5 text-sm text-ink-muted">Pilih notifikasi apa saja yang ingin Anda terima. Kanal yang belum dikonfigurasi atau nonaktif tidak ditampilkan.</p>

                        <div className="divide-y divide-line border-b border-line">
                            <div className="py-3">
                                <Toggle
                                    checked={prefs.notif_inapp}
                                    onChange={(v) => setPrefs({ ...prefs, notif_inapp: v })}
                                    label="Notifikasi di dalam aplikasi"
                                    desc="Lonceng notifikasi di dashboard dan header situs."
                                />
                            </div>
                            {emailActive && (
                                <div className="py-3">
                                    <Toggle
                                        checked={prefs.notif_email}
                                        onChange={(v) => setPrefs({ ...prefs, notif_email: v })}
                                        label="Notifikasi via Email"
                                        desc="Undangan, pembaruan status, dan info penting lewat email."
                                    />
                                </div>
                            )}
                            {waActive && (
                                <div className="py-3">
                                    <Toggle
                                        checked={prefs.notif_whatsapp}
                                        onChange={(v) => setPrefs({ ...prefs, notif_whatsapp: v })}
                                        label="Notifikasi via WhatsApp"
                                        desc="Pembaruan status project dan konfirmasi pembayaran lewat WhatsApp."
                                    />
                                </div>
                            )}
                        </div>

                        {!emailActive && !waActive ? (
                            <p className="mt-5 rounded-xl border border-line bg-surface-muted/40 p-4 text-sm text-ink-muted">
                                Kanal notifikasi email dan WhatsApp belum tersedia untuk akun Anda.
                            </p>
                        ) : (
                            ['email', 'whatsapp'].map((channel) => {
                                const isEmail = channel === 'email';
                                const active = isEmail ? emailActive : waActive;

                                if (!active) return null;

                                const events = notifMeta.events?.[channel] || [];
                                const label = isEmail ? 'Email' : 'WhatsApp';
                                const userOn = prefs[isEmail ? 'notif_email' : 'notif_whatsapp'];

                                return (
                                    <div key={channel} className="mt-5">
                                        <p className="mb-1 text-sm font-semibold text-ink">Event via {label}</p>
                                        {!userOn && (
                                            <p className="mb-2 text-xs text-ink-muted">Anda mematikan notifikasi {label} di atas.</p>
                                        )}
                                        <div className="divide-y divide-line rounded-xl border border-line">
                                            {events.map((ev) => {
                                                const on = ev.mandatory || (notifEvents[channel] || []).includes(ev.key);
                                                return (
                                                    <label key={ev.key} className="flex items-center justify-between gap-4 py-3 px-4">
                                                        <div>
                                                            <p className="text-sm font-medium text-ink">{ev.label}</p>
                                                            <p className="font-mono text-xs text-ink-muted">{ev.key}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {ev.mandatory && (
                                                                <span className="badge bg-brand-600/10 text-brand-600 dark:text-brand-400">Wajib</span>
                                                            )}
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 rounded border-line text-brand-600"
                                                                checked={on}
                                                                disabled={ev.mandatory || !userOn}
                                                                onChange={() => toggleEvent(channel, ev.key)}
                                                            />
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {emailActive && waActive && (
                            <div className="mt-5">
                                <Field label="Kanal untuk kode OTP login" hint="OTP login akan dikirim ke kanal ini.">
                                    <select className="input" value={otpChannel} onChange={(e) => setOtpChannel(e.target.value)}>
                                        <option value="whatsapp">WhatsApp</option>
                                        <option value="email">Email</option>
                                    </select>
                                </Field>
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <button type="button" className="btn-primary" disabled={saving || !prefsDirty} onClick={savePrefs}>
                                <Icon name="check" size={16} /> Simpan Preferensi
                            </button>
                        </div>
                    </div>
                )}

                {/* Side summary */}
                <div className="space-y-6">
                    <div className="card p-5">
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">Ringkasan Akun</h3>
                        <div className="space-y-2.5 text-sm">
                            <div className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-2 text-ink-muted">
                                    <Icon name="user" size={15} /> Peran
                                </span>
                                <span className="font-medium text-ink">{ROLE_LABEL[user?.role] || 'Pengguna'}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-2 text-ink-muted">
                                    <Icon name="check" size={15} /> Status
                                </span>
                                <span className="badge bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Aktif</span>
                            </div>
                        </div>
                    </div>

                    <div className="card border-red-500/30 p-5">
                        <h3 className="mb-2 flex items-center gap-2 font-semibold text-red-500">
                            <Icon name="alert-triangle" size={18} /> Zona Berbahaya
                        </h3>
                        <p className="text-sm text-ink-muted">
                            {isOwner
                                ? 'Akun pemilik tidak dapat dihapus dari sini.'
                                : 'Menghapus akun akan menghapus seluruh data Anda secara permanen dan tidak dapat dipulihkan.'}
                        </p>
                        {!isOwner && (
                            <button type="button" className="btn mt-4 w-full bg-red-600 text-white hover:bg-red-700" onClick={() => setDeleteOpen(true)}>
                                <Icon name="trash" size={16} /> Hapus Akun
                            </button>
                        )}
                    </div>
                 </div>
             </div>

             <Modal
                 open={viewOpen}
                onClose={() => setViewOpen(false)}
                title={pendingAvatar ? 'Pratinjau Foto Baru' : 'Lihat Foto Profil'}
                footer={
                    pendingAvatar ? (
                        <div className="flex flex-col gap-2">
                            <p className="text-center text-xs text-ink-muted">Simpan foto baru ini sebagai foto profil Anda?</p>
                            <div className="flex gap-2">
                                <button type="button" className="btn-outline flex-1" onClick={cancelAvatar} disabled={saving}>
                                    Batal
                                </button>
                                <button type="button" className="btn-primary flex-1" onClick={confirmAvatar} disabled={saving}>
                                    {saving && <ButtonSpinner />} Konfirmasi
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-end gap-2">
                            <button type="button" className="btn-outline" onClick={() => { setMediaTarget('avatar'); setMediaOpen(true); }}>
                                <Icon name="edit" size={16} /> Ubah
                            </button>
                            {avatarUrl && (
                                <button type="button" className="btn bg-red-600 text-white hover:bg-red-700" onClick={() => setRemoveOpen(true)}>
                                    <Icon name="trash" size={16} /> Hapus
                                </button>
                            )}
                        </div>
                    )
                }
            >
                <div className="flex flex-col items-center gap-4 py-2">
                    <Avatar 
                        src={pendingAvatar ? pendingAvatar.url : avatarUrl} 
                        name={profile.full_name} 
                        size="2xl" 
                        shape="full" 
                        className="!h-40 !w-40 ring-4 ring-line" 
                    />
                    <div className="text-center">
                        <p className="text-lg font-semibold text-ink">{profile.full_name || '…'}</p>
                        <p className="text-sm text-ink-muted">{profile.email || ''}</p>
                        {profile.bio && <p className="mt-3 max-w-xs text-sm text-ink-muted">{profile.bio}</p>}
                    </div>
                </div>
            </Modal>

            <Modal
                open={removeOpen}
                onClose={() => setRemoveOpen(false)}
                title="Hapus Foto Profil"
                footer={
                    <div className="flex justify-end gap-2">
                        <button type="button" className="btn-outline" onClick={() => setRemoveOpen(false)} disabled={saving}>
                            Batal
                        </button>
                        <button
                            type="button"
                            className="btn bg-red-600 text-white hover:bg-red-700"
                            onClick={removeAvatar}
                            disabled={saving}
                        >
                            <Icon name="trash" size={16} /> {saving ? 'Menghapus…' : 'Hapus'}
                        </button>
                    </div>
                }
            >
                <p className="text-sm text-ink-muted">Hapus foto profil Anda? Tindakan ini hanya menghapus foto profil, bukan akun.</p>
            </Modal>

            <Modal
                open={coverViewOpen}
                onClose={() => setCoverViewOpen(false)}
                title={pendingCover ? 'Pratinjau Banner Baru' : 'Lihat Banner Profil'}
                footer={
                    pendingCover ? (
                        <div className="flex flex-col gap-2">
                            <p className="text-center text-xs text-ink-muted">Simpan banner baru ini?</p>
                            <div className="flex gap-2">
                                <button type="button" className="btn-outline flex-1" onClick={cancelCover} disabled={saving}>
                                    Batal
                                </button>
                                <button type="button" className="btn-primary flex-1" onClick={confirmCover} disabled={saving}>
                                    {saving && <ButtonSpinner />} Konfirmasi
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-end gap-2">
                            <button type="button" className="btn-outline" onClick={() => { setMediaTarget('cover'); setMediaOpen(true); }}>
                                <Icon name="edit" size={16} /> Ubah
                            </button>
                            {coverUrl && (
                                <button type="button" className="btn bg-red-600 text-white hover:bg-red-700" onClick={() => setCoverRemoveOpen(true)}>
                                    <Icon name="trash" size={16} /> Hapus
                                </button>
                            )}
                        </div>
                    )
                }
            >
                <div className="flex flex-col items-center gap-4 py-2">
                    <div className="h-40 w-full overflow-hidden rounded-2xl bg-surface-muted ring-1 ring-line sm:h-48">
                        {pendingCover ? (
                            <img src={pendingCover.url} alt="Pratinjau banner" className="h-full w-full object-cover" />
                        ) : coverUrl ? (
                            <img src={coverUrl} alt="Banner profil" className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-r from-brand-700 via-brand-500 to-brand-400" />
                        )}
                    </div>
                    <p className="text-sm text-ink-muted">
                        {pendingCover ? 'Simpan banner baru ini?' : 'Banner ini ditampilkan di bagian atas profil Anda.'}
                    </p>
                </div>
            </Modal>

            <Modal
                open={coverRemoveOpen}
                onClose={() => setCoverRemoveOpen(false)}
                title="Hapus Banner Profil"
                footer={
                    <div className="flex justify-end gap-2">
                        <button type="button" className="btn-outline" onClick={() => setCoverRemoveOpen(false)} disabled={saving}>
                            Batal
                        </button>
                        <button
                            type="button"
                            className="btn bg-red-600 text-white hover:bg-red-700"
                            onClick={removeCover}
                            disabled={saving}
                        >
                            <Icon name="trash" size={16} /> {saving ? 'Menghapus…' : 'Hapus'}
                        </button>
                    </div>
                }
            >
                <p className="text-sm text-ink-muted">Hapus banner profil Anda? Tindakan ini hanya menghapus banner, bukan akun.</p>
            </Modal>

            <Modal
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                title="Hapus Akun"
                footer={
                    <div className="flex justify-end gap-2">
                        <button type="button" className="btn-outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                            Batal
                        </button>
                        <button type="submit" form="delete-account-form" className="btn bg-red-600 text-white hover:bg-red-700" disabled={deleting}>
                            <Icon name="trash" size={16} /> {deleting ? 'Menghapus…' : 'Hapus Akun'}
                        </button>
                    </div>
                }
            >
                <form id="delete-account-form" onSubmit={deleteAccount}>
                    <p className="text-sm text-ink-muted">
                        Tindakan ini akan menonaktifkan akun. Setelah masa jeda (grace period) berakhir, seluruh data akan dihapus permanen. Masukkan kata sandi Anda untuk mengonfirmasi.
                    </p>
                    <div className="mt-4">
                        <Field label="Kata sandi" required error={errors.password?.[0]}>
                            <input className="input" type="password" value={deletePass} onChange={(e) => setDeletePass(e.target.value)} required />
                        </Field>
                    </div>
                </form>
            </Modal>

            <MediaPicker open={mediaOpen} onClose={() => setMediaOpen(false)} onSelect={onMediaPick} title="Pilih Foto Profil" />
        </>
    );
}
