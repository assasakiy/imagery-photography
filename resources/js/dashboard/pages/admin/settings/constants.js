export const MASK = '••••••••';

export const BRAND_PRESETS = ['#7c3aed', '#059669', '#0284c7', '#e11d48', '#d97706', '#18181b'];

export const BUSINESS_TIMEZONES = [
    { value: 'Asia/Makassar', label: 'Asia/Makassar (WITA, UTC+8)' },
    { value: 'Asia/Jakarta', label: 'Asia/Jakarta (WIB, UTC+7)' },
    { value: 'Asia/Bangkok', label: 'Asia/Bangkok (ICT, UTC+7)' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT, UTC+8)' },
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST, UTC+5:30)' },
    { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST, UTC+8)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST, UTC+9)' },
    { value: 'Australia/Sydney', label: 'Australia/Sydney (AEDT, UTC+11)' },
    { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
    { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)' },
    { value: 'America/New_York', label: 'America/New_York (ET)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PT)' },
    { value: 'UTC', label: 'UTC' },
];

export const TABS = [
    { key: 'branding', label: 'Branding', icon: 'settings' },
    { key: 'integrasi', label: 'Integrasi', icon: 'link' },
    { key: 'pembayaran', label: 'Pembayaran', icon: 'credit-card' },
    { key: 'notifications', label: 'Notifikasi', icon: 'bell' },
    { key: 'security', label: 'Keamanan', icon: 'lock' },
    { key: 'maintenance', label: 'Pemeliharaan', icon: 'zap' },
];

export const TAB_FIELDS = {
    branding: ['site_name', 'site_tagline', 'site_description', 'site_logo', 'site_favicon', 'timezone'],
    integrasi: [
        'mail_host', 'mail_port', 'mail_username', 'mail_password', 'mail_from_address', 'mail_from_name',
        'whatsapp_config',
        'payment_tripay_config',
        'payment_manual_accounts',
        'google_auth_enabled', 'google_client_id', 'google_client_secret', 'google_redirect_url',
        'webhook_urls', 'notif_webhook_enabled',
    ],
    pembayaran: ['payment_manual_enabled', 'payment_gateway_enabled', 'payment_active_manuals', 'payment_active_qris', 'payment_active_channels'],
    notifications: ['notif_email_enabled', 'notif_wa_enabled'],
    security_login: ['login_remember_enabled', 'login_remember_days', 'login_methods_global', 'invite_expiry_hours'],
    security_file: ['file_retention_days', 'preview_expiry_days', 'archive_delay_days', 'redelivery_access_days'],
    security_account: ['account_retention_days'],
    security_analytics: ['analytics_enabled'],
    security_cookie: ['cookie_banner_enabled', 'cookie_banner_message'],
    maintenance: ['maintenance_enabled', 'maintenance_message'],
};

export const SMTP_FIELDS = ['mail_host', 'mail_port', 'mail_username', 'mail_password', 'mail_from_address', 'mail_from_name'];
export const WA_FIELDS = ['whatsapp_config'];
export const TRIPAY_FIELDS = ['payment_gateway_enabled', 'payment_tripay_config'];
export const GOOGLE_FIELDS = ['google_auth_enabled', 'google_client_id', 'google_client_secret', 'google_redirect_url'];

export const POPULAR_BANKS = [
    { code: 'bca', name: 'BCA', short: 'BCA', brandColor: '#0060A9' },
    { code: 'mandiri', name: 'Bank Mandiri', short: 'M', brandColor: '#FFD100', dark: true },
    { code: 'bni', name: 'BNI', short: 'BNI', brandColor: '#FF6300' },
    { code: 'bri', name: 'BRI', short: 'BRI', brandColor: '#00529C' },
    { code: 'bsi', name: 'Bank Syariah Indonesia', short: 'BSI', brandColor: '#00A63E' },
    { code: 'cimb', name: 'CIMB Niaga', short: 'CIMB', brandColor: '#0F243E' },
    { code: 'btn', name: 'Bank Tabungan Negara', short: 'BTN', brandColor: '#26427E' },
    { code: 'permata', name: 'Bank Permata', short: 'P', brandColor: '#E63232' },
    { code: 'maybank', name: 'Maybank Indonesia', short: 'M', brandColor: '#FFCD00', dark: true },
    { code: 'jenius', name: 'Bank Jago', short: 'J', brandColor: '#EC008C' },
    { code: 'sea', name: 'Bank Digital BCA', short: 'Sea', brandColor: '#2C6BED', dark: false },
    { code: 'hsbc', name: 'HSBC', short: 'H', brandColor: '#DB0011' },
];

