<?php

namespace App\Services;

use App\Models\PageView;
use App\Models\PageViewDaily;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Mencatat kunjungan halaman publik. Tracking hanya berjalan bila:
 * 1. Fitur analitik diaktifkan (setting `analytics_enabled`).
 * 2. Pengunjung memberi consent penuh (cookie `cookie_consent` = all) — patuh UU PDP.
 * IP di-hash (SHA-256) agar privasi terjaga; session id dipakai utk unique visitor.
 */
class VisitTracker
{
    private const CONSENT_COOKIE = 'cookie_consent';
    private const SESSION_COOKIE = 'visitor_session';

    public function handle(Request $request): void
    {
        try {
            if (!app(RuntimeSettings::class)->analyticsEnabled()) {
                return;
            }

            if ($request->is('api/*') || $request->is('dashboard*') || $request->is('_debugbar*')) {
                return;
            }

            if ($request->method() !== 'GET') {
                return;
            }

            // Hanya track halaman HTML publik (bukan asset build).
            $path = $request->path();
            if (str_starts_with($path, 'build/') || str_starts_with($path, 'storage/') || str_starts_with($path, 'favicon')) {
                return;
            }

            // Wajib consent penuh (analytics) sebelum tracking.
            $consent = $request->cookie(self::CONSENT_COOKIE);
            if ($consent !== 'all') {
                return;
            }

            $ip = $request->ip();
            $ua = substr((string) $request->userAgent(), 0, 500);
            $device = $this->parseDevice($ua);
            $sessionId = $this->sessionId($request);
            $userId = $request->user()?->id;

            $path = $this->normalizePath($path);

            PageView::create([
                'session_id' => $sessionId,
                'path' => $path,
                'ip_hash' => $ip ? hash('sha256', $ip . '|' . config('app.key')) : null,
                'user_agent' => $ua,
                'device_type' => $device['device'],
                'os' => $device['os'],
                'browser' => $device['browser'],
                'referrer' => $this->normalizeReferrer($request->header('referer')),
                'user_id' => $userId,
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('VisitTracker gagal mencatat kunjungan: ' . $e->getMessage());
        }
    }

    /**
     * Session id konsisten per browser (1 bulan) utk menghitung unique visitors.
     * Tidak dipakai untuk identifikasi pribadi; hanya angka acak.
     */
    private function sessionId(Request $request): string
    {
        $existing = $request->cookie(self::SESSION_COOKIE);

        if ($existing && preg_match('/^[a-f0-9]{40}$/i', $existing)) {
            return $existing;
        }

        $id = Str::random(40);

        // Cookie diset pada response berikutnya (via middleware response callback).
        $request->attributes->set('visitor_session_cookie', $id);

        return $id;
    }

    public function applySessionCookie(Request $request, \Symfony\Component\HttpFoundation\Response $response): void
    {
        $id = $request->attributes->get('visitor_session_cookie');

        if (!$id) {
            return;
        }

        $response->headers->setCookie(
            new \Symfony\Component\HttpFoundation\Cookie(
                self::SESSION_COOKIE,
                $id,
                now()->addMonth(),
                '/',
                null,
                false,
                false,
                false,
                'Lax'
            )
        );
    }

    /**
     * Rollup agregat harian dari page_views ke page_view_daily.
     */
    public function rollup(?string $forDate = null): int
    {
        $date = $forDate ?: now()->toDateString();

        $rows = PageView::query()
            ->whereDate('created_at', $date)
            ->selectRaw('DATE(created_at) as d, path, COUNT(*) as views, COUNT(DISTINCT session_id) as uniques')
            ->groupBy('d', 'path')
            ->get();

        $total = 0;

        foreach ($rows as $row) {
            PageViewDaily::updateOrCreate(
                ['date' => $row->d, 'path' => $row->path],
                ['views_count' => $row->views, 'unique_visitors' => $row->uniques]
            );
            $total++;
        }

        return $total;
    }

    private function normalizePath(string $path): string
    {
        if ($path === '/') {
            return '/';
        }

        $trimmed = rtrim($path, '/');

        return $trimmed === '' ? '/' : '/' . $trimmed;
    }

    private function normalizeReferrer(?string $referrer): ?string
    {
        if (!$referrer) {
            return null;
        }

        try {
            $host = parse_url($referrer, PHP_URL_HOST);

            if (!$host) {
                return null;
            }

            if (in_array($host, ['127.0.0.1', 'localhost'], true)) {
                return $host;
            }

            $appHost = parse_url(config('app.url'), PHP_URL_HOST);

            return $host === $appHost ? null : $host;
        } catch (\Throwable) {
            return null;
        }
    }

    private function parseDevice(string $ua): array
    {
        $uaLower = strtolower($ua);

        if (str_contains($uaLower, 'mobile') || str_contains($uaLower, 'android') || str_contains($uaLower, 'iphone')) {
            $device = 'mobile';
        } elseif (str_contains($uaLower, 'tablet') || str_contains($uaLower, 'ipad')) {
            $device = 'tablet';
        } elseif (str_contains($uaLower, 'bot') || str_contains($uaLower, 'crawler') || str_contains($uaLower, 'spider')) {
            $device = 'bot';
        } else {
            $device = 'desktop';
        }

        $os = 'unknown';
        foreach ([
            'windows' => 'Windows',
            'mac os' => 'macOS',
            'android' => 'Android',
            'iphone os' => 'iOS',
            'ipad os' => 'iPadOS',
            'linux' => 'Linux',
            'ubuntu' => 'Ubuntu',
        ] as $needle => $label) {
            if (str_contains($uaLower, $needle)) {
                $os = $label;
                break;
            }
        }

        $browser = 'unknown';
        foreach ([
            'edg/' => 'Edge',
            'opr/' => 'Opera',
            'chrome/' => 'Chrome',
            'firefox/' => 'Firefox',
            'safari/' => 'Safari',
        ] as $needle => $label) {
            if (str_contains($uaLower, $needle)) {
                $browser = $label;
                break;
            }
        }

        return compact('device', 'os', 'browser');
    }
}