<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

class RuntimeSettings
{
    private const CACHE_KEY = 'runtime_settings';

    public function all(): array
    {
        return Cache::remember(self::CACHE_KEY, 3600, function () {
            return Setting::pluck('value', 'key')->all();
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

        $urls = array_filter(array_map('trim', explode(',', $value)));

        return array_values($urls);
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
        return AssetResolver::resolveImageValue($this->get('site_logo') ?? '', AssetResolver::DEFAULT_LOGO_IMAGE);
    }

    public function siteFavicon(): string
    {
        return AssetResolver::resolveImageValue($this->get('site_favicon') ?? '', asset('favicon.svg'));
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

        return is_array($decoded) ? $decoded : ['password', 'otp', 'google', 'token'];
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
}
