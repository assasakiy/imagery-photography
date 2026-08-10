<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClientAccessToken;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\LoginTracker;
use App\Services\NotificationService;
use App\Services\NotificationType;
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
        $this->ensureNotLockedOut($settings, $identifier);

        $user = $this->resolveUser($identifier);

        if (!$user || !$user->canUseLoginMethod('password') || !Hash::check($data['password'], $user->password)) {
            $this->recordFailedAttempt($settings, $identifier);
            $logUser = $user ?? $this->resolveUser($identifier, true);
            app(LoginTracker::class)->recordFailed($logUser, 'password', $identifier);
            app(AuditLogger::class)->log('auth.login_failed', 'Percobaan login gagal: ' . $identifier, identifier: $identifier);

            throw ValidationException::withMessages([
                'email' => 'Email/ponsel atau kata sandi salah.',
            ]);
        }

        $this->clearFailedAttempts($identifier);

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

    private function ensureNotLockedOut(RuntimeSettings $settings, string $identifier): void
    {
        $attempts = (int) Cache::get($this->lockoutKey($identifier), 0);
        $max = (int) $settings->loginAttemptsMax();
        $lockoutMinutes = (int) $settings->loginAttemptsLockoutMinutes();

        if ($max > 0 && $attempts >= $max) {
            throw ValidationException::withMessages([
                'email' => 'Terlalu banyak percobaan gagal. Silakan coba lagi dalam ' . max(1, $lockoutMinutes) . ' menit.',
            ]);
        }
    }

    private function recordFailedAttempt(RuntimeSettings $settings, string $identifier): void
    {
        $max = (int) $settings->loginAttemptsMax();
        $lockoutMinutes = (int) $settings->loginAttemptsLockoutMinutes();

        if ($max <= 0) {
            return;
        }

        $attempts = (int) Cache::get($this->lockoutKey($identifier), 0) + 1;
        Cache::put($this->lockoutKey($identifier), $attempts, now()->addMinutes(max(1, $lockoutMinutes)));
    }

    private function clearFailedAttempts(string $identifier): void
    {
        Cache::forget($this->lockoutKey($identifier));
    }

    private function lockoutKey(string $identifier): string
    {
        $account = hash('sha256', mb_strtolower(trim($identifier)));

        return 'login_attempts:' . (request()->ip() ?: 'unknown') . ':' . $account;
    }

    private function resolveUser(string $identifier, bool $withTrashed = false): ?User
    {
        $value = trim($identifier);

        if (filter_var($value, FILTER_VALIDATE_EMAIL)) {
            return $this->userQuery($withTrashed)->where('email', $value)->first();
        }

        // Username.
        if (preg_match('/^[a-zA-Z0-9_]{3,}$/', $value)) {
            $byUsername = $this->userQuery($withTrashed)->where('username', $value)->first();
            if ($byUsername) {
                return $byUsername;
            }
        }

        $digits = preg_replace('/\D+/', '', $value);

        if (strlen($digits) >= 8) {
            $variants = [$digits];

            if (str_starts_with($digits, '0')) {
                $variants[] = '62' . substr($digits, 1);
            } elseif (str_starts_with($digits, '62')) {
                $variants[] = '0' . substr($digits, 2);
            }

            $byPhone = $this->userQuery($withTrashed)->whereIn('phone', $variants)->first();
            if ($byPhone) {
                return $byPhone;
            }
        }

        return null;
    }

    private function userQuery(bool $withTrashed = false)
    {
        return $withTrashed ? User::withTrashed() : User::query();
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
            'identifier' => 'required|string',
        ]);

        $user = $this->resolveUser($data['identifier']);

        if (!$user || !$user->canUseLoginMethod('otp')) {
            $logUser = $user ?? $this->resolveUser($data['identifier'], true);
            app(LoginTracker::class)->recordFailed($logUser, 'otp', $data['identifier']);
            app(AuditLogger::class)->log('auth.otp_failed', 'Permintaan OTP gagal: ' . $data['identifier'], identifier: $data['identifier']);

            return response()->json(['message' => 'Nomor/akun tidak ditemukan.'], 422);
        }

        $otp = (string) random_int(100000, 999999);
        session()->put('otp_' . $user->id, ['code' => Hash::make($otp), 'expires_at' => now()->addMinutes(5)]);
        session()->put('otp_target_' . $user->id, $data['identifier']);

        app(NotificationService::class)->sendOtp($user, $user->phone ?? $data['identifier'], $otp);

        app(AuditLogger::class)->log('auth.otp_sent', 'OTP dikirim untuk ' . ($user->email ?? $data['identifier']));

        return response()->json([
            'message' => 'OTP terkirim via WhatsApp/Email (jika terkonfigurasi).',
            'dev_otp' => config('app.env') !== 'production' ? $otp : null,
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $data = $request->validate([
            'identifier' => 'required|string',
            'otp' => 'required|string',
        ]);

        $user = $this->resolveUser($data['identifier']);

        $stored = session()->pull('otp_' . $user?->id);

        if (!$user || !$stored || !Hash::check($data['otp'], $stored['code']) || now()->greaterThan($stored['expires_at'])) {
            $logUser = $user ?? $this->resolveUser($data['identifier'], true);
            app(LoginTracker::class)->recordFailed($logUser, 'otp', $data['identifier']);
            app(AuditLogger::class)->log('auth.otp_verify_failed', 'Verifikasi OTP gagal: ' . $data['identifier'], identifier: $data['identifier']);

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

    /**
     * Lupa password / akun: buat token recovery + kirim magic link (dan OTP via mekanisme existing).
     */
    public function forgot(Request $request)
    {
        $data = $request->validate([
            'identifier' => 'required|string',
        ]);

        $identifier = trim($data['identifier']);
        $user = $this->resolveUser($identifier);

        if (!$user) {
            return response()->json(['message' => 'Akun tidak ditemukan.'], 422);
        }

        if (!$user->isClient()) {
            return response()->json(['message' => 'Akun bukan portal klien.'], 422);
        }

        $token = ClientAccessToken::createToken($user, 'recovery');

        app(NotificationService::class)->send(
            NotificationType::PASSWORD_RESET,
            $user,
            ['name' => $user->name, 'url' => $token->url]
        );

        app(AuditLogger::class)->log('auth.forgot', 'Permintaan reset password: ' . $user->email, $user);

        return response()->json(['message' => 'Tautan reset kata sandi telah dikirim ke WhatsApp/Email Anda.']);
    }

    private function resolvePasswordToken(string $token): ?\App\Models\ClientAccessToken
    {
        return \App\Models\ClientAccessToken::where('token', $token)
            ->whereIn('purpose', ['recovery'])
            ->valid()
            ->first();
    }

    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $token = $this->resolvePasswordToken($data['token']);
        if (!$token || !$token->user) {
            return response()->json(['message' => 'Tautan reset tidak valid atau sudah kadaluarsa.'], 422);
        }

        $token->user->update(['password' => Hash::make($data['password'])]);
        $token->update(['used_at' => now()]);

        app(AuditLogger::class)->log('auth.password_reset', 'Kata sandi direset via tautan: ' . $token->user->email, $token->user);

        return response()->json(['message' => 'Kata sandi berhasil direset. Silakan masuk.']);
    }

    /**
     * Set password pertama (aktivaasi akun baru / invite). Token purpose 'invite'.
     */
    public function setPassword(Request $request)
    {
        $data = $request->validate([
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $token = \App\Models\ClientAccessToken::where('token', $data['token'])->valid()->first();

        if (!$token || !$token->user) {
            return response()->json(['message' => 'Tautan aktivasi tidak valid atau sudah kadaluarsa.'], 422);
        }

        app(\App\Services\ClientRegistrationService::class)->activate(
            $token->user,
            $data['password']
        );

        return response()->json(['message' => 'Akun berhasil diaktifkan. Silakan masuk.']);
    }

    private function userPayload($user): array
    {
        return [
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->primaryRole(),
            'roles' => $user->getRoleNames()->values(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
            'avatar' => $user->avatar(),
            'bio' => $user->bio,
        ];
    }
}
