import { useEffect, useState } from 'react';
import api from '../api';
import Icon from '../components/Icon';
import Button from '../components/Button';
import Toggle from '../components/Toggle';
import MediaPicker from '../components/MediaPicker';
import RichEditor from '../components/RichEditor';
import { PageHeader, Spinner, Field, useToast } from '../components/ui';

const MASK = '••••••••';

const BRAND_PRESETS = ['#7c3aed', '#059669', '#0284c7', '#e11d48', '#d97706', '#18181b'];

const TABS = [
    { key: 'branding', label: 'Branding', icon: 'settings' },
    { key: 'integrasi', label: 'Integrasi', icon: 'link' },
    { key: 'social', label: 'Login Sosial', icon: 'users' },
    { key: 'webhook', label: 'Webhook', icon: 'globe' },
    { key: 'notifications', label: 'Notifikasi', icon: 'bell' },
    { key: 'security', label: 'Keamanan', icon: 'lock' },
    { key: 'maintenance', label: 'Pemeliharaan', icon: 'zap' },
];

const TAB_FIELDS = {
    branding: ['site_name', 'site_tagline', 'site_description', 'site_logo', 'site_favicon'],
    integrasi: [
        'mail_host', 'mail_port', 'mail_username', 'mail_password', 'mail_from_address', 'mail_from_name',
        'whatsapp_config',
    ],
    social: ['google_auth_enabled', 'google_client_id', 'google_client_secret', 'google_redirect_url'],
    webhook: ['webhook_urls'],
    notifications: ['notif_email_enabled', 'notif_wa_enabled'],
    security_login: ['login_attempts_max', 'login_attempts_lockout_minutes', 'login_remember_enabled', 'login_remember_days', 'login_methods_global'],
    security_file: ['file_retention_days'],
    maintenance: ['maintenance_enabled', 'maintenance_message'],
};

const SMTP_FIELDS = ['mail_host', 'mail_port', 'mail_username', 'mail_password', 'mail_from_address', 'mail_from_name'];
const WA_FIELDS = ['whatsapp_config'];

const emptyForm = {
    site_name: '',
    site_tagline: '',
    site_description: '',
    site_logo: '',
    site_favicon: '',
    brand_color: '#7c3aed',
    mail_host: '',
    mail_port: '',
    mail_username: '',
    mail_password: '',
    mail_from_address: '',
    mail_from_name: '',
    google_auth_enabled: false,
    google_client_id: '',
    google_client_secret: '',
    google_redirect_url: '',
    webhook_urls: '',
    whatsapp_config: { driver: 'gowa', config: {} },
    login_attempts_max: 5,
    login_attempts_lockout_minutes: 15,
    login_remember_enabled: true,
    login_remember_days: 30,
    login_methods_global: { password: true, otp: true, google: true, token: true },
    file_retention_days: 0,
    maintenance_enabled: false,
    maintenance_message: '',
    notif_email_enabled: true,
    notif_wa_enabled: true,
    email_events: [],
    whatsapp_events: [],
};

function applyBrandColor(hex) {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    const rgb = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
    const mix = (ratio, target) => rgb.map((c, i) => Math.round(c + (target[i] - c) * ratio));
    const hexify = (a) => '#' + a.map((v) => v.toString(16).padStart(2, '0')).join('');
    const W = [255, 255, 255];
    const B = [0, 0, 0];
    const ratios = { 50: 0.96, 100: 0.9, 200: 0.8, 300: 0.65, 400: 0.42, 500: 0.18, 700: 0.14, 800: 0.3, 900: 0.48 };
    const root = document.documentElement.style;
    root.setProperty('--color-brand-600', hex);
    for (const [shade, ratio] of Object.entries(ratios)) {
        root.setProperty('--color-brand-' + shade, hexify(mix(ratio, shade < 600 ? W : B)));
    }
}

function statusBadge(ok, onLabel, offLabel) {
    return ok
        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
        : 'bg-zinc-500/15 text-ink-muted';
}

function pickValue(sel) {
    if (!sel) return '';
    return sel.source === 'url' ? sel.url : `media:${sel.mediaId}`;
}

