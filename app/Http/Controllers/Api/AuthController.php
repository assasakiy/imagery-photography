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
use App\Support\ApiThrottle;
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

        $user = $this->resolveUser($identifier);

        if (!$user || !$user->canUseLoginMethod('password') || !Hash::check($data['password'], $user->password)) {
            $logUser = $user ?? $this->resolveUser($identifier, true);
            app(LoginTracker::class)->recordFailed($logUser, 'password', $identifier);
            app(AuditLogger::class)->log('auth.login_failed', 'Percobaan login gagal: ' . $identifier, identifier: $identifier);

            throw ValidationException::withMessages([
                'email' => 'Email/ponsel atau kata sandi salah.',
            ]);
        }

        ApiThrottle::reset('auth.login', ['identifier' => $identifier]);

        $settings = app(RuntimeSettings::class);
        $remember = $settings->loginRememberEnabled() && ($data['remember'] ?? false);

        if ($remember) {
            $request->session()->put('login_remember_days', $settings->loginRememberDays());
        }

        Auth::login($user, $remember);

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

    /**
     * Registrasi formal publik: akun baru langsung aktif sebagai client
     * (otomatis juga subscriber) dengan password.
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:190|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $email = strtolower(trim($data['email']));

        $user = app(\App\Services\ClientRegistrationService::class)->createUser([
            'email' => $email,
            'name' => $data['name'],
        ], 'client');

        $user->update([
            'password' => Hash::make($data['password']),
            'status' => 'active',
            'activated_at' => now(),
        ]);

        app(AuditLogger::class)->log('auth.register', 'Registrasi formal (client): ' . $email, $user);

        Auth::login($user);
        session()->regenerate();

        $this->afterLogin($user, 'password');

        return response()->json(['user' => $this->userPayload($user)]);
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

        // Reset rate limit pada verifikasi sukses (sudah dibuktikan)
        ApiThrottle::reset('otp.verify', ['identifier' => $data['identifier']]);

        Auth::login($user);

        $this->afterLogin($user, 'otp');

        return response()->json(['user' => $this->userPayload($user)]);
    }

    /**
     * Subscribe blog: daftar akun baru role subscriber via email + OTP.
     * Email yang sudah terdaftar (client/subscriber/admin) tidak dibuat ulang,
     * cukup kirim OTP login biasa.
     */
    public function subscribe(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:190',
        ]);

        $email = strtolower(trim($data['email']));

        $user = $this->resolveUser($email);
        $isNew = false;

        if (!$user) {
            $user = app(\App\Services\ClientRegistrationService::class)->ensureUser([
                'email' => $email,
                'name' => $data['name'],
            ], 'subscriber');

            $isNew = true;

            app(AuditLogger::class)->log('auth.subscribe', 'Subscriber baru (pending) didaftarkan: ' . $email, $user);
        }

        if (!$user->canUseLoginMethod('otp')) {
            return response()->json(['message' => 'Login via OTP tidak aktif untuk akun ini.'], 422);
        }

        $otp = (string) random_int(100000, 999999);
        session()->put('otp_' . $user->id, ['code' => Hash::make($otp), 'expires_at' => now()->addMinutes(5)]);
        session()->put('otp_target_' . $user->id, $email);
        session()->put('subscribe_pending_' . $user->id, $isNew);

        app(NotificationService::class)->sendOtp($user, $user->phone ?? $email, $otp);

        app(AuditLogger::class)->log('auth.otp_sent', 'OTP subscribe dikirim untuk ' . $email, $user);

        return response()->json([
            'message' => 'Kode OTP terkirim ke ' . ($user->phone ?? $email) . ' (jika terkonfigurasi).',
            'is_new' => $isNew,
            'dev_otp' => config('app.env') !== 'production' ? $otp : null,
        ]);
    }

    /**
     * Verifikasi OTP subscribe → aktifkan akun baru (subscriber) atau langsung login
     * jika akun sudah ada, lalu buat sesi.
     */
    public function subscribeVerify(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email|max:190',
            'otp' => 'required|string',
        ]);

        $email = strtolower(trim($data['email']));
        $user = $this->resolveUser($email);

        $stored = session()->pull('otp_' . $user?->id);
        $isNew = (bool) session()->pull('subscribe_pending_' . $user?->id);

        if (!$user || !$stored || !Hash::check($data['otp'], $stored['code']) || now()->greaterThan($stored['expires_at'])) {
            app(LoginTracker::class)->recordFailed($user, 'otp', $email);
            app(AuditLogger::class)->log('auth.otp_verify_failed', 'Verifikasi OTP subscribe gagal: ' . $email, $user);

            return response()->json(['message' => 'Kode OTP salah atau kadaluarsa.'], 422);
        }

        if ($isNew && $user) {
            $user->update([
                'status' => 'active',
                'activated_at' => now(),
            ]);
            if (!$user->hasRole('subscriber')) {
                $user->assignRole('subscriber');
            }

            app(AuditLogger::class)->log('auth.subscribe_activated', 'Subscriber diaktifkan: ' . $email, $user);
        }

        ApiThrottle::reset('subscribe.verify', ['identifier' => $email]);

        Auth::login($user);

        $this->afterLogin($user, 'otp');

        return response()->json(['user' => $this->userPayload($user)]);
    }

    /**
     * Registrasi client via OTP: buat user pending role client + kirim OTP.
     */
    public function registerOtp(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:190',
        ]);

        $email = strtolower(trim($data['email']));

        $user = $this->resolveUser($email);
        $isNew = false;

        if (!$user) {
            $user = app(\App\Services\ClientRegistrationService::class)->ensureUser([
                'email' => $email,
                'name' => $data['name'],
            ], 'client');

            $isNew = true;

            app(AuditLogger::class)->log('auth.register_otp', 'Client baru (pending) didaftarkan via OTP: ' . $email, $user);
        } else {
            if (!$user->hasRole('client')) {
                $user->assignRole('client');
            }
        }

        if (!$user->canUseLoginMethod('otp')) {
            return response()->json(['message' => 'Login via OTP tidak aktif untuk akun ini.'], 422);
        }

        $otp = (string) random_int(100000, 999999);
        session()->put('otp_' . $user->id, ['code' => Hash::make($otp), 'expires_at' => now()->addMinutes(5)]);
        session()->put('otp_target_' . $user->id, $email);
        session()->put('register_pending_' . $user->id, $isNew);

        app(NotificationService::class)->sendOtp($user, $user->phone ?? $email, $otp);

        app(AuditLogger::class)->log('auth.otp_sent', 'OTP registrasi client dikirim untuk ' . $email, $user);

        return response()->json([
            'message' => 'Kode OTP terkirim ke ' . ($user->phone ?? $email) . ' (jika terkonfigurasi).',
            'is_new' => $isNew,
            'dev_otp' => config('app.env') !== 'production' ? $otp : null,
        ]);
    }

    /**
     * Verifikasi OTP registrasi client → aktifkan akun + auto-login + opsional set password.
     */
    public function registerOtpVerify(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email|max:190',
            'otp' => 'required|string',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        $email = strtolower(trim($data['email']));
        $user = $this->resolveUser($email);

        $stored = session()->pull('otp_' . $user?->id);
        $isNew = (bool) session()->pull('register_pending_' . $user?->id);

        if (!$user || !$stored || !Hash::check($data['otp'], $stored['code']) || now()->greaterThan($stored['expires_at'])) {
            app(LoginTracker::class)->recordFailed($user, 'otp', $email);
            app(AuditLogger::class)->log('auth.otp_verify_failed', 'Verifikasi OTP registrasi gagal: ' . $email, $user);

            return response()->json(['message' => 'Kode OTP salah atau kadaluarsa.'], 422);
        }

        if ($isNew && $user) {
            $user->update([
                'status' => 'active',
                'activated_at' => now(),
            ]);
            if (!$user->hasRole('client')) {
                $user->assignRole('client');
            }

            app(AuditLogger::class)->log('auth.register_activated', 'Client diaktifkan via OTP: ' . $email, $user);
        }

        if (!empty($data['password']) && $user) {
            $user->update(['password' => Hash::make($data['password'])]);
        }

        ApiThrottle::reset('otp.verify', ['identifier' => $email]);

        Auth::login($user);
        session()->regenerate();

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
            'password' => 'required|string|min:8|confirmed',
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
            'token' => 'nullable|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = null;

        if (!empty($data['token'])) {
            $token = \App\Models\ClientAccessToken::where('token', $data['token'])->valid()->first();
            if (!$token || !$token->user) {
                return response()->json(['message' => 'Tautan aktivasi tidak valid atau sudah kadaluarsa.'], 422);
            }
            $user = $token->user;
        } else {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['message' => 'Sesi tidak ditemukan.'], 422);
            }
        }

        app(\App\Services\ClientRegistrationService::class)->activate(
            $user,
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
