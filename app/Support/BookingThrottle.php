<?php

namespace App\Support;

use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

/**
 * Rate limiting on-demand untuk endpoint booking.
 *
 * Counter hanya naik setelah request berhasil lolos validasi (dipanggil di
 * controller setelah validate()), sehingga:
 *  - kegagalan validasi (422) tidak terhitung sebagai attempts;
 *  - satu POST valid = tepat satu attempt (termasuk booking yang sukses).
 *
 * Batasan (setting development-friendly, cocog produksi):
 *  - Per IP:    20 request / 10 menit  (burst protection untuk jaringan shared).
 *  - Per email: 10 attempt / jam, 30 / hari.
 */
class BookingThrottle
{
    public static function ipKey(?string $ip = null): string
    {
        return 'booking:ip:' . ($ip ?: request()->ip());
    }

    public static function emailHourKey(string $email): string
    {
        return 'booking:email:hour:' . Str::lower($email);
    }

    public static function emailDayKey(string $email): string
    {
        return 'booking:email:day:' . Str::lower($email);
    }

    /**
     * Apakah batas sudah terlewati? (tidak meningkatkan counter)
     */
    public static function exceeded(?string $email, ?string $ip = null): array
    {
        $email = Str::lower($email ?: 'anonymous');
        $reasons = [];

        if (RateLimiter::tooManyAttempts(static::ipKey($ip), 20)) {
            $reasons[] = 'burst';
        }
        if (RateLimiter::tooManyAttempts(static::emailHourKey($email), 10)) {
            $reasons[] = 'hourly';
        }
        if (RateLimiter::tooManyAttempts(static::emailDayKey($email), 30)) {
            $reasons[] = 'daily';
        }

        return $reasons;
    }

    /**
     * Catat satu attempt valid.
     */
    public static function record(?string $email, ?string $ip = null): void
    {
        $email = Str::lower($email ?: 'anonymous');
        RateLimiter::hit(static::ipKey($ip), 600);
        RateLimiter::hit(static::emailHourKey($email), 3600);
        RateLimiter::hit(static::emailDayKey($email), 86400);
    }
}
