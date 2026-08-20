<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\CookieConsent;
use App\Models\HistoryEvent;
use App\Models\LoginHistory;
use App\Models\PageView;
use App\Models\PageViewDaily;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Agregasi data analitik untuk dashboard:
 * - Kunjungan: page_views / page_view_daily
 * - Akun: user, login_histories
 * - Perilaku: history_events, audit_logs
 */
class AnalyticsService
{
    public function overview(): array
    {
        $today = now()->toDateString();
        $yesterday = now()->subDay()->toDateString();
        $startOfMonth = now()->startOfMonth()->toDateString();
        $startOfWeek = now()->startOfWeek()->toDateString();

        $viewsTotal = PageView::count();
        $visitorsTotal = PageView::distinct('session_id')->count('session_id');
        $viewsToday = PageView::whereDate('created_at', $today)->count();
        $viewsYesterday = PageView::whereDate('created_at', $yesterday)->count();

        $visitorsToday = PageView::whereDate('created_at', $today)->distinct('session_id')->count('session_id');
        $visitorsYesterday = PageView::whereDate('created_at', $yesterday)->distinct('session_id')->count('session_id');

        $activeUsers = User::whereHas('loginHistories', fn ($q) => $q->where('status', 'success')->where('logged_in_at', '>=', now()->subDays(30)))->count();
        $totalUsers = User::count();

        $consents = CookieConsent::selectRaw('consent, COUNT(*) as total')
            ->groupBy('consent')
            ->pluck('total', 'consent');

        $consentTotal = $consents->sum();

        return [
            'views_total' => $viewsTotal,
            'views_today' => $viewsToday,
            'views_yesterday' => $viewsYesterday,
            'views_this_month' => PageView::where('created_at', '>=', $startOfMonth)->count(),
            'visitors_total' => $visitorsTotal,
            'visitors_today' => $visitorsToday,
            'visitors_yesterday' => $visitorsYesterday,
            'active_users' => $activeUsers,
            'total_users' => $totalUsers,
            'consents' => [
                'all' => (int) ($consents['all'] ?? 0),
                'necessary' => (int) ($consents['necessary'] ?? 0),
                'total' => $consentTotal,
                'acceptance_rate' => $consentTotal > 0 ? round(((int) ($consents['all'] ?? 0) / $consentTotal) * 100) : 0,
            ],
            'trend' => $this->viewsTrend(30),
        ];
    }

    /**
     * Tren harian page view (dan unique visitor) untuk N hari terakhir.
     */
    public function viewsTrend(int $days = 30): array
    {
        $start = now()->subDays($days - 1)->startOfDay();

        $rows = PageView::where('created_at', '>=', $start)
            ->selectRaw('DATE(created_at) as date, COUNT(*) as views, COUNT(DISTINCT session_id) as visitors')
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('views', 'date');

        $visitorRows = PageView::where('created_at', '>=', $start)
            ->selectRaw('DATE(created_at) as date, COUNT(DISTINCT session_id) as visitors')
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('visitors', 'date');

        $result = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $result[] = [
                'date' => $date,
                'label' => Carbon::parse($date)->format('d M'),
                'views' => (int) ($rows[$date] ?? 0),
                'visitors' => (int) ($visitorRows[$date] ?? 0),
            ];
        }

