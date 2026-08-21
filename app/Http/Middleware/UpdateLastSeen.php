<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Heartbeat presence: update users.last_seen_at saat user terautentikasi.
 * Throttle 60 detik agar tidak menulis DB di setiap request.
 */
class UpdateLastSeen
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $user = Auth::guard('web')->user();

        if ($user && ($user->last_seen_at === null || $user->last_seen_at->diffInSeconds(now()) >= 60)) {
            $user->forceFill(['last_seen_at' => now()])->save();
        }

        // Perpanjang session jika user login dengan "remember me"
        if ($user && $request->session()->has('login_remember_days')) {
            $request->session()->touch($request->session()->get('login_remember_days') * 60);
        }

        return $response;
    }
}