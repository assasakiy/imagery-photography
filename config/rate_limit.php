<?php

/**
 * ApiThrottle — kebijakan rate limit pusat untuk endpoint API.
 *
 * Design principles:
 *  - Konfigurasi runtime (bukan const) agar nanti Admin bisa override via
 *    Settings UI; nilai yang disimpan di-backend selalu di-clamp antara
 *    floor dan ceiling, juga bila admin masukkan angka ekstrim.
 *  - Composite key: identitas limit dipilih per policy (ip+identifier,
 *    ip+account, email, user, ip). Identifier dilewatkan eksplisit oleh caller
 *    dan dinormalisasi (strtolower + trim).
 *  - Atomic: cek + hit dilakukan via RateLimiter::attempt() untuk mode
 *    attempt/request; mode valid hanya check (record dipanggil di controller
 *    setelah validasi sukses).
 *  - Cache driver WAJIB shared (Redis) di produksi, agar limit konsisten
 *    lintas server. File/array hanya untuk local dev.
 *
 * Mode:
 *  - 'attempt': counter naik setiap request yang melewati cek (gunakan untuk
 *    OTP send, OTP verify, login, forgot).
 *  - 'request': sama seperti attempt, khusus endpoint yang tidak butuh
 *    "valid" gating.
 *  - 'valid': cek-only di middleware; controller eksplisit memanggil
 *    ApiThrottle::record('policy.key') hanya setelah validasi request sukses.
 */

return [

    'policies' => [
        // --- OTP & auth (proteksi utama — floor tinggi) ---
        'otp.send' => [
            'limit'   => 5,
            'periode' => 900,      // 15 menit
            'scope'   => 'ip+identifier',
            'floor'   => 3,
            'ceiling' => 10,
            'mode'    => 'attempt',
            'reset_on_success' => true,   // OTP sukses dikirim → reset (bisa lanjut ke limit berikutnya)
        ],
        'otp.verify' => [
            'limit'   => 5,
            'periode' => 900,
            'scope'   => 'ip+identifier',
            'floor'   => 3,
            'ceiling' => 10,
            'mode'    => 'attempt',
            'reset_on_success' => true,   // kode benar → reset
        ],
        'auth.login' => [
            'limit'   => 5,
            'periode' => 900,
            'scope'   => 'ip+account',
            'floor'   => 3,
            'ceiling' => 20,
            'mode'    => 'attempt',
            'reset_on_success' => true,   // login sukses → reset counter
        ],
        'auth.forgot' => [
            'limit'   => 5,
            'periode' => 3600,
            'scope'   => 'ip+account',
            'floor'   => 3,
            'ceiling' => 10,
            'mode'    => 'attempt',
            'reset_on_success' => false,
        ],

        // --- Booking (forgiving terhadap typo gilir — valid only) ---
        'booking.create' => [
            'limit'   => 20,
            'periode' => 3600,
            'scope'   => 'email',
            'floor'   => 5,
            'ceiling' => 100,
            'mode'    => 'valid',
            'reset_on_success' => false,
        ],
        'booking.update' => [
            'limit'   => 60,
            'periode' => 3600,
            'scope'   => 'email',
            'floor'   => 5,
            'ceiling' => 200,
            'mode'    => 'valid',
            'reset_on_success' => false,
        ],

        // --- Upload / Payment / Contact (request-level IP) ---
        'upload' => [
            'limit'   => 30,
            'periode' => 60,
            'scope'   => 'user',
            'floor'   => 10,
            'ceiling' => 200,
            'mode'    => 'request',
            'reset_on_success' => false,
        ],
        'payment' => [
            'limit'   => 10,
            'periode' => 60,
            'scope'   => 'user',
            'floor'   => 5,
            'ceiling' => 100,
            'mode'    => 'request',
            'reset_on_success' => false,
        ],
        'contact' => [
            'limit'   => 10,
            'periode' => 3600,
            'scope'   => 'ip',
            'floor'   => 3,
            'ceiling' => 50,
            'mode'    => 'request',
            'reset_on_success' => false,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Secondary IP-level guard
    |--------------------------------------------------------------------------
    |
    | Untuk policy dengan mode 'valid' (mis. booking) yang perannya forgiving,
    | lapisan IP di bawah ini menangkap banjir request — valid maupun invalid —
    | sebelum request pernah sampai ke per-policy limiter. Nilainya longgar
    | relatif; hanya untuk mencegah DoS "almost-valid" payload.
    */
    'ip_guard' => [
        'requests_per_minute' => 100,
        'periode'             => 60,
        'scope'               => 'ip',
    ],
];
