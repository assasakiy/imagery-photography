<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Heartbeat presence: update users.last_seen_at saat user terautentikasi.
 * Throttle 60 detik agar tidak menulis DB di setiap request.
 *
 * Juga menegakkan login_remember_days: jika user login dengan "remember me",
 * session diberi timestamp expiry sendiri dan di-logout paksa setelah N hari
 * tidak aktif — terlepas dari SESSION_LIFETIME default Laravel.
 */
class UpdateLastSeen
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::guard('web')->user();

        // Penegakan login_remember_days: cek sebelum request diproses
        if ($user && $request->session()->has('login_remember_days')) {
            $expiresAt = $request->session()->get('login_remember_expires_at');
            if ($expiresAt && now()->timestamp > $expiresAt) {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
                return $next($request);
            }
            // Perpanjang expiry window tiap request aktif
            $days = (int) $request->session()->get('login_remember_days', 30);
            $request->session()->put('login_remember_expires_at', now()->addDays($days)->timestamp);
        }

        $response = $next($request);

        $user = Auth::guard('web')->user();

        if ($user && ($user->last_seen_at === null || $user->last_seen_at->diffInSeconds(now()) >= 60)) {
            $user->forceFill(['last_seen_at' => now()])->save();
        }

        return $response;
    }
}
