<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AuditLogger;
use App\Services\LoginTracker;
use App\Services\NotificationService;
use App\Services\RuntimeSettings;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function redirect()
    {
        $settings = app(RuntimeSettings::class);

        if (!$this->configured($settings)) {
            abort(404);
        }

        return Socialite::driver('google')
            ->setConfig($this->config($settings))
            ->redirect();
    }

    public function callback()
    {
        $settings = app(RuntimeSettings::class);

        if (!$this->configured($settings)) {
            abort(404);
        }

        try {
            $googleUser = Socialite::driver('google')
                ->setConfig($this->config($settings))
                ->user();
        } catch (\Throwable $e) {
            Log::warning('google auth failed', ['error' => $e->getMessage()]);

            return redirect('/login')->withErrors(['form' => 'Gagal masuk dengan Google. Coba lagi.']);
        }

        $user = User::where('email', $googleUser->getEmail())->first();

        if (!$user || !$user->isAdmin() || !$user->canUseLoginMethod('google')) {
            return redirect('/login')->withErrors(['form' => 'Akun Google tidak terdaftar sebagai admin di situs ini.']);
        }

        Auth::login($user);
        session()->regenerate();

        $tracker = app(LoginTracker::class);
        $tracker->recordLogin($user, 'google');
        app(AuditLogger::class)->log('auth.login', 'Login sukses via google: ' . $user->email);

        if ($tracker->isSuspicious($user)) {
            app(NotificationService::class)->notifySuspiciousLogin($user);
        }

        return redirect('/dashboard');
    }

    private function configured(RuntimeSettings $settings): bool
    {
        return $settings->googleAuthEnabled()
            && $settings->googleClientId()
            && $settings->googleClientSecret();
    }

    private function config(RuntimeSettings $settings): array
    {
        return [
            'client_id' => $settings->googleClientId(),
            'client_secret' => $settings->googleClientSecret(),
            'redirect' => $settings->googleRedirectUrl(),
        ];
    }
}
