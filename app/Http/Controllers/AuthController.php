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

        if ($accessToken->purpose === 'invite' || $accessToken->purpose === 'subscribe') {
            // Jangan ubah status/used_at di sini, biarkan API setPassword() yang mengkonsumsinya.
            return redirect('/set-password?token=' . $token);
        }

        if ($accessToken->purpose === 'recovery') {
            // Jangan ubah status di sini, biarkan API resetPassword() yang mengkonsumsinya.
            return redirect('/reset-password?token=' . $token);
        }

        // Untuk purpose 'otp_login' dan 'project', langsung login & consume tokennya.
        $accessToken->update(['status' => 'accepted', 'used_at' => now()]);
        
        // Invalidate semua link lain yang sejenis
        app(\App\Services\ClientRegistrationService::class)->invalidateOtpAndLinks($accessToken->user);

        Auth::login($accessToken->user);

        $tracker = app(LoginTracker::class);
        $tracker->recordLogin($accessToken->user, 'access_token');

        app(AuditLogger::class)->log('auth.login', 'Login sukses via ' . $accessToken->purpose . ' token: ' . $accessToken->user->email);

        if ($tracker->isSuspicious($accessToken->user)) {
            app(NotificationService::class)->notifySuspiciousLogin($accessToken->user);
        }

        return redirect('/dashboard')->with('success', 'Selamat datang, ' . ($accessToken->user?->name ?? 'user') . '!');
    }
}
