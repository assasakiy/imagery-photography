<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Portfolio;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function unreadCount(Request $request)
    {
        $count = ContactMessage::whereNull('read_at')
            ->where('sender_type', '!=', 'admin')
            ->count();

        return response()->json(['unread_count' => $count]);
    }

    public function stats(Request $request)
    {
        if ($this->isAdmin()) {
            $revenueByMonth = Payment::query()
                ->where('status', 'confirmed')
                ->whereHas('project')
                ->where('paid_at', '>=', now()->subMonths(6)->startOfMonth())
                ->get(['amount', 'paid_at'])
                ->groupBy(fn ($p) => $p->paid_at?->format('Y-m') ?? '')
                ->map(fn ($g) => $g->sum(fn ($p) => (float) $p->amount))
                ->sortKeys();

            $statusBreakdown = Project::query()
                ->selectRaw('status, COUNT(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status');

            $confirmed = Payment::where('status', 'confirmed')->whereHas('project');

            return response()->json([
                'role' => 'admin',
                'total_projects' => Project::count(),
                'projects_this_month' => Project::where('created_at', '>=', now()->startOfMonth())->count(),
                'projects_last_month' => Project::whereBetween('created_at', [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()])->count(),
                'active_projects' => Project::whereIn('status', ['scheduled', 'shooting', 'editing', 'awaiting_payment'])->count(),
                'completed_projects' => Project::whereIn('status', ['completed', 'archived'])->count(),
                'total_clients' => User::role('client')->count(),
                'clients_this_month' => User::role('client')->where('created_at', '>=', now()->startOfMonth())->count(),
                'total_revenue' => $confirmed->sum('amount'),
                'revenue_this_month' => (clone $confirmed)->where('paid_at', '>=', now()->startOfMonth())->sum('amount'),
                'revenue_last_month' => (clone $confirmed)->whereBetween('paid_at', [now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()])->sum('amount'),
                'pending_amount' => Payment::where('status', 'pending')->whereHas('project')->sum('amount'),
                'avg_per_project' => Project::count() ? round((clone $confirmed)->sum('amount') / Project::count(), 2) : 0,
                'pending_payments' => Payment::where('status', 'pending')->whereHas('project')->count(),
                'portfolios' => Portfolio::count(),
                'unread_messages' => ContactMessage::whereNull('read_at')->where(fn ($q) => $q->whereNull('project_id')->orWhereHas('project'))->count(),
                'revenue_by_month' => $revenueByMonth,
                'status_breakdown' => $statusBreakdown,
                'recent_projects' => Project::with('user.profile')->latest()->take(5)->get(),
                'recent_messages' => $this->recentConversations(5),
                'recent_payments' => Payment::with('project')->whereHas('project')->latest()->take(5)->get(),
                'upcoming_schedule' => Project::with('user')
                    ->whereNotNull('event_date')
                    ->whereDate('event_date', '>=', now()->toDateString())
                    ->whereNotIn('status', ['completed', 'archived'])
                    ->orderBy('event_date')
                    ->take(4)
                    ->get(['id', 'order_no', 'name', 'location', 'event_date', 'status']),
            ]);
        }

        $user = request()->user();

        if ($user->isSubscriber() && !$user->isClient()) {
            return response()->json([
                'role' => 'subscriber',
                'projects' => 0,
                'in_progress' => 0,
                'completed' => 0,
                'total_spent' => 0,
                'recent_projects' => [],
            ]);
        }

        return response()->json([
            'role' => 'client',
            'projects' => $user->projects()->count(),
            'in_progress' => $user->projects()->whereIn('status', ['scheduled', 'shooting', 'editing', 'awaiting_payment'])->count(),
            'completed' => $user->projects()->whereIn('status', ['completed', 'archived'])->count(),
            'total_spent' => Payment::whereHas('project', fn ($q) => $q->where('user_id', $user->id))->where('status', 'confirmed')->sum('amount'),
            'recent_projects' => $user->projects()->with('user.profile')->latest()->take(5)->get(),
        ]);
    }

    /**
     * Percakapan terbaru utk dashboard: SATU baris per pengirim (user_id atau
     * email/phone bila belum login), menampilkan pesan terakhir milik PENGIRIM
     * (bukan balasan admin) beserta jumlah pesan baru (belum dibaca) dari dia.
     */
    private function recentConversations(int $limit = 5): array
    {
        $senderExpr = 'IFNULL(user_id, COALESCE(email, phone))';

        $latest = ContactMessage::selectRaw('MAX(id) as id')
            ->where('sender_type', '!=', 'admin')
            ->groupByRaw($senderExpr)
            ->pluck('id');

        $rows = ContactMessage::with(['project', 'user'])
            ->whereIn('id', $latest)
            ->where('sender_type', '!=', 'admin')
            ->where(fn ($q) => $q->whereNull('project_id')->orWhereHas('project'))
            ->latest('id')
            ->take($limit)
            ->get();

        $senders = $rows->map(fn ($m) => $m->user_id ?: $m->email ?: $m->phone)->filter()->all();

        $unreadCounts = ContactMessage::query()
            ->selectRaw("{$senderExpr} as sender, COUNT(*) as total")
            ->whereIn(\DB::raw($senderExpr), $senders)
            ->where('sender_type', '!=', 'admin')
            ->whereNull('read_at')
            ->groupByRaw($senderExpr)
            ->pluck('total', 'sender');

        return $rows->map(fn ($m) => [
            'id' => $m->id,
            'name' => $m->name,
            'message' => $m->message,
            'sender_type' => $m->sender_type,
            'unread_count' => (int) ($unreadCounts[$m->user_id ?: ($m->email ?: $m->phone)] ?? 0),
            'created_at' => $m->created_at,
        ])->values()->all();
    }

    /** Ringkas angka utk badge notifikasi (1 request menggantikan 3 polling terpisah). */
    public function summary(Request $request)
    {
        $user = $request->user();

        $res = [
            'notifications_unread' => $user->unreadNotifications()->count(),
        ];

        if ($user->isStaff()) {
            $res['messages_unread'] = ContactMessage::whereNull('read_at')->where(fn ($q) => $q->whereNull('project_id')->orWhereHas('project'))->count();
            $res['bookings_pending'] = \App\Models\Booking::where('status', 'pending')->where(fn ($w) => $w->whereNull('user_id')->orWhereHas('user', fn ($u) => $u->whereNull('deleted_at')))->count();
            // Badge menu Pembayaran: jumlah payment yang menunggu konfirmasi.
            $res['payments_pending'] = \App\Models\Payment::where('status', 'pending')->whereHas('project')->count();
        } else {
            $res['messages_unread'] = null;
            $res['bookings_pending'] = null;
            // Badge menu Tagihan klien: jumlah invoice yang belum lunas.
            $res['invoices_unpaid'] = Invoice::whereIn('project_id', $user->projects()->pluck('id'))
                ->where('status', '!=', 'paid')
                ->count();
        }

        return response()->json($res);
    }

    private function isAdmin(): bool
    {
        return request()->user()->isStaff();
    }
}
