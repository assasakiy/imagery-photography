export const MASK = '••••••••';

export const BRAND_PRESETS = ['#7c3aed', '#059669', '#0284c7', '#e11d48', '#d97706', '#18181b'];

export const TABS = [
    { key: 'branding', label: 'Branding', icon: 'settings' },
    { key: 'integrasi', label: 'Integrasi', icon: 'link' },
    { key: 'social', label: 'Login Sosial', icon: 'users' },
    { key: 'webhook', label: 'Webhook', icon: 'globe' },
    { key: 'notifications', label: 'Notifikasi', icon: 'bell' },
    { key: 'security', label: 'Keamanan', icon: 'lock' },
    { key: 'maintenance', label: 'Pemeliharaan', icon: 'zap' },
];

export const TAB_FIELDS = {
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

export const SMTP_FIELDS = ['mail_host', 'mail_port', 'mail_username', 'mail_password', 'mail_from_address', 'mail_from_name'];
export const WA_FIELDS = ['whatsapp_config'];

export const emptyForm = {
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
    inapp_events: [],
};

export function applyBrandColor(hex) {
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

export function statusBadge(ok, onLabel, offLabel) {
    return ok
        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
        : 'bg-zinc-500/15 text-ink-muted';
}

export function pickValue(sel) {
    if (!sel) return '';
    return sel.source === 'url' ? sel.url : `media:${sel.mediaId}`;
}

export function normalize(data) {
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
        inapp_events: data.inapp_events || [],
    };
}