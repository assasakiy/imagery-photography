import { useEffect, useState } from 'react';
import api from '../../../api';
import Icon from '../../../components/Icon';
import MediaPicker from '../../../components/MediaPicker';
import { PageHeader } from '../../../components/ui';
import Skeleton from '../../../components/Skeleton';
import { toast } from '../../../lib/toast';
import { getApiErrorMessage } from '../../../lib/errors';
import BrandingTab from './BrandingTab';
import IntegrasiTab from './IntegrasiTab';
import NotificationsTab from './NotificationsTab';
import PaymentTab from './PaymentTab';
import SecurityTab from './SecurityTab';
import MaintenanceTab from './MaintenanceTab';
import { TABS, TAB_FIELDS, emptyForm, normalize, applyBrandColor, pickValue } from './constants';

export default function Settings() {
    const [tab, setTab] = useState('branding');
    const [form, setForm] = useState(emptyForm);
    const [base, setBase] = useState({});
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testingEmail, setTestingEmail] = useState(false);
    const [testingWhatsapp, setTestingWhatsapp] = useState(false);
    const [testingTripay, setTestingTripay] = useState(false);
    const [testingWebhook, setTestingWebhook] = useState(false);
    const [errors, setErrors] = useState({});
    const [mediaFor, setMediaFor] = useState(null);
    const [openEmail, setOpenEmail] = useState(false);
    const [openWa, setOpenWa] = useState(false);
    const [openTripay, setOpenTripay] = useState(false);
    const [openGoogle, setOpenGoogle] = useState(false);
    const [openManual, setOpenManual] = useState(false);

    useEffect(() => {
        api.get('/settings')
            .then(({ data }) => {
                setMeta(data);
                const loaded = normalize(data);
                setForm(loaded);
                setBase(pickBase(loaded));
            })
            .catch(() => toast.error('Gagal memuat pengaturan.'))
            .finally(() => setLoading(false));
    }, []);

    const pickBase = (f) => {
        const b = {};
        for (const t of Object.values(TAB_FIELDS)) for (const k of t) b[k] = f[k];
        b.brand_color = f.brand_color || '#7c3aed';
        b.email_events = f.email_events || [];
        b.whatsapp_events = f.whatsapp_events || [];
        b.inapp_events = f.inapp_events || [];
        return b;
    };

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const setChecked = (k) => (e) => set(k, e.target.checked);

    const setEvent = (key, channel, enabled) => {
        const field = channel === 'email' ? 'email_events' : channel === 'inapp' ? 'inapp_events' : 'whatsapp_events';
        set(field, form[field].map((e) => (e.key === key ? { ...e, enabled } : e)));
    };

    const toggleEvent = async (channel, key, enabled) => {
        setEvent(key, channel, enabled);
        const field = channel === 'email' ? 'email_events' : channel === 'inapp' ? 'inapp_events' : 'whatsapp_events';
        try {
            await api.put('/settings', { [field]: form[field].map((e) => (e.key === key ? { ...e, enabled } : e)) });
        } catch {
            toast.error('Gagal menyimpan pengaturan event.');
        }
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
            toast.success('Pengaturan disimpan.');
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
            else toast.error('Gagal menyimpan pengaturan.');
        } finally {
            setSaving(false);
        }
    };

    const toggleWaChannel = async (v) => {
        if (v && !form.notif_wa_enabled) {
            const fields = waFields.filter((f) => f.required);
            const missing = fields.filter((f) => !(waConfig[f.key] ?? '').trim());
            if (missing.length) {
                toast.error('Lengkapi konfigurasi WhatsApp terlebih dahulu.');
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
                toast.error('Lengkapi konfigurasi email (host & port) terlebih dahulu.');
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
            toast.success(data.message || 'Email uji terkirim.');
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal mengirim email uji.'));
        } finally {
            setTestingEmail(false);
        }
    };

    const testWhatsapp = async () => {
        setTestingWhatsapp(true);
        try {
            const { data } = await api.post('/settings/test-whatsapp');
            toast.success(data.message || 'WhatsApp uji terkirim.');
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal mengirim WhatsApp uji.'));
        } finally {
            setTestingWhatsapp(false);
        }
    };

    const testGateway = async () => {
        setTestingTripay(true);
        try {
            const { data } = await api.post('/settings/test-payment-gateway');
            toast.success(data.message || 'Koneksi sukses.');
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal terhubung ke TriPay.'));
        } finally {
            setTestingTripay(false);
        }
    };

    const toggleManualPayment = async (v) => {
        set('payment_manual_enabled', v);
        await save(['payment_manual_enabled'], { payment_manual_enabled: v });
    };

    const toggleGatewayPayment = async (v) => {
        if (v && !meta.payment_gateway_configured) {
            toast.error('Lengkapi konfigurasi TriPay terlebih dahulu.');
            return;
        }
        set('payment_gateway_enabled', v);
        await save(['payment_gateway_enabled'], { payment_gateway_enabled: v });
    };

    const toggleGoogleAuth = async (v) => {
        if (v && !(form.google_client_id || '').trim()) {
            toast.error('Lengkapi konfigurasi Google (Client ID) terlebih dahulu.');
            return;
        }
        set('google_auth_enabled', v);
        await save(['google_auth_enabled'], { google_auth_enabled: v });
    };

    const toggleWebhookChannel = async (v) => {
        if (v && !webhookUrlsValid()) {
            toast.error('Tambahkan URL webhook yang valid terlebih dahulu.');
            return;
        }
        set('notif_webhook_enabled', v);
        await save(['notif_webhook_enabled', 'webhook_urls'], { notif_webhook_enabled: v });
    };

    const webhookUrlsValid = () => {
        try {
            return (form.webhook_urls || '').split(/[\r\n,]+/).map((s) => s.trim()).filter(Boolean).length > 0;
        } catch {
            return false;
        }
    };

    const testWebhook = async () => {
        setTestingWebhook(true);
        try {
            const { data } = await api.post('/settings/test-webhook');
            toast.success(data.message || 'Webhook uji terkirim.');
        } catch (err) {
            toast.error(getApiErrorMessage(err, 'Gagal menguji webhook.'));
        } finally {
            setTestingWebhook(false);
        }
    };

    const ctx = {
        form, meta, errors, saving, set, setChecked, save, dirty, dirtyColor,
        openEmail, setOpenEmail, openWa, setOpenWa,
        openTripay, setOpenTripay, openGoogle, setOpenGoogle, openManual, setOpenManual,
        toggleEmailChannel, toggleWaChannel, toggleEvent,
        testEmail, testWhatsapp, testingEmail, testingWhatsapp,
        testGateway, testingTripay,
        toggleManualPayment, toggleGatewayPayment, toggleGoogleAuth,
        waDrivers, waDriver, waFields, waConfig, setWaDriver,
        mediaFor, setMediaFor,
        webhookConfigured: !!meta.webhook_configured,
        webhookEnabled: !!meta.webhook_enabled,
        toggleWebhookChannel, testWebhook, testingWebhook,
    };

    return (
        <>
            <PageHeader title="Pengaturan" subtitle="Branding, integrasi, login sosial, webhook, notifikasi, keamanan, dan pemeliharaan." />

            {loading ? (
                <Skeleton variant="form" />
            ) : (
            <>
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

            {tab === 'branding' && <BrandingTab {...ctx} />}
            {tab === 'integrasi' && <IntegrasiTab {...ctx} />}
            {tab === 'pembayaran' && <PaymentTab {...ctx} />}
            {tab === 'notifications' && <NotificationsTab {...ctx} />}
            {tab === 'security' && <SecurityTab {...ctx} />}
            {tab === 'maintenance' && <MaintenanceTab {...ctx} />}
            </>
            )}

            <MediaPicker
                open={!!mediaFor}
                onClose={() => setMediaFor(null)}
                onSelect={(sel) => {
                    if (mediaFor) set(mediaFor, pickValue(sel));
                }}
                title={mediaFor === 'site_logo' ? 'Pilih Logo' : 'Pilih Favicon'}
            />
        </>
    );
}