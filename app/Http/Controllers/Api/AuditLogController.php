<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ClientAccessToken;
use App\Models\LoginHistory;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with('user')->latest('id');

        if ($request->filled('action')) {
            $query->where('action', $request->input('action'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->input('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->input('to'));
        }

        if ($q = trim((string) $request->input('q'))) {
            $query->where(fn ($w) => $w
                ->where('user_name', 'like', '%' . $q . '%')
                ->orWhere('action', 'like', '%' . $q . '%')
                ->orWhere('description', 'like', '%' . $q . '%'));
        }

        return response()->json($query->paginate(25));
    }

    public function actions(Request $request)
    {
        $actions = AuditLog::distinct()->orderBy('action')->pluck('action');

        return response()->json($actions);
    }

    public function links(Request $request)
    {
        $query = ClientAccessToken::with(['user' => fn ($q) => $q->withTrashed(), 'project'])->latest('id');

        if ($request->filled('purpose')) {
            $query->where('purpose', $request->input('purpose'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        if ($q = trim((string) $request->input('q'))) {
            $query->where(fn ($w) => $w
                ->where('token', 'like', '%' . $q . '%')
                ->orWhereHas('user', fn ($u) => $u->where('email', 'like', '%' . $q . '%')
                    ->orWhere('username', 'like', '%' . $q . '%')
                    ->orWhereHas('profile', fn ($p) => $p->where('full_name', 'like', '%' . $q . '%'))));
        }

        $logs = $query->paginate(25);

        $logs->getCollection()->transform(function ($token) {
            $token->url = $token->url;

            return $token;
        });

        return response()->json($logs);
    }

    public function loginHistory(Request $request)
    {
        $query = LoginHistory::with('user')->latest('id');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('method')) {
            $query->where('method', $request->input('method'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        if ($request->filled('from')) {
            $query->whereDate('logged_in_at', '>=', $request->input('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('logged_in_at', '<=', $request->input('to'));
        }

        $logs = $query->paginate(25);

        $uids = $logs->getCollection()->pluck('user_id')->filter()->unique()->values();
        $known = [];

        foreach ($uids as $uid) {
            $known[$uid] = LoginHistory::where('user_id', $uid)
                ->where('status', 'success')
                ->get(['id', 'ip', 'user_agent']);
        }

        $logs->getCollection()->transform(function ($lh) use ($known) {
            $lh->suspicious = false;

            if ($lh->status !== 'success' || !$lh->user_id) {
                return $lh;
            }

            $others = ($known[$lh->user_id] ?? collect())->where('id', '!=', $lh->id);

            if ($others->isEmpty()) {
                return $lh;
            }

            $sawIp = $others->contains(fn ($r) => $r->ip && $r->ip === $lh->ip);
            $sawUa = $others->contains(fn ($r) => $r->user_agent && $r->user_agent === $lh->user_agent);

            $lh->suspicious = !$sawIp && !$sawUa;

            return $lh;
        });

        return response()->json($logs);
    }
}
