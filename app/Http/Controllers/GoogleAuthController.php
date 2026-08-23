<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AuditLogger;
use App\Services\LoginTracker;
use App\Services\NotificationService;
use App\Services\RuntimeSettings;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;

class GoogleAuthController extends Controller
{
    public function redirect()
    {
        $settings = app(RuntimeSettings::class);

        if (!$this->configured($settings)) {
            abort(404);
        }

        return Socialite::buildProvider(GoogleProvider::class, $this->config($settings))
            ->redirect();
    }

    public function callback()
    {
        $settings = app(RuntimeSettings::class);

        if (!$this->configured($settings)) {
            abort(404);
        }

        try {
            $googleUser = Socialite::buildProvider(GoogleProvider::class, $this->config($settings))
                ->user();
        } catch (\Throwable $e) {
            Log::warning('google auth failed', ['error' => $e->getMessage()]);

            return redirect('/login')->withErrors(['form' => 'Gagal masuk dengan Google. Coba lagi.']);
        }

        $googleEmail = strtolower(trim((string) $googleUser->getEmail()));
        $googleName = $googleUser->getName() ?: null;

        $user = User::withTrashed()->where('email', $googleEmail)->first();
        $isNew = false;

        if (!$user) {
            if (!$this->settingsAllowSubscribers()) {
                return redirect('/login')->withErrors(['form' => 'Pendaftaran baru melalui Google tidak diizinkan.']);
            }

            $user = app(\App\Services\ClientRegistrationService::class)->ensureUser([
                'email' => $googleEmail,
                'name'  => $googleName,
            ], 'subscriber');

            $user->update(['status' => 'active', 'activated_at' => now()]);
            $isNew = true;

            // Kirim link set-password opsional di background (tidak blocking).
            try {
                $link = app(\App\Services\ClientRegistrationService::class)->issueSubscribeLink($user);
                app(NotificationService::class)->send(
                    \App\Services\NotificationType::SET_PASSWORD,
                    $user,
                    ['name' => $user->name, 'url' => $link->url]
                );
            } catch (\Throwable) {}
        }

        if ($user->trashed()) {
            $user->restore();
            app(AuditLogger::class)->log('auth.restored', 'Akun otomatis dipulihkan saat login via Google: ' . $user->email, $user);
        }

        if (!$user->canUseLoginMethod('google')) {
            return redirect('/login')->withErrors(['form' => 'Metode login Google dinonaktifkan untuk akun ini.']);
        }

        $this->syncGoogleAvatar($user, $googleUser);

        Auth::login($user);
        session()->regenerate();

        $tracker = app(LoginTracker::class);
        $tracker->recordLogin($user, 'google');
        
        $action = $isNew ? 'Registrasi' : 'Login';
        app(AuditLogger::class)->log('auth.login', "{$action} sukses via google: " . $user->email);

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

    private function syncGoogleAvatar(User $user, $googleUser): void
    {
        if ($user->getFirstMedia('avatar')) {
            return;
        }

        $photoUrl = $googleUser->getAvatar();
        if (empty($photoUrl)) {
            return;
        }

        try {
            $response = Http::timeout(10)->withOptions(['CURLOPT_IPRESOLVE' => CURL_IPRESOLVE_V4])->get($photoUrl);
            if ($response->successful()) {
                $ext = match ($response->header('content-type')) {
                    'image/png' => 'png',
                    'image/gif' => 'gif',
                    default => 'jpg',
                };
                $filename = "google-avatar-{$user->id}.{$ext}";
                $tmpPath = storage_path("app/tmp/{$filename}");
                @mkdir(dirname($tmpPath), 0755, true);
                file_put_contents($tmpPath, $response->body());

                $user->addMedia($tmpPath)
                    ->usingName('Google Avatar')
                    ->toMediaCollection('avatar');

                @unlink($tmpPath);
            }
        } catch (\Throwable $e) {
            Log::warning('google avatar sync failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
        }
    }
}
