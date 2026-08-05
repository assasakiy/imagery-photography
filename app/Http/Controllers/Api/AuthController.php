<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\LoginTracker;
use App\Services\NotificationService;
use App\Services\RuntimeSettings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'login' => 'nullable|string',
            'email' => 'nullable|string',
            'password' => 'required|string',
            'remember' => 'boolean',
        ]);

        $identifier = trim($data['login'] ?? $data['email'] ?? '');

        if ($identifier === '') {
            throw ValidationException::withMessages([
                'email' => 'Email atau nomor ponsel wajib diisi.',
            ]);
        }

        $settings = app(RuntimeSettings::class);
        $this->ensureNotLockedOut($settings);

        $user = $this->resolveUser($identifier);

        if (!$user || !Hash::check($data['password'], $user->password)) {
            $this->recordFailedAttempt($settings);
            app(LoginTracker::class)->recordFailed($user, 'password');
            app(AuditLogger::class)->log('auth.login_failed', 'Percobaan login gagal: ' . $identifier);

            throw ValidationException::withMessages([
                'email' => 'Email/ponsel atau kata sandi salah.',
            ]);
        }

        $this->clearFailedAttempts();

        Auth::login($user, $settings->loginRememberEnabled() && ($data['remember'] ?? false));

        $this->afterLogin($user, 'password');

        return response()->json([
            'user' => $this->userPayload($user),
        ]);
    }

    private function afterLogin(User $user, string $method): void
    {
        $tracker = app(LoginTracker::class);
        $tracker->recordLogin($user, $method);

        app(AuditLogger::class)->log('auth.login', 'Login sukses via ' . $method . ': ' . $user->email);

        if ($tracker->isSuspicious($user)) {
            app(NotificationService::class)->notifySuspiciousLogin($user);
        }
    }

    private function ensureNotLockedOut(RuntimeSettings $settings): void
    {
        $attempts = (int) Cache::get($this->lockoutKey(), 0);
        $max = (int) $settings->loginAttemptsMax();
        $lockoutMinutes = (int) $settings->loginAttemptsLockoutMinutes();

        if ($max > 0 && $attempts >= $max) {
            throw ValidationException::withMessages([
                'email' => 'Terlalu banyak percobaan gagal. Silakan coba lagi dalam ' . max(1, $lockoutMinutes) . ' menit.',
            ]);
        }
    }

    private function recordFailedAttempt(RuntimeSettings $settings): void
    {
        $max = (int) $settings->loginAttemptsMax();
        $lockoutMinutes = (int) $settings->loginAttemptsLockoutMinutes();

        if ($max <= 0) {
            return;
        }

        $attempts = (int) Cache::get($this->lockoutKey(), 0) + 1;
        Cache::put($this->lockoutKey(), $attempts, now()->addMinutes(max(1, $lockoutMinutes)));
    }

    private function clearFailedAttempts(): void
    {
        Cache::forget($this->lockoutKey());
    }

    private function lockoutKey(): string
    {
        return 'login_attempts:' . (request()->ip() ?: 'unknown');
    }

    private function resolveUser(string $identifier): ?User
    {
        $value = trim($identifier);

        if (filter_var($value, FILTER_VALIDATE_EMAIL)) {
            return User::where('email', $value)->first();
        }

        $digits = preg_replace('/\D+/', '', $value);

        if (strlen($digits) >= 8) {
            $variants = [$digits];

            if (str_starts_with($digits, '0')) {
                $variants[] = '62' . substr($digits, 1);
            } elseif (str_starts_with($digits, '62')) {
                $variants[] = '0' . substr($digits, 2);
            }

            $client = Client::whereIn('phone', $variants)->first();

            if ($client && $client->user) {
                return $client->user;
            }
        }

        return User::where('email', $value)->first();
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        app(LoginTracker::class)->recordLogout($user);
        app(AuditLogger::class)->log('auth.logout', 'Logout: ' . ($user?->email ?? '-'));

        return response()->json(['ok' => true]);
    }

    public function user(Request $request)
    {
        return response()->json([
            'user' => $this->userPayload($request->user()),
        ]);
    }

    public function sendOtp(Request $request)
    {
        $data = $request->validate([
            'phone' => 'required|string',
        ]);

        $user = \App\Models\User::whereHas('client', fn ($q) => $q->where('phone', $data['phone']))
            ->orWhere('email', $data['phone'])
            ->first();

        if (!$user) {
            return response()->json(['message' => 'Nomor/akun tidak ditemukan.'], 422);
        }

        $otp = (string) random_int(100000, 999999);
        session()->put('otp_' . $user->id, ['code' => Hash::make($otp), 'expires_at' => now()->addMinutes(5)]);

        app(NotificationService::class)->sendOtp($user, $data['phone'], $otp);

        app(AuditLogger::class)->log('auth.otp_sent', 'OTP dikirim untuk ' . ($user->email ?? $data['phone']));

        return response()->json([
            'message' => 'OTP terkirim via WhatsApp/Email (jika terkonfigurasi).',
            'dev_otp' => config('app.env') !== 'production' ? $otp : null,
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $data = $request->validate([
            'phone' => 'required|string',
            'otp' => 'required|string',
        ]);

        $user = \App\Models\User::whereHas('client', fn ($q) => $q->where('phone', $data['phone']))
            ->orWhere('email', $data['phone'])
            ->first();

        $stored = session()->pull('otp_' . $user?->id);

        if (!$user || !$stored || !Hash::check($data['otp'], $stored['code']) || now()->greaterThan($stored['expires_at'])) {
            return response()->json(['message' => 'Kode OTP salah atau kadaluarsa.'], 422);
        }

        Auth::login($user);

        $this->afterLogin($user, 'otp');

        return response()->json(['user' => $this->userPayload($user)]);
    }

    public function whatsappStatus()
    {
        $settings = app(\App\Services\RuntimeSettings::class);
        $cfg = $settings->whatsappConfig();

        return response()->json([
            'driver' => $settings->whatsappDriver(),
            'configured' => $settings->whatsappConfigured(),
            'base_url' => $cfg['config']['base_url'] ?? null,
        ]);
    }

    private function userPayload($user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->getRoleNames()->first() ?? $user->role,
            'permissions' => $user->getAllPermissions()->pluck('name'),
            'client_id' => $user->client?->id,
            'avatar' => $user->resolveAvatarUrl(),
            'bio' => $user->bio,
        ];
    }
}
