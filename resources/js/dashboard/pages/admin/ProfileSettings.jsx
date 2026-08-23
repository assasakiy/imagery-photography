import { useEffect, useState, useRef } from 'react';
import api from '../../api';
import Icon from '../../components/Icon';
import Avatar from '../../components/Avatar';
import MediaPicker from '../../components/MediaPicker';
import { PageHeader } from '../../components/ui';
import { ProfileSkeleton } from '../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../lib/toast';
import { getApiErrorMessage } from '../../lib/errors';
import ProfileTab from './profile/ProfileTab';
import SocialTab from './profile/SocialTab';
import PasswordTab from './profile/PasswordTab';
import PrefsTab from './profile/PrefsTab';
import { AvatarViewModal, AvatarRemoveModal, CoverViewModal, CoverRemoveModal, DeleteAccountModal } from './profile/ProfileModals';

const ROLE_LABEL = { owner: 'Pemilik', admin: 'Admin', client: 'Klien', subscriber: 'Subscriber' };

function PhotoActionMenu({ open, uploading, canDelete, onClose, onView, onChange, onDelete }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open || uploading) return null;

    const items = [
        { key: 'view', label: 'Lihat', icon: 'eye', action: onView },
        { key: 'change', label: 'Ubah', icon: 'upload', action: onChange },
        ...(canDelete ? [{ key: 'delete', label: 'Hapus', icon: 'trash', danger: true, action: onDelete }] : []),
    ];

    const run = (fn) => { onClose(); fn(); };
    const left = Math.min(open.x, window.innerWidth - 210);
    const top = Math.min(open.y, window.innerHeight - 190);

    return (
        <>
            {/* Desktop: dropdown di posisi klik */}
            <div className="fixed inset-0 z-40 hidden lg:block" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
            <div
                className="fixed z-50 hidden min-w-[190px] overflow-hidden rounded-xl border border-line bg-surface py-1.5 shadow-2xl lg:block"
                style={{ left, top }}
                role="menu"
            >
                {items.map((it) => (
                    <button
                        key={it.key}
                        type="button"
                        role="menuitem"
                        onClick={() => run(it.action)}
                        className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-surface-muted ${
                            it.danger ? 'text-red-600 dark:text-red-400' : 'text-ink'
                        }`}
                    >
                        <Icon name={it.icon} size={16} /> {it.label}
                    </button>
                ))}
            </div>

            {/* Mobile/tablet: bottom sheet */}
            <div className="fixed inset-0 z-50 lg:hidden">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
                <div className="animate-sheet-up absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-line bg-surface p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl">
                    <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-line" />
                    {items.map((it) => (
                        <button
                            key={it.key}
                            type="button"
                            onClick={() => run(it.action)}
                            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-surface-muted ${
                                it.danger ? 'text-red-600 dark:text-red-400' : 'text-ink'
                            }`}
                        >
                            <Icon name={it.icon} size={18} /> {it.label}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}

const TABS = [
    { key: 'profile', label: 'Profil', icon: 'user' },
    { key: 'social', label: 'Media Sosial', icon: 'link' },
    { key: 'password', label: 'Kata Sandi', icon: 'lock' },
    { key: 'prefs', label: 'Preferensi', icon: 'bell' },
];

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
    const [coverViewOpen, setCoverViewOpen] = useState(false);
    const [coverRemoveOpen, setCoverRemoveOpen] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [coverMenu, setCoverMenu] = useState(null);
    const [avatarMenu, setAvatarMenu] = useState(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [removeOpen, setRemoveOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

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

    if (loading) return <ProfileSkeleton />;

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
        const payload = { ...prefs, notif_events: events };
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

    const uploadCover = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingCover(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await api.post('/profile/cover', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setCoverUrl(data.url);
            await refresh();
            toast.success(data.message || 'Banner diperbarui.');
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal mengunggah banner.'));
        } finally {
            setUploadingCover(false);
        }
        e.target.value = '';
    };

    const removeCover = async () => {
        setSaving(true);
        try {
            await api.put('/profile', { cover: '' });
            setCoverUrl(null);
            setCoverRemoveOpen(false);
            await refresh();
            toast.success('Banner dihapus.');
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal menghapus banner.'));
        } finally {
            setSaving(false);
        }
    };

    const uploadAvatar = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await api.post('/profile/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setAvatarUrl(data.url);
            await refresh();
            toast.success(data.message || 'Foto profil diperbarui.');
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal mengunggah foto profil.'));
        } finally {
            setUploadingAvatar(false);
        }
        e.target.value = '';
    };

    const removeAvatar = async () => {
        setSaving(true);
        try {
            await api.put('/profile', { avatar: '' });
            setAvatarUrl(null);
            setRemoveOpen(false);
            await refresh();
            toast.success('Foto profil dihapus.');
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal menghapus foto profil.'));
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
            setTimeout(() => { window.location.href = '/login'; }, 1200);
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
            else toast.error('Gagal menghapus akun.');
            setDeleting(false);
        }
    };

    const isOwner = user?.role === 'owner';
    const isAdmin = ['owner', 'admin'].includes(user?.role);
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
                    onClick={(e) => { if (!uploadingCover) setCoverMenu({ x: e.clientX, y: e.clientY }); }}
                    className="group relative block h-32 w-full overflow-hidden sm:h-40"
                    aria-label="Menu banner profil"
                >
                    {coverUrl ? (
                        <img src={coverUrl} alt="" className={`h-full w-full object-cover transition-all ${uploadingCover ? 'scale-105 blur-sm' : ''}`} />
                    ) : (
                        <div className={`h-full w-full bg-gradient-to-r from-brand-700 via-brand-500 to-brand-400 transition-all ${uploadingCover ? 'blur-sm' : ''}`} />
                    )}
                    {uploadingCover && (
                        <span className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-black/60 text-sm font-semibold text-white backdrop-blur-[2px]">
                            <Icon name="loader" size={18} className="animate-spin" /> Mengunggah banner…
                        </span>
                    )}
                    <span className={`absolute inset-0 hidden bg-black/40 transition-opacity lg:flex lg:items-center lg:justify-center lg:opacity-0 lg:group-hover:opacity-100 ${uploadingCover ? '!hidden' : ''}`}>
                        <span className="flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-sm font-semibold text-white">
                            <Icon name="camera" size={16} /> Ubah Banner
                        </span>
                    </span>
                    <span className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white shadow-lg backdrop-blur lg:hidden">
                        <Icon name="camera" size={18} />
                    </span>
                </button>
                <div className="relative z-10 px-5 pb-6 sm:px-8">
                    <div className="-mt-12 flex items-end justify-between sm:-mt-14">
                        <div className="relative">
                            <button type="button" onClick={(e) => { if (!uploadingAvatar) setAvatarMenu({ x: e.clientX, y: e.clientY }); }} className="group relative" aria-label="Menu foto profil">
                                <Avatar src={avatarUrl} name={profile.full_name} size="2xl" shape="full" className={`ring-4 ring-surface transition-all ${uploadingAvatar ? 'blur-[2px]' : ''}`} />
                                {uploadingAvatar ? (
                                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-[1px]" title="Mengunggah foto…">
                                        <Icon name="loader" size={22} className="animate-spin" />
                                    </span>
                                ) : (
                                    <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 rounded-full">
                                        <Icon name="camera" size={22} />
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-bold text-ink sm:text-2xl">{profile.full_name || '…'}</h2>
                            <span className="badge bg-brand-600/10 text-brand-600 dark:text-brand-400">{ROLE_LABEL[user?.role] || 'Pengguna'}</span>
                        </div>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                            <span className="inline-flex items-center gap-1.5"><Icon name="mail" size={14} /> {profile.email}</span>
                            {profile.phone && <span className="inline-flex items-center gap-1.5"><Icon name="phone" size={14} /> {profile.phone}</span>}
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
                {tab === 'profile' && <ProfileTab profile={profile} setProfile={setProfile} errors={errors} usernameStatus={usernameStatus} saving={saving} profileDirty={profileDirty} onSubmit={saveProfile} />}
                {tab === 'social' && <SocialTab socials={socials} setSocials={setSocials} saving={saving} socialsDirty={socialsDirty} onSubmit={saveSocials} />}
                {tab === 'password' && <PasswordTab pass={pass} setPass={setPass} errors={errors} saving={saving} passDirty={passDirty} onSubmit={savePassword} />}
                {tab === 'prefs' && <PrefsTab prefs={prefs} setPrefs={setPrefs} notifEvents={notifEvents} toggleEvent={toggleEvent} otpChannel={otpChannel} setOtpChannel={setOtpChannel} notifMeta={notifMeta} emailActive={emailActive} waActive={waActive} saving={saving} prefsDirty={prefsDirty} onSubmit={savePrefs} />}

                {/* Side summary */}
                <div className="space-y-6">
                    <div className="card p-5">
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">Ringkasan Akun</h3>
                        <div className="space-y-2.5 text-sm">
                            <div className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-2 text-ink-muted"><Icon name="user" size={15} /> Peran</span>
                                <span className="font-medium text-ink">{ROLE_LABEL[user?.role] || 'Pengguna'}</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="flex items-center gap-2 text-ink-muted"><Icon name="check" size={15} /> Status</span>
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

            <PhotoActionMenu
                open={coverMenu}
                uploading={uploadingCover}
                canDelete={!!coverUrl}
                onClose={() => setCoverMenu(null)}
                onView={() => setCoverViewOpen(true)}
                onChange={() => coverInputRef.current?.click()}
                onDelete={() => setCoverRemoveOpen(true)}
            />
            <PhotoActionMenu
                open={avatarMenu}
                uploading={uploadingAvatar}
                canDelete={!!avatarUrl}
                onClose={() => setAvatarMenu(null)}
                onView={() => setViewOpen(true)}
                onChange={() => avatarInputRef.current?.click()}
                onDelete={() => setRemoveOpen(true)}
            />

            <AvatarViewModal open={viewOpen} onClose={() => setViewOpen(false)} avatarUrl={avatarUrl} />
            <AvatarRemoveModal open={removeOpen} onClose={() => setRemoveOpen(false)} saving={saving} onConfirm={removeAvatar} />
            <CoverViewModal open={coverViewOpen} onClose={() => setCoverViewOpen(false)} coverUrl={coverUrl} />
            <CoverRemoveModal open={coverRemoveOpen} onClose={() => setCoverRemoveOpen(false)} saving={saving} onConfirm={removeCover} />
            <DeleteAccountModal open={deleteOpen} onClose={() => setDeleteOpen(false)} deleting={deleting} errors={errors} deletePass={deletePass} setDeletePass={setDeletePass} onSubmit={deleteAccount} />

            <input type="file" ref={avatarInputRef} accept="image/*" className="hidden" onChange={uploadAvatar} />
            <input type="file" ref={coverInputRef} accept="image/*" className="hidden" onChange={uploadCover} />
        </>
    );
}
