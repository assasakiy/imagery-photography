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
                ->orWhereHas('user', fn ($u) => $u->withTrashed()
                    ->where('email', 'like', '%' . $q . '%')
                    ->orWhere('username', 'like', '%' . $q . '%')
                    ->orWhereHas('profile', fn ($p) => $p->where('full_name', 'like', '%' . $q . '%'))));
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

        $logs->getCollection()->transform(function ($lh) {
            $lh->online = $lh->user && $lh->status === 'success' && $lh->user->isOnline();

            return $lh;
        });

        return response()->json($logs);
    }

    /**
     * Daftar user (owner/admin/client/subscriber) dengan status kehadiran real-time:
     * online, terakhir aktif, durasi sesi aktif berjalan.
     */
    public function onlineUsers(Request $request)
    {
        $users = \App\Models\User::withTrashed()
            ->whereNull('deleted_at')
            ->with(['profile'])
            ->get()
            ->map(function ($user) {
                $open = LoginHistory::where('user_id', $user->id)
                    ->where('status', 'success')
                    ->whereNull('logged_out_at')
                    ->latest('logged_in_at')
                    ->first();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'username' => $user->username,
                    'role' => $user->primaryRole(),
                    'status' => $user->status,
                    'online' => $user->isOnline(),
                    'last_seen_at' => $user->last_seen_at?->toIso8601String(),
                    'last_seen_rel' => $user->last_seen_at ? $this->relativeTime($user->last_seen_at) : null,
                    'session_open' => $open ? $open->logged_in_at?->toIso8601String() : null,
                    'session_duration' => $open && $open->logged_in_at
                        ? (int) $open->logged_in_at->diffInSeconds(now())
                        : null,
                    'session_ip' => $open?->ip,
                    'session_device' => $open?->user_agent,
                ];
            })
            ->values();

        if ($request->filled('role')) {
            $role = $request->input('role');
            $users = $users->filter(fn ($u) => $u['role'] === $role)->values();
        }

        return response()->json($users);
    }

    private function relativeTime($date): string
    {
        $diff = $date->diffInSeconds(now());

        if ($diff < 60) {
            return 'kurang dari 1 menit lalu';
        }

        if ($diff < 3600) {
            return floor($diff / 60) . ' menit lalu';
        }

        if ($diff < 86400) {
            return floor($diff / 3600) . ' jam lalu';
        }

        return floor($diff / 86400) . ' hari lalu';
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
