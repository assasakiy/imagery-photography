<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daftar — Sopian Lalu Imagery</title>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .card { max-width: 28rem; width: 100%; background: #fff; border-radius: 0.75rem; box-shadow: 0 4px 24px rgba(0,0,0,0.08); padding: 2rem; }
        h1 { font-size: 1.5rem; font-weight: 700; text-align: center; color: #111827; }
        .subtitle { text-align: center; color: #6b7280; margin-top: 0.5rem; font-size: 0.875rem; }
        label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.375rem; }
        input[type="text"], input[type="email"], input[type="password"], input[type="tel"] {
            width: 100%; padding: 0.625rem 0.875rem; border: 1px solid #d1d5db; border-radius: 0.5rem;
            font-size: 0.875rem; color: #111827; outline: none; transition: border-color 0.15s;
        }
        input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
        .btn { width: 100%; padding: 0.625rem; border: none; border-radius: 0.5rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .btn-primary { background: #6366f1; color: #fff; }
        .btn-primary:hover { background: #4f46e5; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-outline { background: transparent; border: 1px solid #d1d5db; color: #374151; }
        .btn-outline:hover { background: #f9fafb; }
        .error { background: #fef2f2; border: 1px solid #fca5a5; color: #dc2626; padding: 0.625rem 0.875rem; border-radius: 0.5rem; font-size: 0.8125rem; margin-bottom: 1rem; }
        .otp-input { display: flex; gap: 0.5rem; justify-content: center; margin: 1.5rem 0; }
        .otp-input input { width: 3rem; text-align: center; font-size: 1.25rem; font-weight: 700; letter-spacing: 0.125rem; padding: 0.75rem 0; border: 2px solid #d1d5db; border-radius: 0.5rem; }
        .otp-input input:focus { border-color: #6366f1; }
        .footer { margin-top: 1.5rem; text-align: center; font-size: 0.8125rem; color: #6b7280; }
        .footer a { color: #6366f1; text-decoration: none; }
        .footer a:hover { text-decoration: underline; }
        .dev-otp { background: #fffbeb; border: 1px solid #fbbf24; color: #92400e; padding: 0.5rem; border-radius: 0.5rem; font-size: 0.8125rem; text-align: center; margin-bottom: 1rem; font-family: monospace; }
        .step-indicator { display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1.5rem; }
        .step-dot { width: 0.5rem; height: 0.5rem; border-radius: 9999px; background: #d1d5db; }
        .step-dot.active { background: #6366f1; width: 1.5rem; }
    </style>
</head>
<body>
    <div class="card" x-data="register()" x-cloak>
        {{-- Step 1: Form nama + email --}}
        <template x-if="step === 'form'">
            <div>
                <h1>Daftar</h1>
                <p class="subtitle">Isi data Anda, lalu verifikasi melalui OTP</p>

                <div x-show="error" class="error" x-text="error"></div>

                <div style="margin-top:1.25rem">
                    <label for="name">Nama Lengkap</label>
                    <input type="text" id="name" x-model="name" placeholder="Contoh: Ahmad" required autofocus />
                </div>

                <div style="margin-top:1rem">
                    <label for="email">Email</label>
                    <input type="email" id="email" x-model="email" placeholder="anda@email.com" required />
                </div>

                <div style="margin-top:1.5rem">
                    <button class="btn btn-primary" :disabled="loading || !name.trim() || !email.trim()" @click="sendOtp()">
                        <span x-show="!loading">Kirim OTP</span>
                        <span x-show="loading">Mengirim...</span>
                    </button>
                </div>
            </div>
        </template>

        {{-- Step 2: Verifikasi OTP --}}
        <template x-if="step === 'otp'">
            <div>
                <div class="step-indicator">
                    <div class="step-dot"></div>
                    <div class="step-dot active"></div>
                </div>

                <h1>Verifikasi Email</h1>
                <p class="subtitle">Masukkan 6 digit kode yang dikirim ke <strong x-text="email"></strong></p>

                <div x-show="error" class="error" x-text="error"></div>
                <div x-show="devOtp" class="dev-otp">
                    <strong>Dev OTP:</strong> <span x-text="devOtp"></span>
                </div>

                <div class="otp-input">
                    <template x-for="(digit, i) in otpDigits" :key="i">
                        <input type="tel" maxlength="1" :id="'otp-' + i" x-model="otpDigits[i]"
                            @input="handleOtpInput($event, i)"
                            @keydown.backspace="handleOtpBackspace($event, i)"
                            @paste="handleOtpPaste($event)" />
                    </template>
                </div>

                <button class="btn btn-primary" :disabled="loading || otpDigits.join('').length < 6" @click="verifyOtp()">
                    <span x-show="!loading">Verifikasi</span>
                    <span x-show="loading">Memverifikasi...</span>
                </button>

                <div class="footer">
                    <button @click="resendOtp()" :disabled="resendCooldown > 0" style="background:none;border:none;color:#6366f1;cursor:pointer;font-size:0.8125rem;text-decoration:underline;" x-text="resendCooldown > 0 ? `Kirim ulang dalam ${resendCooldown}s` : 'Kirim ulang OTP'"></button>
                </div>

                <div class="footer" style="margin-top:0.75rem">
                    <a href="#" @click.prevent="step = 'form'; otpDigits = ['', '', '', '', '', '']; error = ''">Ganti email</a>
                </div>
            </div>
        </template>
    </div>

    <script>
    function register() {
        return {
            step: 'form',
            name: '',
            email: '',
            otpDigits: ['', '', '', '', '', ''],
            error: '',
            devOtp: '',
            loading: false,
            resendCooldown: 0,

            async ensureCsrf() {
                const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
                if (!match) {
                    await fetch('/sanctum/csrf-cookie', { credentials: 'same-origin' });
                }
            },

            xsrfToken() {
                const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
                return match ? decodeURIComponent(match[1]) : '';
            },

            async sendOtp() {
                this.error = '';
                this.loading = true;
                await this.ensureCsrf();
                try {
                    const res = await fetch('/api/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': this.xsrfToken() },
                        credentials: 'same-origin',
                        body: JSON.stringify({ name: this.name.trim(), email: this.email.trim() }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || 'Gagal mengirim OTP.');
                    this.devOtp = data.dev_otp || '';
                    this.step = 'otp';
                    this.startResendCooldown();
                    this.$nextTick(() => document.getElementById('otp-0')?.focus());
                } catch (e) {
                    this.error = e.message;
                } finally {
                    this.loading = false;
                }
            },

            async verifyOtp() {
                this.error = '';
                const code = this.otpDigits.join('');
                if (code.length < 6) return;
                this.loading = true;
                try {
                    const res = await fetch('/api/subscribe/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': this.xsrfToken() },
                        credentials: 'same-origin',
                        body: JSON.stringify({ email: this.email.trim(), otp: code }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || 'Verifikasi gagal.');
                    window.location.href = '/dashboard';
                } catch (e) {
                    this.error = e.message;
                    this.otpDigits = ['', '', '', '', '', ''];
                    this.$nextTick(() => document.getElementById('otp-0')?.focus());
                } finally {
                    this.loading = false;
                }
            },

            async resendOtp() {
                this.error = '';
                this.loading = true;
                await this.ensureCsrf();
                try {
                    const res = await fetch('/api/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-XSRF-TOKEN': this.xsrfToken() },
                        credentials: 'same-origin',
                        body: JSON.stringify({ name: this.name.trim(), email: this.email.trim() }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.message || 'Gagal mengirim OTP.');
                    this.devOtp = data.dev_otp || '';
                    this.startResendCooldown();
                } catch (e) {
                    this.error = e.message;
                } finally {
                    this.loading = false;
                }
            },

            startResendCooldown() {
                this.resendCooldown = 60;
                const t = setInterval(() => {
                    this.resendCooldown--;
                    if (this.resendCooldown <= 0) clearInterval(t);
                }, 1000);
            },

            handleOtpInput(e, i) {
                const val = e.target.value.replace(/\D/g, '');
                this.otpDigits[i] = val.slice(-1);
                if (val && i < 5) document.getElementById('otp-' + (i + 1))?.focus();
            },

            handleOtpBackspace(e, i) {
                if (!this.otpDigits[i] && i > 0) {
                    this.otpDigits[i - 1] = '';
                    document.getElementById('otp-' + (i - 1))?.focus();
                }
            },

            handleOtpPaste(e) {
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
                for (let i = 0; i < 6; i++) this.otpDigits[i] = text[i] || '';
                document.getElementById('otp-' + Math.min(text.length, 5))?.focus();
            },
        };
    }
    </script>
</body>
</html>