        return $result;
    }

    public function visits(): array
    {
        $limit = 10;

        $topPages = PageView::query()
            ->selectRaw('path, COUNT(*) as views, COUNT(DISTINCT session_id) as visitors')
            ->groupBy('path')
            ->orderByDesc('views')
            ->limit($limit)
            ->get();

        $totalViews = PageView::count();

        $topPages = $topPages->map(function ($row) use ($totalViews) {
            $row->share = $totalViews > 0 ? round(($row->views / $totalViews) * 100) : 0;

            return $row;
        });

        $referrers = PageView::whereNotNull('referrer')
            ->selectRaw('referrer, COUNT(*) as views')
            ->groupBy('referrer')
            ->orderByDesc('views')
            ->limit($limit)
            ->get();

        $devices = PageView::query()
            ->selectRaw('COALESCE(NULLIF(device_type, ""), "unknown") as device_type, COUNT(*) as total')
            ->groupBy('device_type')
            ->orderByDesc('total')
            ->get();

        $browsers = PageView::query()
            ->selectRaw('COALESCE(NULLIF(browser, ""), "unknown") as browser, COUNT(*) as total')
            ->groupBy('browser')
            ->orderByDesc('total')
            ->limit(8)
            ->get();

        $os = PageView::query()
            ->selectRaw('COALESCE(NULLIF(os, ""), "unknown") as os, COUNT(*) as total')
            ->groupBy('os')
            ->orderByDesc('total')
            ->limit(8)
            ->get();

        return [
            'top_pages' => $topPages,
            'referrers' => $referrers,
            'devices' => $devices,
            'browsers' => $browsers,
            'os' => $os,
        ];
    }

    public function accounts(): array
    {
        $roleDist = DB::table('model_has_roles as mhr')
            ->join('roles as r', 'r.id', '=', 'mhr.role_id')
            ->selectRaw('r.name as role, COUNT(*) as total')
            ->groupBy('r.name')
            ->orderByDesc('total')
            ->get();

        $loginMethods = LoginHistory::where('status', 'success')
            ->selectRaw('method, COUNT(*) as total')
            ->groupBy('method')
            ->orderByDesc('total')
            ->get();

        $loginStatus = LoginHistory::selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->get();

        $registrations = $this->registrationsTrend(6);

        $activeToday = User::whereHas('loginHistories', fn ($q) => $q->where('status', 'success')->whereDate('logged_in_at', now()->toDateString()))->count();
        $activeWeek = User::whereHas('loginHistories', fn ($q) => $q->where('status', 'success')->where('logged_in_at', '>=', now()->subDays(7)))->count();
        $activeMonth = User::whereHas('loginHistories', fn ($q) => $q->where('status', 'success')->where('logged_in_at', '>=', now()->subDays(30)))->count();

        return [
            'role_distribution' => $roleDist,
            'login_methods' => $loginMethods,
            'login_status' => $loginStatus,
            'registrations' => $registrations,
            'active' => [
                'today' => $activeToday,
                'week' => $activeWeek,
                'month' => $activeMonth,
            ],
        ];
    }

    private function registrationsTrend(int $months = 6): array
    {
        $start = now()->subMonths($months - 1)->startOfMonth();

        $rows = User::where('created_at', '>=', $start)
            ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as total')
            ->groupBy('month')
            ->orderBy('month')
            ->pluck('total', 'month');

        $result = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $month = now()->subMonths($i)->format('Y-m');
            $result[] = [
                'month' => $month,
                'label' => now()->subMonths($i)->format('M'),
                'total' => (int) ($rows[$month] ?? 0),
            ];
        }

        return $result;
    }

    public function behavior(): array
    {
        $topActions = HistoryEvent::selectRaw('action, COUNT(*) as total')
            ->groupBy('action')
            ->orderByDesc('total')
            ->limit(15)
            ->get();

        $topAuditActions = AuditLog::selectRaw('action, COUNT(*) as total')
            ->groupBy('action')
            ->orderByDesc('total')
            ->limit(15)
            ->get();

        $hourly = PageView::selectRaw('HOUR(created_at) as hour, COUNT(*) as total')
            ->groupBy('hour')
            ->orderBy('hour')
            ->pluck('total', 'hour');

        $hourlyActivity = [];

        for ($h = 0; $h < 24; $h++) {
            $hourlyActivity[] = [
                'hour' => $h,
                'label' => sprintf('%02d:00', $h),
                'total' => (int) ($hourly[$h] ?? 0),
            ];
        }

        $topActive = HistoryEvent::query()
            ->selectRaw('user_id, COUNT(*) as total')
            ->whereNotNull('user_id')
            ->groupBy('user_id')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        $uids = $topActive->pluck('user_id')->filter()->values()->all();
        $users = User::whereIn('id', $uids)->get(['id', 'username', 'email'])->keyBy('id');

        $topActiveUsers = $topActive->map(fn ($e) => [
            'user_id' => $e->user_id,
            'name' => $users[$e->user_id]?->name ?? 'Pengguna terhapus',
            'email' => $users[$e->user_id]?->email,
            'total' => $e->total,
        ]);

        return [
            'top_actions' => $topActions,
            'top_audit_actions' => $topAuditActions,
            'hourly_activity' => $hourlyActivity,
            'top_active_users' => $topActiveUsers,
        ];
    }

    public function rawVisits(int $perPage = 25)
    {
        return PageView::with('user')->latest('created_at')->paginate($perPage);
    }
}