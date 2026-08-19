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
        $query = AuditLog::with(['user' => fn ($q) => $q->withTrashed()])->latest('id');

        $categories = $request->input('categories');
        if (is_array($categories) && count($categories) > 0) {
            $query->where(function ($q) use ($categories) {
                foreach ($categories as $c) {
                    $q->orWhere('action', 'like', $c . '.%');
                }
            });
        } elseif ($request->filled('category')) {
            $query->where('action', 'like', $request->input('category') . '.%');
        } elseif ($request->filled('action')) {
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
                ->orWhere('description', 'like', '%' . $q . '%')
                ->orWhere('identifier', 'like', '%' . $q . '%'));
        }

        $logs = $query->paginate(25);

        $logs->getCollection()->transform(fn ($log) => $this->withAccountState($log));

        return response()->json($logs);
    }

    public function actions(Request $request)
    {
        $actions = AuditLog::distinct()->orderBy('action')->pluck('action');

        return response()->json($actions);
    }

    public function links(Request $request)
    {
        $query = ClientAccessToken::with(['user' => fn ($q) => $q->withTrashed()->with('profile'), 'project'])->latest('id');

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
        $query = LoginHistory::with(['user' => fn ($q) => $q->withTrashed()->with('profile')])->latest('id');

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

        if ($q = trim((string) $request->input('q'))) {
            $query->where(fn ($w) => $w
                ->where('identifier', 'like', '%' . $q . '%')
                ->orWhere('ip', 'like', '%' . $q . '%')
                ->orWhereHas('user', fn ($u) => $u->withTrashed()->where('name', 'like', '%' . $q . '%')
                    ->orWhere('email', 'like', '%' . $q . '%')
                    ->orWhere('username', 'like', '%' . $q . '%')));
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
                return $this->withAccountState($lh);
            }

            $others = ($known[$lh->user_id] ?? collect())->where('id', '!=', $lh->id);

            if ($others->isEmpty()) {
                return $this->withAccountState($lh);
            }

            $sawIp = $others->contains(fn ($r) => $r->ip && $r->ip === $lh->ip);
            $sawUa = $others->contains(fn ($r) => $r->user_agent && $r->user_agent === $lh->user_agent);

            $lh->suspicious = !$sawIp && !$sawUa;

            return $this->withAccountState($lh);
        });

        return response()->json($logs);
    }

    /**
     * Klasifikasi status akun untuk menampilkan siapa yang login secara jelas:
     * deleted / disabled / pending / registered / unknown (belum terdaftar).
     */
    private function withAccountState($model)
    {
        $user = $model->user;

        if (!$user && !$model->user_id) {
            $model->account_state = 'unknown';
            $model->account_identity = $model->identifier ?? null;
        } elseif (!$user) {
            $model->account_state = 'deleted';
            $model->account_identity = $model->user_name ?? $model->identifier ?? null;
        } elseif ($user->trashed()) {
            $model->account_state = 'deleted';
            $model->account_identity = $user->name;
        } elseif ($user->isPending()) {
            $model->account_state = 'pending';
            $model->account_identity = $user->name;
        } elseif ($user->isDisabled()) {
            $model->account_state = 'disabled';
            $model->account_identity = $user->name;
        } else {
            $model->account_state = 'registered';
            $model->account_identity = $user->name;
        }

        $model->account_email = $user?->email ?? null;

        return $model;
    }
}
