<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class RuntimeSettings
{
    private const CACHE_KEY = 'runtime_settings';

    public function all(): array
    {
        return Cache::remember(self::CACHE_KEY, 3600, function () {
            try {
                return Setting::pluck('value', 'key')->all();
            } catch (\Illuminate\Database\QueryException $e) {
                $msg = $e->getMessage();
                if (str_contains($msg, 'doesn\'t exist') || str_contains($msg, 'no such table') || $e->getCode() === '42S02' || $e->getCode() === 'HY000') {
                    return [];
                }

                throw $e;
            }
        });
    }

    public function get(string $key, ?string $default = null): ?string
    {
        $settings = $this->all();

        return $settings[$key] ?? $default;
    }

    public function forget(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Resolve an SMTP/mail transport value: DB setting (dashboard) first,
     * then .env, then null. Empty/unset => null (email gracefully skipped).
     */
    public function mailHost(): ?string
    {
        $db = $this->get('mail_host');

        return !empty($db) ? $db : (env('MAIL_HOST') ?: null);
    }

    public function mailPort(): ?int
    {
        $db = $this->get('mail_port');

        return !empty($db) ? (int) $db : (env('MAIL_PORT') ? (int) env('MAIL_PORT') : null);
    }

    public function mailUsername(): ?string
    {
        $db = $this->get('mail_username');

        return !empty($db) ? $db : (env('MAIL_USERNAME') ?: null);
    }

    public function mailPassword(): ?string
    {
        $db = $this->get('mail_password');

        return !empty($db) ? $db : (env('MAIL_PASSWORD') ?: null);
    }

    public function mailFromAddress(): ?string
    {
        $db = $this->get('mail_from_address');

        return !empty($db) ? $db : (env('MAIL_FROM_ADDRESS') ?: null);
    }

    public function mailFromName(): ?string
    {
        $db = $this->get('mail_from_name');

        return !empty($db) ? $db : (env('MAIL_FROM_NAME') ?: 'Sopian Lalu Imagery');
    }

    /**
     * True when a working SMTP transport can be built (DB settings or env).
     */
    public function mailEnabled(): bool
    {
        return !empty($this->mailHost()) && !empty($this->mailPort());
    }

    public function whatsappDriver(): string
    {
        $cfg = $this->whatsappConfig();

        if (!empty($cfg['driver'])) {
            return $cfg['driver'];
        }

        $db = $this->get('whatsapp_driver');

        return !empty($db) ? $db : (env('WHATSAPP_DRIVER') ?: 'fonnte');
    }

    /**
     * Schema-driven WhatsApp config: { driver, config: { field: value, ... } }.
     * Falls back to legacy per-key settings (and .env) for backward compat.
     */
    public function whatsappConfig(): array
    {
        $raw = $this->get('whatsapp_config');

        if (!empty($raw)) {
            $decoded = json_decode((string) $raw, true);

            if (is_array($decoded) && isset($decoded['driver'])) {
                return $decoded;
            }
        }

        $driver = $this->get('whatsapp_driver') ?: (env('WHATSAPP_DRIVER') ?: 'fonnte');
        $legacy = [];

        switch ($driver) {
            case 'webhook':
            case 'custom':
                $legacy['base_url'] = $this->get('whatsapp_webhook_url') ?: env('WHATSAPP_WEBHOOK_URL');
                break;

            case 'meta':
            case 'meta_cloud_api':
                $legacy['access_token'] = $this->get('whatsapp_token') ?: env('WHATSAPP_TOKEN');
                $legacy['phone_number_id'] = $this->get('whatsapp_phone_number_id') ?: env('WHATSAPP_PHONE_NUMBER_ID');
                break;

            case 'fonnte':
            default:
                $legacy['api_token'] = $this->get('whatsapp_token') ?: env('WHATSAPP_TOKEN');
                break;
        }

        return ['driver' => $driver, 'config' => $legacy];
    }

    /**
     * True when a WhatsApp transport can actually be used (all required fields filled).
     */
    public function whatsappConfigured(): bool
    {
        if (app(\App\Services\WhatsApp\WhatsAppDriverRegistry::class)->isConfigured($this->whatsappConfig())) {
            return true;
        }

        return !empty(env('WHATSAPP_TOKEN')) || !empty(env('WHATSAPP_WEBHOOK_URL'));
    }

    /**
     * True when an email transport can actually be used.
     */
    public function emailConfigured(): bool
    {
        return $this->mailEnabled();
    }

    /**
     * Master on/off flag for a notification channel (email|whatsapp|inapp|webhook).
     */
    public function channelEnabled(string $channel): bool
    {
        return $this->get('notif_' . $channel . '_enabled', '1') !== '0';
    }

    /**
     * Whether a channel is available at all (configured AND master switch on).
     */
    public function channelAvailable(string $channel): bool
    {
        return match ($channel) {
            'email' => $this->emailConfigured() && $this->channelEnabled('email'),
            'whatsapp' => $this->whatsappConfigured() && $this->channelEnabled('whatsapp'),
            default => $this->channelEnabled($channel),
        };
    }

    public function webhookUrls(): array
    {
        $value = $this->get('webhook_urls');

        if (empty($value)) {
            return [];
        }

        // Dipisah per baris atau koma (mendukung teksarea UI & nilai lama).
        $raw = preg_split('/[\r\n,]+/', $value) ?: [];

        $urls = [];

        foreach ($raw as $candidate) {
            $candidate = trim($candidate);

            if ($candidate === '' || !$this->isSafeWebhookUrl($candidate)) {
                Log::warning('Webhook URL ditolak karena tidak lolos validasi keamanan: ' . $candidate);
                continue;
            }

            $urls[] = $candidate;
        }

        return array_values($urls);
    }

    /**
     * Anti-SSRF: hanya http/https, dan menolak host/IP privat, loopback,
     * link-local, serta alamat reserved (termasuk hasil resolve DNS).
     * Catatan: gethostbyname hanya menangani rekaman IPv4; target IPv6-only
     * internal tidak ter-resolve di sini (bukan risiko karena koneksi akan gagal).
     */
    public function isSafeWebhookUrl(string $url): bool
    {
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }

        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
        if (!in_array($scheme, ['http', 'https'], true)) {
            return false;
        }

        $host = (string) parse_url($url, PHP_URL_HOST);
        if ($host === '') {
            return false;
        }

        // Strip bracket IPv6 literal (http://[::1]/).
        $host = trim($host, '[]');

        if (strcasecmp($host, 'localhost') === 0 || str_ends_with(strtolower($host), '.localhost')) {
            return false;
        }

        if (filter_var($host, FILTER_VALIDATE_IP)) {
            return $this->isPublicIp($host);
        }

        // Resolve DNS ke IP publik saja.
        $resolved = gethostbyname($host);
        if ($resolved !== $host) {
            return $this->isPublicIp($resolved);
        }

        return true;
    }

    private function isPublicIp(string $ip): bool
    {
        return filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE | FILTER_FLAG_IPV4
        ) !== false;
    }

    public function brandColor(): string
    {
        $db = $this->get('brand_color');

        return !empty($db) ? $db : '#7c3aed';
    }

    public function googleAuthEnabled(): bool
    {
        return $this->get('google_auth_enabled') === '1';
    }

    public function googleClientId(): ?string
    {
        $db = $this->get('google_client_id');

        return !empty($db) ? $db : null;
    }

    public function googleClientSecret(): ?string
    {
        $db = $this->get('google_client_secret');

        return !empty($db) ? $db : null;
    }

    public function googleRedirectUrl(): ?string
    {
        $db = $this->get('google_redirect_url');

        return !empty($db) ? $db : url('/auth/google/callback');
    }

    public function siteName(): string
    {
        return $this->get('site_name') ?: 'Sopian Lalu Imagery';
    }

    /**
     * Timezone bisnis global (untuk jadwal acara & tampilan waktu).
     * 3 lapis: DB setting → .env APP_BUSINESS_TIMEZONE → default Asia/Makassar.
     */
    public function timezone(): string
    {
        $db = $this->get('timezone');

        return !empty($db) ? $db : (config('app.business_timezone') ?: 'Asia/Makassar');
    }

    public function inviteExpiryHours(): int
    {
        $hours = (int) $this->get('invite_expiry_hours', '24');
        return in_array($hours, [6, 12, 24, 48, 72], true) ? $hours : 24;
    }

    public function previewExpiryDays(): int
    {
        return (int) $this->get('preview_expiry_days', '30');
    }

    public function archiveDelayDays(): int
    {
        return (int) $this->get('archive_delay_days', '60');
    }

    public function siteTagline(): ?string
    {
        return $this->get('site_tagline') ?: null;
    }

    public function siteDescription(): ?string
    {
        return $this->get('site_description') ?: null;
    }

    public function siteLogo(): string
    {
        return AssetResolver::resolveImageValue($this->get('site_logo') ?? '', AssetResolver::DEFAULT_LOGO_IMAGE, 'thumbnail');
    }

    public function siteFavicon(): string
    {
        return AssetResolver::resolveImageValue($this->get('site_favicon') ?? '', asset('favicon.svg'), 'thumbnail');
    }

    public function loginAttemptsMax(): int
    {
        return max(1, (int) $this->get('login_attempts_max', '5'));
    }

    public function loginAttemptsLockoutMinutes(): int
    {
        return max(1, (int) $this->get('login_attempts_lockout_minutes', '15'));
    }

    public function loginRememberEnabled(): bool
    {
        return $this->get('login_remember_enabled') === '1';
    }

    public function globalLoginMethods(): array
    {
        $raw = $this->get('login_methods_global');

        if (!$raw) {
            return ['password', 'otp', 'google', 'token'];
        }

        $decoded = json_decode($raw, true);

        // Normalisasi: kembalikan DAFTAR nama method yang aktif (keys),
        // bukan objek {method: boolean}. Hal ini memperbaiki data-shape
        // mismatch di User::canUseLoginMethod() yang menggunakan in_array()
        // yang memeriksa *values* (boolean) bukan *keys* (string).
        if (is_array($decoded)) {
            return array_keys(array_filter($decoded, fn ($v) => $v === true));
        }

        return ['password', 'otp', 'google', 'token'];
    }

    public function loginMethodEnabled(string $method): bool
    {
        return in_array($method, $this->globalLoginMethods(), true);
    }

    public function otpChannelsAvailable(): array
    {
        $channels = [];

        if ($this->whatsappConfigured()) {
            $channels[] = 'whatsapp';
        }

        if ($this->emailConfigured()) {
            $channels[] = 'email';
        }

        return $channels;
    }

    public function loginRememberDays(): int
    {
        return max(1, (int) $this->get('login_remember_days', '30'));
    }

    public function maintenanceEnabled(): bool
    {
        return $this->get('maintenance_enabled') === '1';
    }

    public function maintenanceMessage(): ?string
    {
        return $this->get('maintenance_message') ?: null;
    }

    public function analyticsEnabled(): bool
    {
        return $this->get('analytics_enabled', '1') === '1';
    }

    public function cookieBannerEnabled(): bool
    {
        return $this->get('cookie_banner_enabled', '1') === '1';
    }

    public function cookieBannerMessage(): string
    {
        return $this->get('cookie_banner_message') ?: 'Kami menggunakan cookie untuk memastikan situs berfungsi dengan baik serta menganalisis kunjungan untuk meningkatkan pengalaman Anda. Cookie analitik hanya aktif jika Anda mengizinkan.';
    }

    public function paymentManualEnabled(): bool
    {
        return $this->get('payment_manual_enabled', '1') === '1';
    }

    public function paymentGatewayEnabled(): bool
    {
        return $this->get('payment_gateway_enabled', '0') === '1';
    }

    public function paymentManualAccounts(): array
    {
        $raw = $this->get('payment_manual_accounts');
        if ($raw) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) return $decoded;
        }

        return [];
    }

    public function paymentActiveManuals(): array
    {
        $raw = $this->get('payment_active_manuals');
        if ($raw) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) return $decoded;
        }
        return [];
    }

    public function paymentActiveQris(): string
    {
        return $this->get('payment_active_qris') ?: '';
    }

    public function paymentActiveChannels(): array
    {
        $raw = $this->get('payment_active_channels');
        if ($raw) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) return $decoded;
        }
        return [];
    }

    public function paymentTripayConfig(): array
    {
        $raw = $this->get('payment_tripay_config');
        if ($raw) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) return $decoded;
        }
        return ['api_key' => '', 'private_key' => '', 'merchant_code' => '', 'mode' => 'sandbox'];
    }

    public function paymentGatewayConfigured(): bool
    {
        $config = $this->paymentTripayConfig();
        return !empty($config['api_key']) && !empty($config['private_key']) && !empty($config['merchant_code']);
    }
}
