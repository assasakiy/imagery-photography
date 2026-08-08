<?php

namespace App\Http\Controllers;

use App\Models\ClientAccessToken;
use App\Services\AuditLogger;
use App\Services\LoginTracker;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function showLogin()
    {
        return view('landing_pages.auth.login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials, app(\App\Services\RuntimeSettings::class)->loginRememberEnabled() && $request->boolean('remember'))) {
            $request->session()->regenerate();

            $this->afterLogin(Auth::user(), 'password');

            return redirect()->intended('/dashboard');
        }

        $identifier = $credentials['email'] ?? '';
        $user = \App\Models\User::where('email', $identifier)->first();
        app(LoginTracker::class)->recordFailed($user, 'password');
        app(AuditLogger::class)->log('auth.login_failed', 'Percobaan login gagal: ' . $identifier);

        return back()->withErrors([
            'email' => 'Email atau password salah.',
        ])->onlyInput('email');
    }

    private function afterLogin(\App\Models\User $user, string $method): void
    {
        $tracker = app(LoginTracker::class);
        $tracker->recordLogin($user, $method);

        app(AuditLogger::class)->log('auth.login', 'Login sukses via ' . $method . ': ' . $user->email);

        if ($tracker->isSuspicious($user)) {
            app(NotificationService::class)->notifySuspiciousLogin($user);
        }
    }

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

        $this->afterLogin($accessToken->user, 'access_token');

        return redirect('/dashboard')->with('success', 'Selamat datang, ' . ($accessToken->user?->name ?? 'user') . '!');
    }
}