function normalize(data) {
    return {
        site_name: data.site_name || '',
        site_tagline: data.site_tagline || '',
        site_description: data.site_description || '',
        site_logo: data.site_logo || '',
        site_favicon: data.site_favicon || '',
        brand_color: data.brand_color || '#7c3aed',
        mail_host: data.mail_host || '',
        mail_port: data.mail_port || '',
        mail_username: data.mail_username || '',
        mail_password: data.mail_password || '',
        mail_from_address: data.mail_from_address || '',
        mail_from_name: data.mail_from_name || '',
        google_auth_enabled: !!data.google_auth_enabled,
        google_client_id: data.google_client_id || '',
        google_client_secret: data.google_client_secret || '',
        google_redirect_url: data.google_redirect_url || '',
        webhook_urls: data.webhook_urls || '',
        whatsapp_config: data.whatsapp_config || { driver: 'gowa', config: {} },
        login_attempts_max: data.login_attempts_max ?? 5,
        login_attempts_lockout_minutes: data.login_attempts_lockout_minutes ?? 15,
        login_remember_enabled: !!data.login_remember_enabled,
        login_remember_days: data.login_remember_days ?? 30,
        login_methods_global: data.login_methods_global ?? { password: true, otp: true, google: true, token: true },
        file_retention_days: data.file_retention_days ?? 0,
        maintenance_enabled: !!data.maintenance_enabled,
        maintenance_message: data.maintenance_message || '',
        notif_email_enabled: data.email_enabled !== false,
        notif_wa_enabled: data.whatsapp_enabled !== false,
        email_events: data.email_events || [],
        whatsapp_events: data.whatsapp_events || [],
    };
}

function flagsOf(events) {
    return (events || []).map((e) => `${e.key}:${!!e.enabled}`).join(',');
}

