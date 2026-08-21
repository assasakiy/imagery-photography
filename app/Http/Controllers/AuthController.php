<?php

namespace App\Http\Controllers;

use App\Models\ClientAccessToken;
use App\Services\AuditLogger;
use App\Services\LoginTracker;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function logout(Request $request)
    {
        $user = Auth::user();

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        app(LoginTracker::class)->recordLogout($user);
        app(AuditLogger::class)->log('auth.logout', 'Logout: ' . ($user?->email ?? '-'));

        return redirect('/');
    }

    public function accessViaToken(string $token)
    {
        $accessToken = ClientAccessToken::where('token', $token)->valid()->first();

        if (!$accessToken) {
            return redirect('/login')->withErrors(['token' => 'Link akses tidak valid atau sudah kadaluarsa.']);
        }

        if ($accessToken->user?->trashed()) {
            return redirect('/login')->withErrors(['token' => 'Link akses tidak valid atau sudah kadaluarsa.']);
        }

        if ($accessToken->purpose === 'invite') {
            $accessToken->update(['used_at' => now()]);

            return redirect('/set-password?token=' . $token);
        }

        if ($accessToken->purpose === 'recovery') {
            $accessToken->update(['used_at' => now()]);

            return redirect('/reset-password?token=' . $token);
        }

        $accessToken->update(['used_at' => now()]);

        Auth::login($accessToken->user);

        $tracker = app(LoginTracker::class);
        $tracker->recordLogin($accessToken->user, 'access_token');

        app(AuditLogger::class)->log('auth.login', 'Login sukses via access_token: ' . $accessToken->user->email);

        if ($tracker->isSuspicious($accessToken->user)) {
            app(NotificationService::class)->notifySuspiciousLogin($accessToken->user);
        }

        return redirect('/dashboard')->with('success', 'Selamat datang, ' . ($accessToken->user?->name ?? 'user') . '!');
    }
}
