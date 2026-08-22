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

        // Cek user yang mungkin trashed
        $user = $this->resolveUser($identifier, true);

        if ($user && $user->trashed() && $user->canUseLoginMethod('password') && Hash::check($data['password'], $user->password)) {
            $this->restoreIfTrashed($user);
        } else if ($user && $user->trashed()) {
             // Jika trashed tapi kredensial salah, seolah-olah tidak ada (biarkan flow gagal standar berjalan)
             $user = null;
        }

        if (!$user || !$user->canUseLoginMethod('password') || !Hash::check($data['password'], $user->password)) {
            $logUser = $user ?? $this->resolveUser($identifier, true);
            app(LoginTracker::class)->recordFailed($logUser, 'password', $identifier);
            app(AuditLogger::class)->log('auth.login_failed', 'Percobaan login gagal: ' . $identifier, identifier: $identifier);

            throw ValidationException::withMessages([
                'email' => 'Email/ponsel atau kata sandi salah.',
            ]);
        }

        ApiThrottle::reset('auth.login', ['identifier' => $identifier]);

        $remember = ($data['remember'] ?? false);
        Auth::login($user, $remember);
        $this->applyRememberSession($request, $remember);

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

    private function restoreIfTrashed(\App\Models\User $user): void
    {
        if ($user->trashed()) {
            $user->restore();
            app(\App\Services\AuditLogger::class)->log('auth.restored', 'Akun otomatis dipulihkan saat login/registrasi ulang: ' . $user->email, $user);
            session()->put('just_restored', true); // Untuk memberikan notifikasi ke user via endpoint response
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

        $payload = ['user' => $this->userPayload($user)];
        if (session()->pull('just_restored')) {
            $payload['restored'] = true;
        }
        return response()->json($payload);
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

        // Cek user yang mungkin trashed
        $user = $this->resolveUser($data['identifier'], true);

        if ($user && $user->trashed() && $user->canUseLoginMethod('otp')) {
            $this->restoreIfTrashed($user);
        } else if ($user && $user->trashed()) {
            $user = null;
        }

        if (!$user || !$user->canUseLoginMethod('otp')) {
            $logUser = $user ?? $this->resolveUser($data['identifier'], true);
            app(LoginTracker::class)->recordFailed($logUser, 'otp', $data['identifier']);
            app(AuditLogger::class)->log('auth.otp_failed', 'Permintaan OTP gagal: ' . $data['identifier'], identifier: $data['identifier']);
            return response()->json(['message' => 'Nomor/akun tidak ditemukan.'], 422);
        }

        $otp = (string) random_int(100000, 999999);
        session()->put('otp_' . $user->id, ['code' => Hash::make($otp), 'expires_at' => now()->addMinutes(5)]);
        session()->put('otp_target_' . $user->id, $data['identifier']);

        $reg  = app(\App\Services\ClientRegistrationService::class);
        $link = $reg->issueOtpLoginLink($user);

        // Tentukan channel override dari input identifier.
        $channelOverride = null;
        if (filter_var($data['identifier'], FILTER_VALIDATE_EMAIL)) {
            $channelOverride = 'email';
        } elseif (preg_match('/^[0-9+]+$/', $data['identifier'])) {
            $channelOverride = 'whatsapp';
        }

        app(NotificationService::class)->sendOtp($user, $user->phone ?? $data['identifier'], $otp, $data['identifier'], $link->url, 'login');

        app(AuditLogger::class)->log('auth.otp_sent', 'OTP+link login dikirim untuk ' . ($user->email ?? $data['identifier']));

        return response()->json([
            'message' => 'OTP dan tautan login telah dikirim (jika terkonfigurasi).',
            'dev_otp' => config('app.env') !== 'production' ? $otp : null,
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $data = $request->validate([
            'identifier' => 'required|string',
            'otp'        => 'required|string',
            'remember'   => 'boolean',
        ]);

        $user   = $this->resolveUser($data['identifier']);
        $stored = session()->get('otp_' . $user?->id);

        if (!$user || !$stored || !Hash::check($data['otp'], $stored['code']) || now()->greaterThan($stored['expires_at'])) {
            $logUser = $user ?? $this->resolveUser($data['identifier'], true);
            app(LoginTracker::class)->recordFailed($logUser, 'otp', $data['identifier']);
            app(AuditLogger::class)->log('auth.otp_verify_failed', 'Verifikasi OTP gagal: ' . $data['identifier'], identifier: $data['identifier']);
            return response()->json(['message' => 'Kode OTP salah atau kadaluarsa.'], 422);
        }

        $reg = app(\App\Services\ClientRegistrationService::class);
        $reg->invalidateOtpAndLinks($user);
        ApiThrottle::reset('otp.verify', ['identifier' => $data['identifier']]);

        if ($user->status === 'pending') {
            // Belum punya password — wajib set-password dulu.
            $token = $reg->issueSubscribeLink($user);
            app(AuditLogger::class)->log('auth.otp_verified_pending', 'OTP valid, user pending, arahkan set-password: ' . $user->email);
            return response()->json([
                'require_password'   => true,
                'set_password_token' => $token->token,
            ]);
        }

        Auth::login($user);
        $this->applyRememberSession($request, $data['remember'] ?? false);
        $this->afterLogin($user, 'otp');

        $payload = ['user' => $this->userPayload($user)];
        if (session()->pull('just_restored')) {
            $payload['restored'] = true;
        }
        return response()->json($payload);
    }

    /**
     * Subscribe blog: daftar akun baru role subscriber via email + OTP.
     * Email yang sudah terdaftar (client/subscriber/admin) tidak dibuat ulang,
     * cukup kirim OTP login biasa.
     */
    public function subscribe(Request $request)
    {
        $data = $request->validate([
            'name'  => 'required|string|max:100',
            'email' => 'required|email|max:190',
        ]);

        $email = strtolower(trim($data['email']));
        $reg   = app(\App\Services\ClientRegistrationService::class);

        $user  = $this->resolveUser($email);
        $isNew = false;

        if (!$user) {
            $user  = $reg->ensureUser(['email' => $email, 'name' => $data['name']], 'subscriber');
            $isNew = true;
            app(AuditLogger::class)->log('auth.subscribe', 'Subscriber baru (pending) didaftarkan: ' . $email, $user);
        }

        if (!$user->canUseLoginMethod('otp')) {
            return response()->json(['message' => 'Login via OTP tidak aktif untuk akun ini.'], 422);
        }

        // Cek OTP sebelumnya masih valid di session — jangan buat OTP baru jika masih ada.
        $existingOtp = session()->get('otp_' . $user->id);
        $otpStillValid = $existingOtp && now()->lessThan($existingOtp['expires_at']);

        if (!$otpStillValid) {
            $otp = (string) random_int(100000, 999999);
            session()->put('otp_' . $user->id, ['code' => Hash::make($otp), 'expires_at' => now()->addMinutes(5)]);
            session()->put('otp_target_' . $user->id, $email);
            session()->put('subscribe_pending_' . $user->id, $isNew);

            // Kirim OTP + link aktivasi bersamaan (khusus subscribe, dipaksa via email).
            $link = $reg->issueSubscribeLink($user);
            app(NotificationService::class)->sendOtp($user, $user->phone ?? $email, $otp, $email, $link->url, 'subscribe');
            
            app(AuditLogger::class)->log('auth.otp_sent', 'OTP+link subscribe dikirim untuk ' . $email, $user);
        } else {
            $otp = null;
            app(AuditLogger::class)->log('auth.otp_reused', 'OTP subscribe masih valid, tidak dikirim ulang: ' . $email, $user);
        }

        return response()->json([
            'message'   => 'Kode OTP dan tautan aktivasi telah dikirim ke ' . ($user->phone ?? $email) . '.',
            'is_new'    => $isNew,
            'otp_valid' => $otpStillValid,
            'dev_otp'   => config('app.env') !== 'production' ? $otp : null,
        ]);
    }

    /**
     * Verifikasi OTP subscribe.
     * - User baru (pending): return token set-password. Akun aktif setelah set password.
     * - User lama (sudah active): langsung login.
     * Menggunakan OTP → invalidate OTP + link sekaligus.
     */
    public function subscribeVerify(Request $request)
    {
        $data = $request->validate([
            'email'   => 'required|email|max:190',
            'otp'     => 'required|string',
            'remember' => 'boolean',
        ]);

        $email = strtolower(trim($data['email']));
        $user  = $this->resolveUser($email);
        $reg   = app(\App\Services\ClientRegistrationService::class);

        $stored = session()->get('otp_' . $user?->id);
        $isNew  = (bool) session()->get('subscribe_pending_' . $user?->id);

        if (!$user || !$stored || !Hash::check($data['otp'], $stored['code']) || now()->greaterThan($stored['expires_at'])) {
            app(LoginTracker::class)->recordFailed($user, 'otp', $email);
            app(AuditLogger::class)->log('auth.otp_verify_failed', 'Verifikasi OTP subscribe gagal: ' . $email, $user);
            return response()->json(['message' => 'Kode OTP salah atau kadaluarsa.'], 422);
        }

        // Invalidate OTP session + semua link subscribe/otp_login.
        $reg->invalidateOtpAndLinks($user);
        ApiThrottle::reset('subscribe.verify', ['identifier' => $email]);

        if ($user->status === 'pending') {
            // User baru: belum buat password. Return token set-password, jangan login dulu.
            $token = $reg->issueSubscribeLink($user);
            app(AuditLogger::class)->log('auth.subscribe_otp_verified', 'OTP subscribe valid, menunggu set-password: ' . $email, $user);
            return response()->json([
                'require_password' => true,
                'set_password_token' => $token->token,
            ]);
        }

        // User lama (sudah active) → langsung login.
        Auth::login($user);
        $this->applyRememberSession($request, $data['remember'] ?? false);
        $this->afterLogin($user, 'otp');
        app(AuditLogger::class)->log('auth.subscribe_activated', 'Subscriber login via OTP: ' . $email, $user);

        $payload = ['user' => $this->userPayload($user)];
        if (session()->pull('just_restored')) {
            $payload['restored'] = true;
        }
        return response()->json($payload);
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

        app(NotificationService::class)->sendOtp($user, $user->phone ?? $email, $otp, $email, null, 'subscribe');

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
            'email'    => 'required|email|max:190',
            'otp'      => 'required|string',
            'password' => 'nullable|string|min:8|confirmed',
            'remember' => 'boolean',
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
        $this->applyRememberSession($request, $data['remember'] ?? false);

        $this->afterLogin($user, 'otp');

        $payload = ['user' => $this->userPayload($user)];
        if (session()->pull('just_restored')) {
            $payload['restored'] = true;
        }
        return response()->json($payload);
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

        if (!$user->isClient() && !$user->isSubscriber()) {
            return response()->json(['message' => 'Akun bukan portal klien atau subscriber.'], 422);
        }

        $token = ClientAccessToken::createToken($user, 'recovery');

        $otp = (string) random_int(100000, 999999);
        session()->put('recovery_otp_' . $user->id, ['code' => Hash::make($otp), 'expires_at' => now()->addMinutes(5)]);

        app(NotificationService::class)->sendOtp($user, $user->phone ?? $identifier, $otp, $identifier, $token->url, 'recovery');

        app(AuditLogger::class)->log('auth.forgot', 'Permintaan reset password (OTP+Link): ' . $user->email, $user);

        return response()->json([
            'message' => 'Tautan dan kode OTP reset kata sandi telah dikirim.',
            'dev_otp' => config('app.env') !== 'production' ? $otp : null,
        ]);
    }

    public function verifyForgotOtp(Request $request)
    {
        $data = $request->validate([
            'identifier' => 'required|string',
            'otp'        => 'required|string',
        ]);

        $user   = $this->resolveUser($data['identifier']);
        $stored = session()->pull('recovery_otp_' . $user?->id);

        if (!$user || !$stored || !Hash::check($data['otp'], $stored['code']) || now()->greaterThan($stored['expires_at'])) {
            app(AuditLogger::class)->log('auth.forgot_otp_failed', 'Verifikasi OTP reset gagal: ' . $data['identifier']);
            return response()->json(['message' => 'Kode OTP salah atau kadaluarsa.'], 422);
        }

        // OTP Valid. Karena Recovery Link sudah terbuat sebelumnya (saat forgot), 
        // kita cari token recovery milik user ini yang masih pending.
        $token = \App\Models\ClientAccessToken::where('user_id', $user->id)
            ->where('purpose', 'recovery')
            ->valid()
            ->where('status', 'pending')
            ->latest()
            ->first();

        if (!$token) {
            return response()->json(['message' => 'Sesi recovery tidak valid, harap minta ulang.'], 422);
        }

        app(AuditLogger::class)->log('auth.forgot_otp_success', 'OTP reset valid: ' . $user->email, $user);

        return response()->json([
            'recovery_token' => $token->token,
        ]);
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
     * Set password pertama (aktivasi akun baru via invite/subscribe).
     * Jika token purpose 'subscribe' → aktifkan akun + auto-login.
     * Jika token purpose 'invite' (client) → aktifkan, redirect ke login.
     * Jika tanpa token → user sudah login (ubah password opsional Google user).
     */
    public function setPassword(Request $request)
    {
        $data = $request->validate([
            'token'    => 'nullable|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user      = null;
        $purpose   = null;
        $tokenModel = null;

        if (!empty($data['token'])) {
            $tokenModel = ClientAccessToken::where('token', $data['token'])
                ->whereIn('purpose', ['invite', 'subscribe'])
                ->valid()
                ->where('status', 'pending')
                ->with('user')
                ->first();

            if (!$tokenModel || !$tokenModel->user) {
                return response()->json(['message' => 'Tautan aktivasi tidak valid atau sudah kadaluarsa.'], 422);
            }

            $user    = $tokenModel->user;
            $purpose = $tokenModel->purpose;
        } else {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['message' => 'Sesi tidak ditemukan.'], 422);
            }
        }

        $reg = app(\App\Services\ClientRegistrationService::class);
        $reg->activate($user, $data['password']);

        // Subscribe flow: auto-login setelah set password, akun langsung bisa dipakai.
        if ($purpose === 'subscribe') {
            Auth::login($user->fresh());
            session()->regenerate();
            $this->afterLogin($user->fresh(), 'password');
            app(AuditLogger::class)->log('auth.subscribe_activated', 'Subscriber diaktifkan via set-password: ' . $user->email, $user);
            return response()->json([
                'activated' => true,
                'user'      => $this->userPayload($user->fresh()),
            ]);
        }

        return response()->json(['message' => 'Akun berhasil diaktifkan. Silakan masuk.']);
    }

    /**
     * Consume link akses (purpose=subscribe atau otp_login) via URL /access/{token}.
     * - subscribe  → return token set-password (wajib buat password)
     * - otp_login  → auto-login
     * Menggunakan link → invalidate OTP session + link lainnya.
     */
    public function consumeAccessLink(Request $request, string $token)
    {
        $accessToken = ClientAccessToken::where('token', $token)
            ->whereIn('purpose', ['subscribe', 'otp_login'])
            ->valid()
            ->where('status', 'pending')
            ->with('user')
            ->first();

        if (!$accessToken || !$accessToken->user) {
            return response()->json(['message' => 'Tautan tidak valid atau sudah kadaluarsa.'], 422);
        }

        $user    = $accessToken->user;
        $purpose = $accessToken->purpose;
        $reg     = app(\App\Services\ClientRegistrationService::class);

        // Invalidate OTP session + semua link sejenis.
        $reg->invalidateOtpAndLinks($user);
        // Token ini sendiri sudah di-invalidate oleh invalidateOtpAndLinks,
        // tapi kita issue token baru untuk set-password agar tetap punya token valid.

        if ($purpose === 'subscribe') {
            // Wajib set-password — terbitkan token baru khusus untuk set-password.
            $newToken = $reg->issueSubscribeLink($user);
            app(AuditLogger::class)->log('auth.subscribe_link_consumed', 'Link subscribe diklik, arahkan set-password: ' . $user->email, $user);
            return response()->json([
                'require_password'   => true,
                'set_password_token' => $newToken->token,
                'name'               => $user->name,
            ]);
        }

        // otp_login → langsung login.
        Auth::login($user);
        session()->regenerate();
        $this->applyRememberSession($request, false);
        $this->afterLogin($user, 'otp');
        app(AuditLogger::class)->log('auth.otp_link_consumed', 'Link OTP login diklik: ' . $user->email, $user);

        $payload = ['user' => $this->userPayload($user)];
        if (session()->pull('just_restored')) {
            $payload['restored'] = true;
        }
        return response()->json($payload);
    }

    private function applyRememberSession(Request $request, bool $remember): void
    {
        $settings = app(RuntimeSettings::class);
        if ($remember && $settings->loginRememberEnabled()) {
            $days = $settings->loginRememberDays();
            $request->session()->put('login_remember_days', $days);
            $request->session()->put('login_remember_expires_at', now()->addDays($days)->timestamp);
        }
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
            'has_password' => !is_null($user->getAuthPassword()),
        ];
    }
}
