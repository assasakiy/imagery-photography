<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\AlertMail;
use App\Models\Setting;
use App\Services\AuditLogger;
use App\Services\NotificationService;
use App\Services\RuntimeSettings;
use App\Services\WhatsApp\WhatsAppDriverRegistry;
use App\Services\WhatsApp\WhatsAppManager;
use App\Support\ContentSanitizer;
use App\Support\ApiThrottle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class SettingsController extends Controller
{
    private const MASK = '••••••••';
    public function index(RuntimeSettings $settings)
    {
        return response()->json([
            'site_name' => $settings->siteName(),
            'site_tagline' => $settings->siteTagline(),
            'site_description' => $settings->siteDescription(),
            'site_logo' => $settings->get('site_logo'),
            'site_favicon' => $settings->get('site_favicon'),
            'site_logo_url' => $settings->siteLogo(),
            'site_favicon_url' => $settings->siteFavicon(),
            'timezone' => $settings->timezone(),
            'mail_host' => $settings->get('mail_host'),
            'mail_port' => $settings->get('mail_port'),
            'mail_username' => $settings->get('mail_username'),
            'mail_password' => $settings->get('mail_password') ? '••••••••' : null,
            'mail_from_address' => $settings->get('mail_from_address'),
            'mail_from_name' => $settings->get('mail_from_name'),
            'mail_enabled' => $settings->mailEnabled(),
            'whatsapp_drivers' => app(WhatsAppDriverRegistry::class)->all(),
            'whatsapp_config' => $this->maskedWhatsAppConfig(),
            'webhook_urls' => $settings->get('webhook_urls'),
            'env_mail_configured' => !empty(env('MAIL_HOST')),
            'brand_color' => $settings->brandColor(),
            'google_auth_enabled' => $settings->googleAuthEnabled(),
            'google_client_id' => $settings->get('google_client_id'),
            'google_client_secret' => $settings->get('google_client_secret') ? '••••••••' : null,
            'google_redirect_url' => $settings->googleRedirectUrl(),
            'login_attempts_max' => $settings->loginAttemptsMax(),
            'login_attempts_lockout_minutes' => $settings->loginAttemptsLockoutMinutes(),
            'login_remember_enabled' => $settings->loginRememberEnabled(),
            'login_remember_days' => $settings->loginRememberDays(),
            'login_methods_global' => $this->loginMethodsPayload($settings),
            'file_retention_days' => (int) $settings->get('file_retention_days', 0),
            'invite_expiry_hours' => $settings->inviteExpiryHours(),
            'maintenance_enabled' => $settings->maintenanceEnabled(),
            'maintenance_message' => $settings->maintenanceMessage(),
            'analytics_enabled' => $settings->analyticsEnabled(),
            'cookie_banner_enabled' => $settings->cookieBannerEnabled(),
            'cookie_banner_message' => $settings->cookieBannerMessage(),
            'email_configured' => $settings->emailConfigured(),
            'whatsapp_configured' => $settings->whatsappConfigured(),
            'email_enabled' => $settings->channelEnabled('email'),
            'whatsapp_enabled' => $settings->channelEnabled('whatsapp'),
            'email_available' => $settings->channelAvailable('email'),
            'whatsapp_available' => $settings->channelAvailable('whatsapp'),
            'webhook_configured' => count($settings->webhookUrls()) > 0,
            'webhook_enabled' => $settings->channelEnabled('webhook'),
            'email_events' => app(NotificationService::class)->channelEvents('email'),
            'whatsapp_events' => app(NotificationService::class)->channelEvents('whatsapp'),
            'inapp_events' => app(NotificationService::class)->channelEvents('inapp'),
            'payment_manual_enabled' => $settings->paymentManualEnabled(),
            'payment_gateway_enabled' => $settings->paymentGatewayEnabled(),
            'payment_gateway_configured' => $settings->paymentGatewayConfigured(),
            'payment_manual_accounts' => $settings->paymentManualAccounts(),
            'payment_active_manuals' => $settings->paymentActiveManuals(),
            'payment_active_qris' => $settings->paymentActiveQris(),
            'payment_active_channels' => $settings->paymentActiveChannels(),
            'payment_tripay_config' => $this->maskedTripayConfig(),
            'rate_limits' => $this->rateLimitsPayload(),
        ]);
    }

    private function rateLimitsPayload(): array
    {
        $cfg = config('rate_limit.policies', []);
        $overrides = app(RuntimeSettings::class)->get('rate_limits');
        $overrides = $overrides ? json_decode($overrides, true) : [];
        $result = [];

        foreach ($cfg as $key => $default) {
            $result[$key] = [
                'limit' => $overrides[$key]['limit'] ?? $default['limit'],
                'period' => $overrides[$key]['period'] ?? $default['periode'],
                'scope' => $default['scope'] ?? 'ip',
                'min' => $default['floor'] ?? 1,
                'max' => $default['ceiling'] ?? 100,
                'enabled' => $overrides[$key]['enabled'] ?? $default['enabled'] ?? true,
            ];
            // clamp
            $result[$key]['limit'] = max($result[$key]['min'], min($result[$key]['limit'], $result[$key]['max']));
        }

        return $result;
    }

    private function maskedTripayConfig(): array
    {
        $cfg = app(RuntimeSettings::class)->paymentTripayConfig();
        return [
            'mode' => $cfg['mode'] ?? 'sandbox',
            'api_key' => !empty($cfg['api_key']) ? self::MASK : '',
            'private_key' => !empty($cfg['private_key']) ? self::MASK : '',
            'merchant_code' => $cfg['merchant_code'] ?? '',
        ];
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'site_name' => 'nullable|string|max:255',
            'site_tagline' => 'nullable|string|max:500',
            'site_description' => 'nullable|string',
            'site_logo' => 'nullable|string|max:1000',
            'site_favicon' => 'nullable|string|max:1000',
            'timezone' => 'nullable|string|timezone',
            'mail_host' => 'nullable|string|max:255',
            'mail_port' => 'nullable|integer|between:1,65535',
            'mail_username' => 'nullable|string|max:255',
            'mail_password' => 'nullable|string|max:255',
            'mail_from_address' => 'nullable|email|max:255',
            'mail_from_name' => 'nullable|string|max:255',
            'whatsapp_config' => 'nullable|array',
            'whatsapp_config.driver' => ['nullable', 'string', Rule::in(array_keys(WhatsAppDriverRegistry::CLASSES))],
            'whatsapp_config.config' => 'nullable|array',
            'webhook_urls' => ['nullable', 'string', 'max:8192', function ($attribute, $value, $fail) {
                if (empty($value)) {
                    return;
                }
                $rt = app(RuntimeSettings::class);
                foreach (preg_split('/[\r\n,]+/', $value) ?: [] as $line) {
                    $line = trim($line);
                    if ($line === '') {
                        continue;
                    }
                    if (!$rt->isSafeWebhookUrl($line)) {
                        $fail('Terdapat URL webhook yang tidak valid: ' . $line);
                    }
                }
            }],
            'notif_webhook_enabled' => 'boolean',
            'brand_color' => 'nullable|string|regex:/^#[0-9a-fA-F]{6}$/',
            'google_auth_enabled' => 'boolean',
            'google_client_id' => 'nullable|string|max:255',
            'google_client_secret' => 'nullable|string|max:255',
            'google_redirect_url' => 'nullable|url|max:2048',
            'login_attempts_max' => 'nullable|integer|min:1|max:20',
            'login_attempts_lockout_minutes' => 'nullable|integer|min:1|max:1440',
            'login_remember_enabled' => 'boolean',
            'login_remember_days' => 'nullable|integer|min:1|max:3650',
            'login_methods_global' => 'nullable|array',
            'login_methods_global.*' => 'nullable|boolean',
            'file_retention_days' => 'nullable|integer|min:0|max:3650',
            'invite_expiry_hours' => 'nullable|integer|in:6,12,24,48,72',
            'preview_expiry_days' => 'nullable|integer|min:1|max:365',
            'archive_delay_days' => 'nullable|integer|min:0|max:365',
            'maintenance_enabled' => 'boolean',
            'maintenance_message' => 'nullable|string',
            'analytics_enabled' => 'boolean',
            'cookie_banner_enabled' => 'boolean',
            'cookie_banner_message' => 'nullable|string|max:2000',
            'notif_email_enabled' => 'boolean',
            'notif_wa_enabled' => 'boolean',
            'email_events' => 'nullable|array',
            'email_events.*.key' => ['nullable', 'string', Rule::in(NotificationService::CHANNEL_EVENTS['email'])],
            'email_events.*.enabled' => 'nullable|boolean',
            'whatsapp_events' => 'nullable|array',
            'whatsapp_events.*.key' => ['nullable', 'string', Rule::in(NotificationService::CHANNEL_EVENTS['whatsapp'])],
            'whatsapp_events.*.enabled' => 'nullable|boolean',
            'inapp_events' => 'nullable|array',
            'inapp_events.*.key' => ['nullable', 'string', Rule::in(NotificationService::CHANNEL_EVENTS['inapp'])],
            'inapp_events.*.enabled' => 'nullable|boolean',
            'notification_events' => 'nullable|array',
            'notification_events.*.key' => ['nullable', 'string', Rule::in(array_keys(NotificationService::EVENTS))],
            'notification_events.*.enabled' => 'nullable|boolean',
            'payment_manual_enabled' => 'boolean',
            'payment_gateway_enabled' => 'boolean',
            'payment_manual_accounts' => 'nullable|array',
            'payment_active_manuals' => 'nullable|array',
            'payment_active_qris' => 'nullable|string',
            'payment_active_channels' => 'nullable|array',
            'payment_tripay_config' => 'nullable|array',
            'rate_limits' => 'nullable|array',
            'rate_limits.*.limit' => 'nullable|integer|min:1',
            'rate_limits.*.period' => 'nullable|integer|min:10',
            'rate_limits.*.enabled' => 'nullable|boolean',
        ]);

        $masked = ['mail_password', 'whatsapp_token', 'google_client_secret'];

        foreach ($data as $key => $value) {
            if (in_array($key, $masked, true) && $value === self::MASK) {
                continue;
            }

            if ($key === 'whatsapp_config') {
                $this->saveWhatsAppConfig($value ?? []);
                continue;
            }

            if ($key === 'email_events' || $key === 'whatsapp_events' || $key === 'inapp_events') {
                $channel = match ($key) {
                    'email_events' => 'email',
                    'whatsapp_events' => 'whatsapp',
                    default => 'inapp',
                };
                $this->saveChannelEvents($channel, $value ?? []);
                continue;
            }

            if ($key === 'notif_email_enabled' || $key === 'notif_wa_enabled' || $key === 'notif_webhook_enabled') {
                $channel = match ($key) {
                    'notif_wa_enabled' => 'whatsapp',
                    'notif_webhook_enabled' => 'webhook',
                    default => 'email',
                };
                $enabled = (bool) $value;

                // Guard: jangan izinkan ON bila transport tak terkonfigurasi.
                if ($enabled) {
                    $rt = app(RuntimeSettings::class);
                    $configured = match ($channel) {
                        'email' => $rt->emailConfigured(),
                        'whatsapp' => $rt->whatsappConfigured(),
                        'webhook' => count($rt->webhookUrls()) > 0,
                        default => false,
                    };
                    if (!$configured) {
                        $enabled = false;
                    }
                }

                Setting::setValue('notif_' . $channel . '_enabled', $enabled ? '1' : '0');
                continue;
            }

            if ($key === 'notification_events') {
                foreach ($value ?? [] as $event) {
                    if (empty($event['key']) || in_array($event['key'], NotificationService::MANDATORY_EVENTS, true)) {
                        continue;
                    }
                    Setting::setValue('notif_event_' . str_replace('.', '_', $event['key']), $event['enabled'] ? '1' : '0');
                }
                continue;
            }

            if ($key === 'site_description' || $key === 'maintenance_message') {
                $value = ContentSanitizer::clean((string) $value);
            }

            if ($key === 'login_methods_global') {
                Setting::setValue('login_methods_global', json_encode($value ?? []));
                continue;
            }

            if (in_array($key, ['payment_manual_accounts', 'payment_active_manuals', 'payment_active_channels'])) {
                Setting::setValue($key, json_encode($value ?? []));
                continue;
            }

            if ($key === 'rate_limits') {
                $defaults = config('rate_limit.policies', []);
                $clamped = [];
                foreach ($value as $k => $v) {
                    if (!isset($defaults[$k])) continue;
                    $floor = $defaults[$k]['floor'] ?? 1;
                    $ceiling = $defaults[$k]['ceiling'] ?? 100;
                    $clamped[$k] = [
                        'limit' => max($floor, min((int) ($v['limit'] ?? $defaults[$k]['limit']), $ceiling)),
                        'period' => max(10, (int) ($v['period'] ?? $defaults[$k]['periode'])),
                        'enabled' => isset($v['enabled']) ? (bool) $v['enabled'] : ($defaults[$k]['enabled'] ?? true),
                    ];
                }
                Setting::setValue('rate_limits', json_encode($clamped));
                continue;
            }

            if ($key === 'payment_tripay_config') {
                $current = app(RuntimeSettings::class)->paymentTripayConfig();
                $incoming = $value ?? [];
                
                if (($incoming['api_key'] ?? '') === self::MASK) {
                    $incoming['api_key'] = $current['api_key'] ?? '';
                }
                if (($incoming['private_key'] ?? '') === self::MASK) {
                    $incoming['private_key'] = $current['private_key'] ?? '';
                }
                
                Setting::setValue('payment_tripay_config', json_encode($incoming));
                continue;
            }

            Setting::setValue($key, (string) $value);
        }

        app(RuntimeSettings::class)->forget();

        app(AuditLogger::class)->log('settings.updated', 'Pengaturan diperbarui: ' . implode(', ', array_keys($data)));

        return response()->json(['ok' => true]);
    }

    /**
     * WhatsApp config untuk dashboard: password fields diganti placeholder
     * agar nilai asli tidak pernah bocor ke frontend.
     */
    private function maskedWhatsAppConfig(): array
    {
        $cfg = app(RuntimeSettings::class)->whatsappConfig();
        $fields = app(WhatsAppDriverRegistry::class)->fields($cfg['driver'] ?? '');
        $values = $cfg['config'] ?? [];

        $masked = [];

        foreach ($fields as $field) {
            $key = $field['key'];
            $value = $values[$key] ?? '';

            $masked[$key] = $value !== '' && ($field['type'] ?? '') === 'password' ? self::MASK : (string) $value;
        }

        return ['driver' => $cfg['driver'] ?? '', 'config' => $masked];
    }

    private function saveWhatsAppConfig(array $payload): void
    {
        $driver = (string) ($payload['driver'] ?? '');
        $incoming = $payload['config'] ?? [];

        if ($driver === '' || !app(WhatsAppDriverRegistry::class)->has($driver)) {
            return;
        }

        $current = app(RuntimeSettings::class)->whatsappConfig();
        $currentConfig = ($current['driver'] ?? '') === $driver ? ($current['config'] ?? []) : [];

        foreach (app(WhatsAppDriverRegistry::class)->fields($driver) as $field) {
            $key = $field['key'];

            if (!array_key_exists($key, $incoming)) {
                continue;
            }

            if (($field['type'] ?? '') === 'password' && $incoming[$key] === self::MASK) {
                $incoming[$key] = $currentConfig[$key] ?? '';
            }
        }

        Setting::setValue('whatsapp_config', json_encode([
            'driver' => $driver,
            'config' => $incoming,
        ]));
    }

    private function saveChannelEvents(string $channel, array $events): void
    {
        foreach ($events as $event) {
            if (empty($event['key'])) {
                continue;
            }

            if (in_array($event['key'], NotificationService::MANDATORY_EVENTS, true)) {
                continue;
            }

            Setting::setValue(
                'notif_' . $channel . '_event_' . str_replace('.', '_', $event['key']),
                $event['enabled'] ? '1' : '0'
            );
        }
    }

    public function testEmail(Request $request)
    {
        $user = $request->user();
        $settings = app(RuntimeSettings::class);

        if (!$settings->emailConfigured()) {
            return response()->json(['message' => 'SMTP belum dikonfigurasi.'], 422);
        }

        if (empty($user->email)) {
            return response()->json(['message' => 'Email akun Anda belum diisi.'], 422);
        }

        try {
            app(NotificationService::class)->email(
                new AlertMail(
                    $user->name,
                    'Email Uji — Sopian Lalu Imagery',
                    "Ini adalah email uji koneksi SMTP dari dashboard. Terkirim pada " . now()->format('d/m/Y H:i:s') . '.'
                ),
                $user->email,
                null
            );

            app(AuditLogger::class)->log('settings.test_email', 'Tes koneksi SMTP dikirim ke ' . $user->email);

            return response()->json(['ok' => true, 'message' => 'Email uji terkirim ke ' . $user->email]);
        } catch (\Throwable $e) {
            Log::error('test email failed', ['error' => $e->getMessage()]);

            return response()->json(['message' => 'Gagal mengirim email uji: ' . $e->getMessage()], 422);
        }
    }

    public function testWhatsapp(Request $request)
    {
        $user = $request->user();
        $settings = app(RuntimeSettings::class);

        if (!$settings->whatsappConfigured()) {
            return response()->json(['message' => 'WhatsApp belum dikonfigurasi.'], 422);
        }

        $phone = $user->phone;

        if (empty($phone)) {
            return response()->json(['message' => 'Nomor ponsel Anda belum diisi di profil.'], 422);
        }

        try {
            $result = app(WhatsAppManager::class)->send(
                $phone,
                "Ini adalah pesan uji koneksi WhatsApp dari dashboard Sopian Lalu Imagery. Terkirim pada " . now()->format('d/m/Y H:i:s') . '.'
            );

            if (!$result->success) {
                Log::warning('test whatsapp failed', ['phone' => $phone, 'message' => $result->message, 'raw' => $result->raw]);

                return response()->json(['message' => 'Gagal mengirim WhatsApp uji: ' . $result->message], 422);
            }

            app(AuditLogger::class)->log('settings.test_whatsapp', 'Tes koneksi WhatsApp terkirim ke ' . $phone . ' via ' . $result->provider);

            return response()->json(['ok' => true, 'message' => 'WhatsApp uji terkirim ke ' . $phone]);
        } catch (\Throwable $e) {
            Log::error('test whatsapp failed', ['error' => $e->getMessage()]);

            return response()->json(['message' => 'Gagal mengirim WhatsApp uji: ' . $e->getMessage()], 422);
        }
    }

    public function testWebhook()
    {
        $settings = app(RuntimeSettings::class);
        $urls = $settings->webhookUrls();

        if (count($urls) === 0) {
            return response()->json(['message' => 'Belum ada URL webhook yang valid.'], 422);
        }

        $sent = app(\App\Services\WebhookDispatcher::class)->dispatch('test', ['note' => 'Tes koneksi webhook dari dashboard.', 'time' => now()->toIso8601String()]);

        if ($sent < count($urls)) {
            return response()->json(['message' => 'Ada URL yang gagal dihubungi. Cek log untuk detail.'], 422);
        }

        app(AuditLogger::class)->log('settings.test_webhook', 'Tes koneksi webhook terkirim ke ' . $sent . ' URL');

        return response()->json(['ok' => true, 'message' => 'Webhook uji terkirim ke ' . $sent . ' URL']);
    }

    private function loginMethodsPayload(RuntimeSettings $settings): array
    {
        $active = $settings->globalLoginMethods();
        
        $hasChannel = $settings->channelAvailable('email') || $settings->channelAvailable('whatsapp');

        return [
            'password' => in_array('password', $active, true),
            'otp'      => $hasChannel && in_array('otp', $active, true),
            'google'   => in_array('google', $active, true),
            'token'    => $hasChannel && in_array('token', $active, true),
        ];
    }

    public function testPaymentGateway()
    {
        $client = app(\App\Services\TriPayClient::class);
        if (!$client->isConfigured()) {
            return response()->json(['message' => 'Kredensial belum lengkap.'], 422);
        }

        $channels = $client->paymentChannels();
        if (empty($channels)) {
            return response()->json(['message' => 'Koneksi gagal. Periksa API Key Anda.'], 422);
        }

        return response()->json(['message' => 'Koneksi sukses! Ditemukan ' . count($channels) . ' channel pembayaran.']);
    }
}