export const POPULAR_WALLETS = [
    { code: 'gopay', name: 'GoPay', short: 'Go', brandColor: '#00AED6' },
    { code: 'ovo', name: 'OVO', short: 'OVO', brandColor: '#4C2A92' },
    { code: 'dana', name: 'DANA', short: 'D', brandColor: '#108EE9' },
    { code: 'shopeepay', name: 'ShopeePay', short: 'Sp', brandColor: '#EE4D2D' },
    { code: 'linkaja', name: 'LinkAja', short: 'L', brandColor: '#E60000' },
];

export const QRIS_PROVIDERS = [
    { code: 'gopay', name: 'GoPay Merchant', short: 'Go', brandColor: '#00AED6' },
    { code: 'dana', name: 'DANA Bisnis', short: 'D', brandColor: '#108EE9' },
    { code: 'shopeepay', name: 'ShopeePay Biz', short: 'Sp', brandColor: '#EE4D2D' },
    { code: 'linkaja', name: 'LinkAja Merchant', short: 'L', brandColor: '#E60000' },
    { code: 'other', name: 'Penyedia Lainnya', short: '+', brandColor: '#52525B' },
];

export const MANUAL_GROUP_TYPES = [
    { type: 'bank', label: 'Transfer Bank', icon: 'landmark' },
    { type: 'wallet', label: 'Dompet Digital', icon: 'wallet' },
    { type: 'qris', label: 'QRIS Statis', icon: 'qr' },
];

export const emptyForm = {
    site_name: '',
    site_tagline: '',
    site_description: '',
    site_logo: '',
    site_favicon: '',
    brand_color: '#7c3aed',
    timezone: 'Asia/Makassar',
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
    notif_webhook_enabled: false,
    whatsapp_config: { driver: 'gowa', config: {} },
    payment_manual_enabled: false,
    payment_gateway_enabled: false,
    payment_manual_accounts: [],
    payment_active_manuals: [],
    payment_active_qris: '',
    payment_active_channels: [],
    payment_tripay_config: { mode: 'sandbox', api_key: '', private_key: '', merchant_code: '' },
    login_attempts_max: 5,
    login_attempts_lockout_minutes: 15,
    login_remember_enabled: true,
    login_remember_days: 30,
    login_methods_global: { password: true, otp: true, google: true, token: true },
        file_retention_days: 0,
    account_retention_days: 30,
        invite_expiry_hours: 24,
        preview_expiry_days: 30,
        archive_delay_days: 60,
        redelivery_access_days: 7,
        maintenance_enabled: false,
    maintenance_message: '',
    analytics_enabled: true,
    cookie_banner_enabled: true,
    cookie_banner_message: '',
    notif_email_enabled: true,
    notif_wa_enabled: true,
    email_events: [],
    whatsapp_events: [],
    inapp_events: [],
    rate_limits: {},
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
        timezone: data.timezone || 'Asia/Makassar',
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
        account_retention_days: data.account_retention_days ?? 30,
        preview_expiry_days: data.preview_expiry_days ?? 30,
        archive_delay_days: data.archive_delay_days ?? 60,
        redelivery_access_days: data.redelivery_access_days ?? 7,
        invite_expiry_hours: data.invite_expiry_hours ?? 24,
        maintenance_enabled: !!data.maintenance_enabled,
        maintenance_message: data.maintenance_message || '',
        analytics_enabled: data.analytics_enabled !== false,
        cookie_banner_enabled: data.cookie_banner_enabled !== false,
        cookie_banner_message: data.cookie_banner_message || '',
        notif_email_enabled: data.email_enabled !== false,
        notif_wa_enabled: data.whatsapp_enabled !== false,
        notif_webhook_enabled: data.webhook_enabled !== false,
        email_events: data.email_events || [],
        whatsapp_events: data.whatsapp_events || [],
        inapp_events: data.inapp_events || [],
        payment_manual_enabled: !!data.payment_manual_enabled,
        payment_gateway_enabled: !!data.payment_gateway_enabled,
        payment_manual_accounts: Array.isArray(data.payment_manual_accounts) ? data.payment_manual_accounts : [],
        payment_active_manuals: Array.isArray(data.payment_active_manuals) ? data.payment_active_manuals : [],
        payment_active_qris: data.payment_active_qris || '',
        payment_active_channels: Array.isArray(data.payment_active_channels) ? data.payment_active_channels : [],
        payment_tripay_config: data.payment_tripay_config || { mode: 'sandbox', api_key: '', private_key: '', merchant_code: '' },
        rate_limits: data.rate_limits || {},
    };
}