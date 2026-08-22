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

        $googleEmail = strtolower(trim((string) $googleUser->getEmail()));
        $googleName = $googleUser->getName() ?: null;

        $user = User::where('email', $googleEmail)->first();

        if (!$user) {
            if (!$this->settingsAllowSubscribers()) {
                return redirect('/login')->withErrors(['form' => 'Google tidak diizinkan untuk pendaftaran baru.']);
            }

            $user = app(\App\Services\ClientRegistrationService::class)->ensureUser([
                'email' => $googleEmail,
                'name'  => $googleName,
            ], 'subscriber');

            $user->update(['status' => 'active', 'activated_at' => now()]);

            // Kirim link set-password opsional di background (tidak blocking).
            try {
                $link = app(\App\Services\ClientRegistrationService::class)->issueSubscribeLink($user);
                app(NotificationService::class)->send(
                    \App\Services\NotificationType::ACCOUNT_INVITE,
                    $user,
                    ['name' => $user->name, 'url' => $link->url]
                );
            } catch (\Throwable) {}
        }

        if (!$user->canUseLoginMethod('google')) {
            return redirect('/login')->withErrors(['form' => 'Metode login Google nonaktif.']);
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

    private function settingsAllowSubscribers(): bool
    {
        $settings = app(RuntimeSettings::class);

        return $settings->googleAuthEnabled()
            && $settings->get('google_subscriber_registration', '1') === '1';
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
