<?php

namespace App\Support;

use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

/**
 * ApiThrottle — manajemen kebijakan rate limit pusat.
 *
 * Lihat config/apithrottle.php untuk dokumentasi penuh (floor/ceiling, mode, scope).
 *
 * Penggunaan umum:
 *
 *   // mode attempt/request (OTP, login, upload, dll):
 *   if (ApiThrottle::exceeded('otp.send', $email)) return $this->tooManyAttemptsResponse(...);
 *   // → counter sudah naik otomatis (atomic di dalam exceeded())
 *
 *   // mode valid (booking): cek di middleware, record manual di controller
 *   if (ApiThrottle::exceeded('booking.create', $email)) ...   // cek only, tidak naik
 *   ... proses valid ...
 *   ApiThrottle::record('booking.create', $email);              // naik di sini
 *
 *   // reset on success (login/OTP verify)
 *   ApiThrottle::reset('auth.login', $email);
 */
class ApiThrottle
{
    public static function config(string $policy): ?array
    {
        $policies = config('rate_limit.policies');
        $default = $policies[$policy] ?? null;
        if (!$default) return null;

        $overrides = app(\App\Services\RuntimeSettings::class)->get('rate_limits');
        $overrides = $overrides ? json_decode($overrides, true) : [];
        $override = $overrides[$policy] ?? [];

        // login_attempts_max + login_attempts_lockout_minutes bridge ke auth.login
        if ($policy === 'auth.login') {
            $settings = app(\App\Services\RuntimeSettings::class);
            $override['limit'] = $override['limit'] ?? $settings->loginAttemptsMax();
            $override['period'] = $override['period'] ?? ($settings->loginAttemptsLockoutMinutes() * 60);
        }

        return [
            'limit' => $override['limit'] ?? $default['limit'],
            'periode' => $override['period'] ?? $default['periode'],
            'enabled' => $override['enabled'] ?? ($default['enabled'] ?? true),
            'scope' => $default['scope'] ?? 'ip',
            'floor' => $default['floor'] ?? 1,
            'ceiling' => $default['ceiling'] ?? 100,
            'mode' => $default['mode'] ?? 'attempt',
        ];
    }

    /**
     * Composite cache key berdasarkan scope + identifier yang diberikan caller.
     */
    public static function key(string $policy, array $identifiers = []): string
    {
        $parts = [static::scopeKey(static::config($policy)['scope'] ?? 'ip', $identifiers)];
        return 'apithrottle:' . $policy . ':' . sha1(implode('|', $parts));
    }

    protected static function scopeKey(string $scope, array $identifiers): string
    {
        $ip = request()->ip();

        return match ($scope) {
            'ip'               => $ip ?? '0.0.0.0',
            'user'             => 'u:' . ($identifiers['user'] ?? auth()->id() ?? 'guest'),
            'email'            => 'e:' . strtolower(trim($identifiers['email'] ?? $identifiers['identifier'] ?? 'anonymous')),
            'ip+identifier'    => 'ip:' . $ip . '|id:' . strtolower(trim($identifiers['identifier'] ?? $identifiers['email'] ?? 'anonymous')),
            'ip+account'       => 'ip:' . $ip . '|a:' . strtolower(trim($identifiers['account'] ?? $identifiers['email'] ?? 'anonymous')),
            default             => $ip ?? '0.0.0.0',
        };
    }

    /**
     * Nilai limit (int) untuk sebuah policy — sudah clamped ke [floor, ceiling].
     * Dipakai baik middleware maupun admin UI.
     */
    public static function effectiveLimit(string $policy): int
    {
        $policies = config('rate_limit.policies');
        $cfg = $policies[$policy] ?? null;
        if (!$cfg) {
            return 1;
        }
        $raw = $cfg['limit'] ?? 1;

        // Ambil override dari DB (RuntimeSettings) jika ada
        $overrides = app(\App\Services\RuntimeSettings::class)->get('rate_limits');
        $overrides = $overrides ? json_decode($overrides, true) : [];
        $override = $overrides[$policy] ?? [];

        if (!empty($override['limit'])) {
            $raw = $override['limit'];
        } elseif ($policy === 'auth.login') {
            $raw = app(\App\Services\RuntimeSettings::class)->loginAttemptsMax();
        }

        $floor = $cfg['floor'] ?? 1;
        $ceiling = $cfg['ceiling'] ?? 100;

        return (int) max($floor, min((int) $raw, $ceiling));
    }

    /**
     * Cek apakah masih boleh request. Untuk mode attempt/request → atomic,
     * otomatis naikkan counter bila lolos. Untuk mode valid → cek only.
     *
     * @param  array  $identifiers  e.g. ['email' => $email] atau ['identifier' => $phone]
     */
    public static function exceeded(string $policy, array $identifiers = []): bool
    {
        $cfg = static::config($policy);

        if (!$cfg || empty($cfg['enabled'] ?? true)) {
            return false;
        }

        $limit = static::effectiveLimit($policy);
        $key = static::key($policy, $identifiers);
        $mode = $cfg['mode'] ?? 'attempt';

        // lapisan IP (secondary) — selalu request-level, untuk semua policy
        // agar mode 'valid' yang forgiving tak bisa dibom "almost-valid".
        if (static::checkIpGuard()) {
            return true;
        }

        if ($mode === 'valid') {
            // cek only, tidak naik counter di sini; controller panggil record().
            return RateLimiter::tooManyAttempts($key, $limit);
        }

        // mode attempt/request: atomic check + hit via attempt().
        // attempt() return false bila kelebihan (tidak hit);
        // hit otomatis & atomic bila lolos.
        return !RateLimiter::attempt($key, $limit, fn () => true, $cfg['periode']);
    }

    /**
     * Naikkan counter secara manual (untuk mode valid — panggil di controller
     * setelah validasi sukses).
     */
    public static function record(string $policy, array $identifiers = []): void
    {
        $cfg = static::config($policy);
        if (!$cfg || empty($cfg['enabled'] ?? true)) {
            return;
        }
        $key = static::key($policy, $identifiers);
        RateLimiter::hit($key, $cfg['periode']);
    }

    /**
     * Reset counter (untuk reset_on_success — login/OTP verify sukses).
     */
    public static function reset(string $policy, array $identifiers = []): void
    {
        $cfg = static::config($policy);
        if (!$cfg) {
            return;
        }
        $key = static::key($policy, $identifiers);
        RateLimiter::clear($key);
    }

    public static function retryAfter(string $policy, array $identifiers = []): int
    {
        $cfg = static::config($policy);
        if (!$cfg) {
            return 0;
        }
        $key = static::key($policy, $identifiers);
        return (int) RateLimiter::availableIn($key);
    }

    /**
     * Secondary IP-level guard — menangkap lapisan luar agar mode 'valid'
     * yang forgiving tidak bisa di-banjiri "almost-valid" payload. Atomic via attempt().
     */
    protected static function checkIpGuard(): bool
    {
        $cfg = config('rate_limit.ip_guard');
        if (!$cfg || empty($cfg['requests_per_minute'])) {
            return false;
        }
        $key = 'apithrottle:ipguard:' . (request()->ip() ?? '0.0.0.0');
        $limit = (int) $cfg['requests_per_minute'];
        // attempt() return false bila over limit (tidak hit); hit atomic bila lolos.
        return !RateLimiter::attempt($key, $limit, fn () => true, (int) $cfg['periode']);
    }
}
