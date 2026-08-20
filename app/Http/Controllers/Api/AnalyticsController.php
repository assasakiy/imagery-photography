<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CookieConsent;
use App\Services\AnalyticsService;
use App\Services\AuditLogger;
use App\Services\VisitTracker;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Cookie;

class AnalyticsController extends Controller
{
    public function __construct(private AnalyticsService $analytics)
    {
    }

    public function overview()
    {
        return response()->json($this->analytics->overview());
    }

    public function visits()
    {
        return response()->json($this->analytics->visits());
    }

    public function accounts()
    {
        return response()->json($this->analytics->accounts());
    }

    public function behavior()
    {
        return response()->json($this->analytics->behavior());
    }

    public function raw(Request $request)
    {
        return response()->json($this->analytics->rawVisits($request->integer('per_page', 25)));
    }

    public function rollup(Request $request)
    {
        $processed = app(VisitTracker::class)->rollup($request->input('date'));

        app(AuditLogger::class)->log('analytics.rollup', 'Rollup data kunjungan diproses: ' . $processed . ' baris');

        return response()->json(['ok' => true, 'processed' => $processed]);
    }

    /**
     * Simpan preferensi consent cookie (publik, tanpa login).
     * Juga set cookie consent di browser pengunjung.
     */
    public function consent(Request $request)
    {
        $data = $request->validate([
            'consent' => 'required|in:all,necessary',
        ]);

        $consent = $data['consent'];

        $sessionId = $request->cookie('visitor_session');
        if (!$sessionId) {
            $sessionId = Str::random(40);
        }

        CookieConsent::create([
            'session_id' => $sessionId,
            'consent' => $consent,
            'created_at' => now(),
        ]);

        $response = response()->json(['ok' => true, 'consent' => $consent]);

        $response->headers->setCookie(
            new Cookie('cookie_consent', $consent, now()->addYear(), '/', null, false, false, false, 'Lax')
        );

        return $response;
    }
}