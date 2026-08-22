<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class SubscriberController extends Controller
{
    public function index(Request $request)
    {
        $query = User::role('subscriber')
            ->with('profile');

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(fn ($q) => $q
                ->where('email', 'like', '%' . $s . '%')
                ->orWhere('username', 'like', '%' . $s . '%')
                ->orWhereHas('profile', fn ($p) => $p->where('full_name', 'like', '%' . $s . '%')));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $users = $query->latest()->paginate(15);

        $users->getCollection()->transform(fn ($u) => $this->serialize($u));

        return response()->json($users->toArray() + ['stats' => $this->stats()]);
    }

    private function stats(): array
    {
        $base = User::role('subscriber');
        $total = (clone $base)->count();
        $active = (clone $base)->where('status', 'active')->count();
        $disabled = (clone $base)->where('status', 'disabled')->count();
        $newThisMonth = (clone $base)->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])->count();
        $newLastMonth = (clone $base)->whereBetween('created_at', [now()->subMonthNoOverflow()->startOfMonth(), now()->subMonthNoOverflow()->endOfMonth()])->count();

        return [
            'total' => $total,
            'active' => $active,
            'active_percentage' => $total ? round(($active / $total) * 100, 1) : 0,
            'new_this_month' => $newThisMonth,
            'new_growth_percentage' => $newLastMonth ? round((($newThisMonth - $newLastMonth) / $newLastMonth) * 100, 1) : null,
            'disabled' => $disabled,
            'disabled_percentage' => $total ? round(($disabled / $total) * 100, 1) : 0,
        ];
    }

    public function show(User $user)
    {
        if (!$user->hasRole('subscriber')) {
            abort(404);
        }

        $user->load('profile');

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'phone' => $user->phone,
            'status' => $user->status,
            'avatar' => $user->avatar(),
            'bio' => $user->bio,
            'created_at' => $user->created_at,
            'last_seen_at' => $user->last_seen_at,
            'is_online' => $user->isOnline(),
            'bookmarks_count' => $user->bookmarks()->count(),
            'likes_count' => $user->likes()->count(),
            'comments_count' => $user->comments()->count(),
            'bookmarks' => $user->bookmarks()->with('bookmarkable')->latest()->take(10)->get()->map(fn ($b) => [
                'id' => $b->id,
                'type' => class_basename($b->bookmarkable_type),
                'title' => $b->bookmarkable?->title ?? $b->bookmarkable?->name ?? 'Konten',
            ]),
            'recent_comments' => $user->comments()->latest()->take(10)->get()->map(fn ($c) => [
                'id' => $c->id,
                'body' => mb_strimwidth($c->body, 0, 80, '…'),
                'status' => $c->status,
                'commentable_type' => class_basename($c->commentable_type),
                'created_at' => $c->created_at,
            ]),
        ]);
    }

    public function disable(Request $request, User $user)
    {
        if (!$user->hasRole('subscriber')) {
            abort(404);
        }

        $user->update(['status' => 'disabled']);
        $user->tokens()->delete();
        \Illuminate\Support\Facades\DB::table('sessions')->where('user_id', $user->id)->delete();

        app(AuditLogger::class)->log('subscriber.disabled', 'Subscriber dinonaktifkan: ' . $user->name, $user);

        return response()->json($this->serialize($user));
    }

    public function activate(Request $request, User $user)
    {
        if (!$user->hasRole('subscriber')) {
            abort(404);
        }

        $user->update(['status' => 'active', 'activated_at' => now()]);

        app(AuditLogger::class)->log('subscriber.activated', 'Subscriber diaktifkan: ' . $user->name, $user);

        return response()->json($this->serialize($user));
    }

    public function resendOtp(Request $request, User $user)
    {
        if (!$user->hasRole('subscriber')) {
            abort(404);
        }

        if ($user->status === 'active') {
            return response()->json(['message' => 'Akun sudah aktif, tidak perlu OTP.'], 422);
        }

        $otp = (string) random_int(100000, 999999);
        session()->put('otp_' . $user->id, ['code' => Hash::make($otp), 'expires_at' => now()->addMinutes(5)]);
        session()->put('otp_target_' . $user->id, $user->email);
        session()->put('subscribe_pending_' . $user->id, true); // Pastikan bernilai true

        $reg  = app(\App\Services\ClientRegistrationService::class);
        $link = $reg->issueSubscribeLink($user);

        // Paksa ke Email untuk resend OTP subscriber awal.
        app(NotificationService::class)->sendOtp($user, $user->phone ?? $user->email, $otp, $user->email);
        app(NotificationService::class)->send(
            \App\Services\NotificationType::ACCOUNT_INVITE,
            $user,
            ['name' => $user->name, 'url' => $link->url, 'channel_override' => 'email']
        );

        app(AuditLogger::class)->log('subscriber.otp_resent', 'OTP+link dikirim ulang ke subscriber: ' . $user->email, $user);

        return response()->json([
            'message' => 'OTP dikirim ulang ke ' . ($user->phone ?? $user->email),
            'dev_otp' => config('app.env') !== 'production' ? $otp : null,
        ]);
    }

    public function softDelete(Request $request, User $user)
    {
        if (!$user->hasRole('subscriber')) {
            abort(404);
        }

        if ($user->hasRole('client') || $user->hasRole('owner') || $user->hasRole('admin')) {
            abort(422, 'Akun ini juga memiliki role lain dan tidak bisa dihapus dari manajemen subscriber.');
        }

        $name = $user->name;
        $user->delete();

        app(AuditLogger::class)->log('subscriber.soft_deleted', 'Subscriber dipindahkan ke recycle bin: ' . $name, $user);

        return response()->json(['ok' => true]);
    }

    public function trashed(Request $request)
    {
        $query = User::role('subscriber')
            ->whereDoesntHave('roles', fn ($q) => $q->where('name', 'client'))
            ->with(['profile', 'deletedBy:id,username', 'deletedBy.profile'])
            ->onlyTrashed()
            ->latest('deleted_at');

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(fn ($q) => $q
                ->where('email', 'like', '%' . $s . '%')
                ->orWhereHas('profile', fn ($p) => $p->where('full_name', 'like', '%' . $s . '%')));
        }

        $users = $query->paginate(15);

        $users->getCollection()->transform(fn ($u) => $this->serializeForTrash($u));

        return response()->json($users);
    }

    public function restore(Request $request, User $user)
    {
        if (!$user->hasRole('subscriber')) {
            abort(404);
        }

        $name = $user->name;
        $user->restore();

        app(AuditLogger::class)->log('subscriber.restored', 'Subscriber dipulihkan dari recycle bin: ' . $name, $user);

        return response()->json(['ok' => true]);
    }

    public function forceDelete(Request $request, User $user)
    {
        if (!$user->hasRole('subscriber')) {
            abort(404);
        }

        $name = $user->name;
        $user->forceDelete();

        app(AuditLogger::class)->log('subscriber.force_deleted', 'Subscriber dihapus permanen: ' . $name);

        return response()->json(['ok' => true]);
    }

    private function serialize(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'status' => $user->status,
            'avatar' => $user->avatar(),
            'is_online' => $user->isOnline(),
            'is_client' => $user->hasRole('client'),
            'last_seen_at' => $user->last_seen_at,
            'created_at' => $user->created_at,
            'bookmarks_count' => $user->bookmarks()->count(),
            'likes_count' => $user->likes()->count(),
            'comments_count' => $user->comments()->count(),
        ];
    }

    private function serializeForTrash(User $user): array
    {
        return [
            'id' => $user->id,
            'type' => 'subscriber',
            'name' => $user->name,
            'email' => $user->email,
            'deleted_by_name' => $user->deleted_by_name ?? $user->deletedBy?->name ?? '-',
            'deleted_at' => $user->deleted_at,
            'bookmarks_count' => $user->bookmarks()->count(),
            'likes_count' => $user->likes()->count(),
            'comments_count' => $user->comments()->count(),
        ];
    }
}