export default function Settings() {
    const [tab, setTab] = useState('branding');
    const [form, setForm] = useState(emptyForm);
    const [base, setBase] = useState({});
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testingEmail, setTestingEmail] = useState(false);
    const [testingWhatsapp, setTestingWhatsapp] = useState(false);
    const [errors, setErrors] = useState({});
    const [mediaFor, setMediaFor] = useState(null);
    const [openEmail, setOpenEmail] = useState(false);
    const [openWa, setOpenWa] = useState(false);
    const { show, node } = useToast();

    useEffect(() => {
        api.get('/settings')
            .then(({ data }) => {
                setMeta(data);
                const loaded = normalize(data);
                setForm(loaded);
                setBase(pickBase(loaded));
            })
            .finally(() => setLoading(false));
    }, []);

    const pickBase = (f) => {
        const b = {};
        for (const t of Object.values(TAB_FIELDS)) for (const k of t) b[k] = f[k];
        b.brand_color = f.brand_color || '#7c3aed';
        b.email_events = f.email_events || [];
        b.whatsapp_events = f.whatsapp_events || [];
        return b;
    };

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const setEvent = (key, channel, enabled) => {
        const field = channel === 'email' ? 'email_events' : 'whatsapp_events';
        set(field, form[field].map((e) => (e.key === key ? { ...e, enabled } : e)));
    };

    const waDrivers = meta.whatsapp_drivers || [];
    const waDriver = form.whatsapp_config?.driver || waDrivers[0]?.key || 'gowa';
    const waFields = waDrivers.find((d) => d.key === waDriver)?.fields || [];
    const waConfig = form.whatsapp_config?.config || {};

    const setWaDriver = (driver) => {
        const schema = waDrivers.find((d) => d.key === driver);
        const config = {};
        for (const f of schema?.fields || []) {
            config[f.key] = f.default !== undefined ? f.default : '';
        }
        set('whatsapp_config', { driver, config });
    };

    const dirty = (keys) => keys.some((k) => JSON.stringify(form[k]) !== JSON.stringify(base[k]));
    const dirtyColor = form.brand_color !== base.brand_color;
    const dirtyEvents = (channel) => {
        const field = channel === 'email' ? 'email_events' : 'whatsapp_events';
        return flagsOf(form[field]) !== flagsOf(base[field]);
    };

    const save = async (keys, overrides = {}) => {
        setSaving(true);
        setErrors({});
        const payload = {};
        for (const k of keys) payload[k] = overrides?.[k] ?? form[k];
        try {
            await api.put('/settings', payload);
            if (keys.includes('brand_color')) applyBrandColor(form.brand_color);
            const reload = await api.get('/settings');
            setMeta(reload.data);
            const next = normalize(reload.data);
            setForm(next);
            setBase(pickBase(next));
            show('Pengaturan disimpan.');
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
            else show('Gagal menyimpan pengaturan.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const saveNotifCard = async (channel) => {
        const keys = channel === 'email' ? ['notif_email_enabled', 'email_events'] : ['notif_wa_enabled', 'whatsapp_events'];
        await save(keys);
    };

    const toggleNotifChannel = async (channel, v) => {
        const field = channel === 'email' ? 'notif_email_enabled' : 'notif_wa_enabled';
        set(field, v);
        await save([field], { [field]: v });
    };

    const toggleWaChannel = async (v) => {
        if (v && !form.notif_wa_enabled) {
            const fields = waFields.filter((f) => f.required);
            const missing = fields.filter((f) => !(waConfig[f.key] ?? '').trim());
            if (missing.length) {
                show('Lengkapi konfigurasi WhatsApp terlebih dahulu.', 'error');
                return;
            }
        }
        set('notif_wa_enabled', v);
        await save(['notif_wa_enabled'], { notif_wa_enabled: v });
    };

    const toggleEmailChannel = async (v) => {
        if (v && !form.notif_email_enabled) {
            const missing = ['mail_host', 'mail_port'].filter((k) => !(form[k] || '').trim());
            if (missing.length) {
                show('Lengkapi konfigurasi email (host & port) terlebih dahulu.', 'error');
                return;
            }
        }
        set('notif_email_enabled', v);
        await save(['notif_email_enabled'], { notif_email_enabled: v });
    };

    const testEmail = async () => {
        setTestingEmail(true);
        try {
            const { data } = await api.post('/settings/test-email');
            show(data.message || 'Email uji terkirim.');
        } catch (err) {
            show(err.response?.data?.message || 'Gagal mengirim email uji.', 'error');
        } finally {
            setTestingEmail(false);
        }
    };

    const testWhatsapp = async () => {
        setTestingWhatsapp(true);
        try {
            const { data } = await api.post('/settings/test-whatsapp');
            show(data.message || 'WhatsApp uji terkirim.');
        } catch (err) {
            show(err.response?.data?.message || 'Gagal mengirim WhatsApp uji.', 'error');
        } finally {
            setTestingWhatsapp(false);
        }
    };

    const setChecked = (k) => (e) => set(k, e.target.checked);

    if (loading) return <Spinner />;

    const NotifCard = ({ channel }) => {
        const isEmail = channel === 'email';
        const field = isEmail ? 'notif_email_enabled' : 'notif_wa_enabled';
        const enabled = form[field];
        const configured = isEmail ? meta.email_configured : meta.whatsapp_configured;
        const events = isEmail ? form.email_events : form.whatsapp_events;
        const label = isEmail ? 'Email' : 'WhatsApp';

        return (
            <div className="card w-full p-6">
                <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                        <h2 className="font-semibold text-ink">Notifikasi {label}</h2>
                        <p className="text-xs text-ink-muted">
                            {isEmail
                                ? 'Kirim pemberitahuan ke klien via email (SMTP).'
                                : 'Kirim pemberitahuan ke klien via WhatsApp.'}
                        </p>
                    </div>
                    <span className={`badge shrink-0 ${statusBadge(enabled)}`}>{enabled ? 'Aktif' : 'Nonaktif'}</span>
                </div>

                {!configured && (
                    <p className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
                        Koneksi {isEmail ? 'SMTP' : 'WhatsApp'} belum dikonfigurasi di tab Integrasi. Notifikasi {isEmail ? 'email' : 'WhatsApp'} tidak bisa dikirim.
                    </p>
                )}

                <div className="border-b border-line pb-5">
                    <Toggle
                        checked={enabled}
                        onChange={(v) => toggleNotifChannel(channel, v)}
                        label={`Aktifkan notifikasi ${label}`}
                        desc={enabled ? 'Kanal aktif — daftar event di bawah ditampilkan.' : 'Kanal nonaktif — daftar event disembunyikan.'}
                    />
                </div>

                {enabled && (
                    <>
                        <div className="divide-y divide-line border-t border-line">
                            {events.map((ev) => (
                                <label
                                    key={ev.key}
                                    className={`flex items-center justify-between gap-4 py-3 ${ev.mandatory ? 'opacity-80' : ''}`}
                                >
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
                                            checked={!!ev.enabled}
                                            disabled={ev.mandatory}
                                            onChange={(e) => setEvent(ev.key, channel, e.target.checked)}
                                        />
                                    </div>
                                </label>
                            ))}
                        </div>

                        <p className="mt-3 text-xs text-ink-muted">
                            Event "Wajib" (OTP login & login mencurigakan) tetap dikirim untuk keamanan akun meskipun kanal dimatikan.
                        </p>

                        <div className="mt-6 flex justify-end border-t border-line pt-5">
                            <Button
                                icon="check"
                                loading={saving}
                                disabled={!dirtyEvents(channel)}
                                onClick={() => saveNotifCard(channel)}
                            >
                                Simpan Notifikasi {label}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <>
            <PageHeader title="Pengaturan" subtitle="Branding, integrasi, login sosial, webhook, notifikasi, keamanan, dan pemeliharaan." />

            <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1.5">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => {
                            setTab(t.key);
                            setErrors({});
                        }}
                        className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                            tab === t.key ? 'bg-brand-600 text-white shadow' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                        }`}
                    >
                        <Icon name={t.icon} size={16} />
                        <span className="hidden md:inline">{t.label}</span>
                    </button>
                ))}
            </div>

            {tab === 'branding' && (
                <div className="space-y-6">
                    <div className="card w-full p-6">
                        <div className="mb-5">
                            <h2 className="font-semibold text-ink">Branding</h2>
                            <p className="text-xs text-ink-muted">Nama situs, tagline, deskripsi, logo, dan favicon — tampil di seluruh website.</p>
                        </div>
                        <div className="space-y-5">
                            <Field label="Nama Situs" required error={errors.site_name?.[0]}>
                                <input className="input" value={form.site_name} onChange={(e) => set('site_name', e.target.value)} placeholder="Sopian Lalu Imagery" />
                            </Field>
                            <Field label="Tagline" hint="tampil di bawah nama situs" error={errors.site_tagline?.[0]}>
                                <input className="input" value={form.site_tagline} onChange={(e) => set('site_tagline', e.target.value)} placeholder="Abadi Setiap Momen" />
                            </Field>
                            <Field label="Deskripsi Situs" hint="tampil di footer & ringkasan SEO" error={errors.site_description?.[0]}>
                                <RichEditor variant="mini" value={form.site_description} onChange={(v) => set('site_description', v)} minHeight={120} maxHeight={200} placeholder="Deskripsi singkat situs…" />
                            </Field>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <Field label="Logo" hint="gambar persegi/transparan">
                                    <div className="flex items-center gap-3">
                                        <img src={meta.site_logo_url} alt="Logo" className="h-16 w-16 rounded-xl border border-line bg-surface-muted object-cover" />
                                        <div className="space-y-2">
                                            <Button size="sm" variant="outline" icon="image" onClick={() => setMediaFor('site_logo')}>Pilih Logo</Button>
                                            {form.site_logo && (
                                                <Button size="xs" variant="ghost" icon="trash" onClick={() => set('site_logo', '')}>Hapus</Button>
                                            )}
                                        </div>
                                    </div>
                                </Field>
                                <Field label="Favicon" hint="ikon kecil di tab browser">
                                    <div className="flex items-center gap-3">
                                        <img src={meta.site_favicon_url} alt="Favicon" className="h-16 w-16 rounded-xl border border-line bg-surface-muted object-cover" />
                                        <div className="space-y-2">
                                            <Button size="sm" variant="outline" icon="image" onClick={() => setMediaFor('site_favicon')}>Pilih Favicon</Button>
                                            {form.site_favicon && (
                                                <Button size="xs" variant="ghost" icon="trash" onClick={() => set('site_favicon', '')}>Hapus</Button>
                                            )}
                                        </div>
                                    </div>
                                </Field>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end border-t border-line pt-5">
                            <Button icon="check" loading={saving} disabled={!dirty(TAB_FIELDS.branding)} onClick={() => save(TAB_FIELDS.branding)}>Simpan Branding</Button>
                        </div>
                    </div>

                    <div className="card w-full p-6">
                        <div className="mb-5">
                            <h2 className="font-semibold text-ink">Warna Brand</h2>
                            <p className="text-xs text-ink-muted">Warna utama website & dashboard.</p>
                        </div>
                        <Field label="Warna Brand" error={errors.brand_color?.[0]}>
                            <div className="flex flex-wrap items-center gap-3">
                                {BRAND_PRESETS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => set('brand_color', color)}
                                        className={`h-9 w-9 rounded-full ring-2 transition-transform ${
                                            form.brand_color === color ? 'ring-ink scale-110' : 'ring-transparent hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: color }}
                                        aria-label={color}
                                    />
                                ))}
                                <label className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm text-ink-muted hover:bg-surface-muted">
                                    <span className="h-5 w-5 rounded-md border border-line" style={{ backgroundColor: form.brand_color }} />
                                    <input
                                        type="color"
                                        className="h-0 w-0 opacity-0"
                                        value={/^#[0-9a-f]{6}$/i.test(form.brand_color) ? form.brand_color : '#7c3aed'}
                                        onChange={(e) => set('brand_color', e.target.value)}
                                    />
                                    <span className="font-mono">{form.brand_color}</span>
                                </label>
                            </div>
                        </Field>
                        <div className="mt-4 rounded-xl border border-line bg-surface-muted/50 p-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Pratinjau</p>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: form.brand_color }}>Tombol</span>
                                <span className="rounded-lg px-3 py-1.5 text-sm font-semibold" style={{ backgroundColor: 'color-mix(in srgb, ' + form.brand_color + ' 15%, transparent)', color: form.brand_color }}>Chip</span>
                                <span className="text-sm font-medium text-ink-muted">Teks <span style={{ color: form.brand_color }}>berwarna</span></span>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end border-t border-line pt-5">
                            <Button icon="check" loading={saving} disabled={!dirtyColor} onClick={() => save(['brand_color'])}>Simpan Warna</Button>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'integrasi' && (
                <div className="space-y-6">
                    <div className="card w-full p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="font-semibold text-ink">Email (SMTP)</h2>
                                <p className="text-xs text-ink-muted">Dipakai untuk notifikasi email, OTP login, dan email uji.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setOpenEmail((v) => !v)}
                                    className={`badge cursor-pointer transition-colors ${
                                        meta.email_configured
                                            ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400'
                                            : 'bg-red-500/15 text-red-600 hover:bg-red-500/25 dark:text-red-400'
                                    }`}
                                >
                                    <Icon name="chevron-down" size={12} className={`transition-transform ${openEmail ? 'rotate-180' : ''}`} />
                                    {meta.email_configured ? 'Terkonfigurasi' : 'Belum Dikonfigurasi'}
                                </button>
                            </div>
                        </div>

                        {meta.email_configured && (
                            <div className="mt-4 border-b border-line pb-4">
                                <Toggle
                                    checked={form.notif_email_enabled}
                                    onChange={(v) => toggleEmailChannel(v)}
                                    label="Aktifkan integrasi Email"
                                    desc={form.notif_email_enabled
                                        ? 'Integrasi aktif — notifikasi email dikirim.'
                                        : 'Integrasi nonaktif. Konfigurasi tetap tersimpan.'}
                                />
                            </div>
                        )}

                        {meta.env_mail_configured && (
                            <p className="mt-4 rounded-lg bg-sky-500/10 px-3 py-2 text-xs text-sky-600 dark:text-sky-400">
                                SMTP juga dikonfigurasi di file <code>.env</code>. Nilai di dashboard ini menimpa konfigurasi tersebut.
                            </p>
                        )}

                        {openEmail && (
                            <div className="mt-5">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <Field label="Host" hint="wajib" error={errors.mail_host?.[0]}>
                                        <input className="input" placeholder="smtp.gmail.com" value={form.mail_host} onChange={(e) => set('mail_host', e.target.value)} />
                                    </Field>
                                    <Field label="Port" hint="wajib" error={errors.mail_port?.[0]}>
                                        <input className="input" type="number" placeholder="587" value={form.mail_port} onChange={(e) => set('mail_port', e.target.value)} />
                                    </Field>
                                    <Field label="Username" hint="opsional">
                                        <input className="input" autoComplete="off" value={form.mail_username} onChange={(e) => set('mail_username', e.target.value)} />
                                    </Field>
                                    <Field label="Password" hint="opsional">
                                        <input className="input" type="password" autoComplete="new-password" placeholder={form.mail_password === MASK ? '••••••••' : ''} value={form.mail_password === MASK ? '' : form.mail_password} onChange={(e) => set('mail_password', e.target.value)} />
                                    </Field>
                                    <Field label="Dari (email)" hint="opsional" error={errors.mail_from_address?.[0]}>
                                        <input className="input" type="email" value={form.mail_from_address} onChange={(e) => set('mail_from_address', e.target.value)} />
                                    </Field>
                                    <Field label="Dari (nama)" hint="opsional">
                                        <input className="input" value={form.mail_from_name} onChange={(e) => set('mail_from_name', e.target.value)} />
                                    </Field>
                                </div>
                                <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-line pt-5">
                                    <Button
                                        variant="outline"
                                        icon="send"
                                        loading={testingEmail}
                                        disabled={!meta.email_configured}
                                        onClick={testEmail}
                                    >
                                        Tes Koneksi
                                    </Button>
                                    <Button icon="check" loading={saving} disabled={!dirty(SMTP_FIELDS)} onClick={() => save(SMTP_FIELDS)}>Simpan SMTP</Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="card w-full p-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="font-semibold text-ink">WhatsApp</h2>
                                <p className="text-xs text-ink-muted">Pilih driver, isi konfigurasinya, lalu tes koneksi.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setOpenWa((v) => !v)}
                                    className={`badge cursor-pointer transition-colors ${
                                        meta.whatsapp_configured
                                            ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400'
                                            : 'bg-red-500/15 text-red-600 hover:bg-red-500/25 dark:text-red-400'
                                    }`}
                                >
                                    <Icon name="chevron-down" size={12} className={`transition-transform ${openWa ? 'rotate-180' : ''}`} />
                                    {meta.whatsapp_configured ? 'Terkonfigurasi' : 'Belum Dikonfigurasi'}
                                </button>
                            </div>
                        </div>

                        {meta.whatsapp_configured && (
                            <div className="mt-4 border-b border-line pb-4">
                                <Toggle
                                    checked={form.notif_wa_enabled}
                                    onChange={(v) => toggleWaChannel(v)}
                                    label="Aktifkan integrasi WhatsApp"
                                    desc={form.notif_wa_enabled
                                        ? 'Integrasi aktif — pesan WhatsApp dikirim.'
                                        : 'Integrasi nonaktif. Konfigurasi tetap tersimpan.'}
                                />
                            </div>
                        )}

                        {openWa && (
                            <div className="mt-5">
                                <Field label="Driver" required>
                            <div className="space-y-2">
                                <select className="input" value={waDriver} onChange={(e) => setWaDriver(e.target.value)}>
                                    {(meta.whatsapp_drivers || []).map((d) => (
                                        <option key={d.key} value={d.key}>{d.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-ink-muted">
                                    {waDrivers.find((d) => d.key === waDriver)?.description || ''}
                                </p>
                            </div>
                        </Field>

                        <div className={`mt-5 grid grid-cols-1 gap-4 ${waFields.some((f) => f.type === 'textarea') ? 'sm:grid-cols-2' : 'sm:grid-cols-2'}`}>
                            {waFields.map((f) => {
                                const val = waConfig[f.key] ?? '';
                                const masked = val === MASK;
                                const setVal = (v) => set('whatsapp_config', { ...form.whatsapp_config, config: { ...waConfig, [f.key]: v } });

                                if (f.type === 'select') {
                                    return (
                                        <Field key={f.key} label={f.label} required={f.required} hint={f.help}>
                                            <select className="input" value={val} onChange={(e) => setVal(e.target.value)}>
                                                {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </Field>
                                    );
                                }

                                if (f.type === 'password') {
                                    return (
                                        <Field key={f.key} label={f.label} required={f.required} hint={f.help}>
                                            <input
                                                className="input"
                                                type="password"
                                                autoComplete="new-password"
                                                placeholder={masked ? MASK : ''}
                                                value={masked ? '' : val}
                                                onChange={(e) => setVal(e.target.value)}
                                            />
                                        </Field>
                                    );
                                }

                                if (f.type === 'textarea') {
                                    return (
                                        <Field key={f.key} label={f.label} required={f.required} hint={f.help}>
                                            <textarea
                                                className="input min-h-[150px] resize-y font-mono text-xs"
                                                value={val}
                                                onChange={(e) => setVal(e.target.value)}
                                            />
                                        </Field>
                                    );
                                }

                                return (
                                    <Field key={f.key} label={f.label} required={f.required} hint={f.help}>
                                        <input
                                            className="input"
                                            type={f.type === 'url' ? 'url' : 'text'}
                                            placeholder={f.placeholder}
                                            value={val}
                                            onChange={(e) => setVal(e.target.value)}
                                        />
                                    </Field>
                                );
                            })}
                        </div>

                        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-line pt-5">
                            <Button
                                variant="outline"
                                icon="send"
                                loading={testingWhatsapp}
                                disabled={!meta.whatsapp_configured}
                                onClick={testWhatsapp}
                            >
                                Tes Koneksi
                            </Button>
                            <Button icon="check" loading={saving} disabled={!dirty(WA_FIELDS)} onClick={() => save(WA_FIELDS)}>Simpan WhatsApp</Button>
                        </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {tab === 'social' && (
                <div className="card w-full p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-ink">Masuk dengan Google</h2>
                            <p className="text-xs text-ink-muted">Izinkan admin masuk lewat akun Google.</p>
                        </div>
                        <span className={`badge ${form.google_auth_enabled ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-500/15 text-ink-muted'}`}>
                            {form.google_auth_enabled ? 'Aktif' : 'Nonaktif'}
                        </span>
                    </div>
                    <div className="mb-4 flex items-center gap-2 text-sm">
                        <label className="flex cursor-pointer items-center gap-2 text-ink">
                            <input
                                type="checkbox"
                                checked={form.google_auth_enabled}
                                onChange={setChecked('google_auth_enabled')}
                                className="h-4 w-4 rounded border-line text-brand-600"
                            />
                            Aktifkan tombol "Masuk dengan Google"
                        </label>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field label="Client ID" hint="opsional">
                            <input className="input" autoComplete="off" value={form.google_client_id} onChange={(e) => set('google_client_id', e.target.value)} placeholder="xxxxxxxx.apps.googleusercontent.com" />
                        </Field>
                        <Field label="Client Secret" hint="opsional">
                            <input className="input" type="password" autoComplete="new-password" placeholder={form.google_client_secret === MASK ? '••••••••' : ''} value={form.google_client_secret === MASK ? '' : form.google_client_secret} onChange={(e) => set('google_client_secret', e.target.value)} />
                        </Field>
                        <div className="sm:col-span-2">
                            <Field label="URL Redirect (Callback)" hint="opsional" error={errors.google_redirect_url?.[0]}>
                                <input className="input" value={form.google_redirect_url} onChange={(e) => set('google_redirect_url', e.target.value)} placeholder="https://imagery.assasakiy.my.id/auth/google/callback" />
                            </Field>
                            <p className="mt-1 text-xs text-ink-muted">
                                Kosongkan untuk memakai otomatis: <code className="font-mono">{meta.google_redirect_url || '-'}</code>
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end border-t border-line pt-5">
                        <Button icon="check" loading={saving} disabled={!dirty(TAB_FIELDS.social)} onClick={() => save(TAB_FIELDS.social)}>Simpan Login Sosial</Button>
                    </div>
                </div>
            )}

            {tab === 'webhook' && (
                <div className="card w-full p-6">
                    <div className="mb-5">
                        <h2 className="font-semibold text-ink">Webhook</h2>
                        <p className="text-xs text-ink-muted">URL dipisah baris. Akan dipanggil saat event penting terjadi.</p>
                    </div>
                    <Field label="URL Webhook" hint="opsional" error={errors.webhook_urls?.[0]}>
                        <textarea className="input min-h-[180px]" placeholder={'https://example.com/hooks/imager\nhttps://hook.site/...'} value={form.webhook_urls} onChange={(e) => set('webhook_urls', e.target.value)} />
                    </Field>
                    <div className="mt-6 flex justify-end border-t border-line pt-5">
                        <Button icon="check" loading={saving} disabled={!dirty(TAB_FIELDS.webhook)} onClick={() => save(TAB_FIELDS.webhook)}>Simpan Webhook</Button>
                    </div>
                </div>
            )}

            {tab === 'notifications' && (
                <div className="space-y-6">
                    <NotifCard channel="email" />
                    <NotifCard channel="whatsapp" />
                </div>
            )}

            {tab === 'security' && (
                <div className="space-y-6">
                    <div className="card w-full p-6">
                        <div className="mb-5">
                            <h2 className="font-semibold text-ink">Keamanan Login</h2>
                            <p className="text-xs text-ink-muted">Batas percobaan login, sesi "jangan lupakan saya", dan metode login.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Maksimal percobaan login gagal" hint="sebelum dikunci sementara" error={errors.login_attempts_max?.[0]}>
                                <input className="input" type="number" min="1" max="20" value={form.login_attempts_max} onChange={(e) => set('login_attempts_max', e.target.value)} />
                            </Field>
                            <Field label="Durasi kunci (menit)" hint="per alamat IP" error={errors.login_attempts_lockout_minutes?.[0]}>
                                <input className="input" type="number" min="1" max="1440" value={form.login_attempts_lockout_minutes} onChange={(e) => set('login_attempts_lockout_minutes', e.target.value)} />
                            </Field>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm">
                            <label className="flex cursor-pointer items-center gap-2 text-ink">
                                <input
                                    type="checkbox"
                                    checked={form.login_remember_enabled}
                                    onChange={setChecked('login_remember_enabled')}
                                    className="h-4 w-4 rounded border-line text-brand-600"
                                />
                                Aktifkan opsi "Jangan lupakan saya" di halaman login
                            </label>
                        </div>
                        <div className="mt-4 sm:max-w-xs">
                            <Field label="Durasi sesi ingat (hari)" hint={'saat "jangan lupakan saya" dicentang'} error={errors.login_remember_days?.[0]}>
                                <input className="input" type="number" min="1" max="3650" disabled={!form.login_remember_enabled} value={form.login_remember_days} onChange={(e) => set('login_remember_days', e.target.value)} />
                            </Field>
                        </div>

                        <div className="mt-6 border-t border-line pt-5">
                            <h2 className="font-semibold text-ink">Metode Login</h2>
                            <p className="mt-1 text-xs text-ink-muted">
                                Hanya metode yang aktif/siap digunakan yang ditampilkan (OTP perlu integrasi WhatsApp/Email aktif, Google perlu Login Sosial aktif).
                            </p>
                            <div className="mt-4 space-y-3">
                                {Object.entries(form.login_methods_global || {})
                                    .filter(([method]) => method === 'password' || method === 'token' ||
                                        (method === 'otp' && (meta.email_enabled || meta.whatsapp_enabled)) ||
                                        (method === 'google' && meta.google_auth_enabled && meta.google_client_id))
                                    .map(([method, enabled]) => (
                                        <Toggle
                                            key={method}
                                            size="sm"
                                            checked={!!enabled}
                                            onChange={(v) => set('login_methods_global', { ...form.login_methods_global, [method]: v })}
                                            label={method === 'token' ? 'Access Link' : method.charAt(0).toUpperCase() + method.slice(1)}
                                            desc={
                                                method === 'token'
                                                    ? 'Masuk lewat tautan akses sekali pakai (dikirim/dibagikan admin).'
                                                    : method === 'otp'
                                                        ? 'Masuk lewat kode OTP via WhatsApp/Email.'
                                                        : method === 'google'
                                                            ? 'Masuk lewat akun Google (Login Sosial).'
                                                            : 'Masuk dengan email/no. WhatsApp + kata sandi.'
                                            }
                                        />
                                    ))}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end border-t border-line pt-5">
                            <Button icon="check" loading={saving} disabled={!dirty(TAB_FIELDS.security_login)} onClick={() => save(TAB_FIELDS.security_login)}>Simpan Keamanan Login</Button>
                        </div>
                    </div>

                    <div className="card w-full p-6">
                        <div className="mb-5">
                            <h2 className="font-semibold text-ink">Retensi File</h2>
                            <p className="text-xs text-ink-muted">Berapa lama file hasil (galeri) tersedia untuk diunduh klien setelah upload. 0 = tidak pernah kedaluwarsa.</p>
                        </div>
                        <div className="sm:max-w-xs">
                            <Field label="Masa simpan (hari)" hint="0 = tanpa batas" error={errors.file_retention_days?.[0]}>
                                <select className="input" value={form.file_retention_days} onChange={(e) => set('file_retention_days', e.target.value)}>
                                    <option value="0">Tidak pernah kedaluwarsa</option>
                                    <option value="30">30 hari</option>
                                    <option value="90">90 hari</option>
                                    <option value="180">180 hari</option>
                                    <option value="365">365 hari</option>
                                </select>
                            </Field>
                        </div>
                        <div className="mt-6 flex justify-end border-t border-line pt-5">
                            <Button icon="check" loading={saving} disabled={!dirty(TAB_FIELDS.security_file)} onClick={() => save(TAB_FIELDS.security_file)}>Simpan Retensi File</Button>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'maintenance' && (
                <div className="card w-full p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-ink">Mode Pemeliharaan</h2>
                            <p className="text-xs text-ink-muted">Blokir akses publik. Pemilik & admin tetap bisa masuk dashboard.</p>
                        </div>
                        <span className={`badge ${form.maintenance_enabled ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'}`}>
                            {form.maintenance_enabled ? 'Aktif' : 'Nonaktif'}
                        </span>
                    </div>
                    <div className="mb-5">
                        <Toggle
                            checked={form.maintenance_enabled}
                            onChange={(v) => set('maintenance_enabled', v)}
                            label="Aktifkan mode pemeliharaan"
                            desc={form.maintenance_enabled ? 'Situs publik sedang ditutup sementara.' : 'Situs publik dapat diakses normal.'}
                        />
                    </div>
                    <Field label="Pesan Pemeliharaan" hint="tampil untuk pengunjung">
                        <RichEditor variant="mini" value={form.maintenance_message} onChange={(v) => set('maintenance_message', v)} minHeight={120} maxHeight={200} placeholder="Pesan untuk pengunjung…" />
                    </Field>
                    <div className="mt-6 flex justify-end border-t border-line pt-5">
                        <Button icon="check" loading={saving} disabled={!dirty(TAB_FIELDS.maintenance)} onClick={() => save(TAB_FIELDS.maintenance)}>Simpan Pemeliharaan</Button>
                    </div>
                </div>
            )}

            <MediaPicker
                open={!!mediaFor}
                onClose={() => setMediaFor(null)}
                onSelect={(sel) => {
                    if (mediaFor) set(mediaFor, pickValue(sel));
                }}
                title={mediaFor === 'site_logo' ? 'Pilih Logo' : 'Pilih Favicon'}
            />
            {node}
        </>
    );
}
