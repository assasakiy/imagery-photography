import { csrfToken } from './utils';

export function initSubscribeModal() {
    const subscribeModal = document.querySelector('[data-subscribe-modal]');
    if (!subscribeModal) return;

    const subscribeForm = document.querySelector('[data-subscribe-form]');
    const subscribeOtpForm = document.querySelector('[data-subscribe-otp-form]');
    const subscribeName = document.querySelector('[data-subscribe-name]');
    const subscribeEmail = document.querySelector('[data-subscribe-email]');
    const subscribeOtp = document.querySelector('[data-subscribe-otp]');
    const subscribeOtpTarget = document.querySelector('[data-subscribe-otp-target]');
    const subscribeOtpError = document.querySelector('[data-subscribe-otp-error]');
    const subscribeTitle = document.querySelector('[data-subscribe-title]');
    const subscribePasswordForm = document.querySelector('[data-subscribe-password-form]');
    const subscribePassword = document.querySelector('[data-subscribe-password]');
    const subscribePasswordConfirm = document.querySelector('[data-subscribe-password-confirm]');
    const subscribePasswordError = document.querySelector('[data-subscribe-password-error]');

    let subscribeSetPasswordToken = null;
    const returnUrl = window.location.href;

    const openSubscribe = () => {
        subscribeModal.classList.remove('hidden');
        subscribeModal.classList.add('flex');
        if (subscribeOtpError) subscribeOtpError.textContent = '';
        const otpActive = subscribeOtpForm && !subscribeOtpForm.classList.contains('hidden');
        const pwActive  = subscribePasswordForm && !subscribePasswordForm.classList.contains('hidden');
        if (!otpActive && !pwActive) {
            subscribeForm?.classList.remove('hidden');
            subscribeOtpForm?.classList.add('hidden');
            subscribePasswordForm?.classList.add('hidden');
            subscribeForm?.querySelector('input')?.focus();
        }
    };

    const closeSubscribe = () => {
        subscribeModal.classList.add('hidden');
        subscribeModal.classList.remove('flex');
        subscribeForm?.classList.remove('hidden');
        subscribeOtpForm?.classList.add('hidden');
        subscribePasswordForm?.classList.add('hidden');
        subscribeSetPasswordToken = null;
    };

    document.querySelectorAll('[data-subscribe-open]').forEach((btn) => {
        btn.addEventListener('click', openSubscribe);
    });
    subscribeModal.querySelectorAll('[data-subscribe-close]').forEach((btn) => {
        btn.addEventListener('click', closeSubscribe);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !subscribeModal.classList.contains('hidden')) closeSubscribe();
    });

    subscribeForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = subscribeForm.querySelector('[data-subscribe-submit]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Mengirim…'; }

        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({
                    name: subscribeName?.value || '',
                    email: subscribeEmail?.value || '',
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data?.message || 'Gagal mengirim OTP. Coba lagi.');
                return;
            }
            if (subscribeOtpTarget) subscribeOtpTarget.textContent = (subscribeEmail?.value || '').trim();
            subscribeForm.classList.add('hidden');
            subscribeOtpForm.classList.remove('hidden');
            subscribeOtp?.focus();
            if (data.otp_valid && subscribeOtpError) {
                subscribeOtpError.style.color = '';
                subscribeOtpError.textContent = 'OTP sebelumnya masih berlaku. Gunakan kode yang sudah dikirim.';
            }
        } catch (err) {
            alert('Terjadi kesalahan. Coba lagi.');
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Kirim Kode OTP'; }
        }
    });

    subscribeForm?.querySelector('[data-subscribe-back]')?.addEventListener('click', () => {
        subscribeForm.classList.remove('hidden');
        subscribeOtpForm.classList.add('hidden');
    });

    subscribeOtpForm?.querySelector('[data-subscribe-back]')?.addEventListener('click', () => {
        subscribeOtpForm.classList.add('hidden');
        subscribeForm.classList.remove('hidden');
    });

    subscribeOtpForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = subscribeOtpForm.querySelector('[data-subscribe-otp-submit]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Memverifikasi…'; }
        if (subscribeOtpError) subscribeOtpError.textContent = '';

        try {
            const res = await fetch('/api/subscribe/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({
                    email: (subscribeEmail?.value || '').trim(),
                    otp: subscribeOtp?.value || '',
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (subscribeOtpError) subscribeOtpError.textContent = data?.message || 'Kode salah.';
                return;
            }
            if (data.require_password) {
                if (data.restored) {
                    if (subscribeTitle) subscribeTitle.textContent = 'Akun Dipulihkan';
                    const p = subscribePasswordForm?.querySelector('p');
                    if (p) p.textContent = 'Akun lama Anda telah dipulihkan. Buat kata sandi baru.';
                } else {
                    if (subscribeTitle) subscribeTitle.textContent = 'Buat Kata Sandi';
                }
                subscribeSetPasswordToken = data.set_password_token;
                subscribeOtpForm.classList.add('hidden');
                subscribePasswordForm?.classList.remove('hidden');
                subscribePassword?.focus();
            } else {
                if (subscribeTitle) subscribeTitle.textContent = data.restored ? 'Akun Dipulihkan!' : 'Berhasil!';
                setTimeout(() => { window.location.href = returnUrl; }, 500);
            }
        } catch (err) {
            if (subscribeOtpError) subscribeOtpError.textContent = 'Terjadi kesalahan. Coba lagi.';
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Verifikasi & Masuk'; }
        }
    });

    subscribePasswordForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = subscribePasswordForm.querySelector('[data-subscribe-password-submit]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Menyimpan…'; }
        if (subscribePasswordError) subscribePasswordError.textContent = '';

        const pw  = subscribePassword?.value || '';
        const pw2 = subscribePasswordConfirm?.value || '';
        if (pw.length < 8) {
            if (subscribePasswordError) subscribePasswordError.textContent = 'Kata sandi minimal 8 karakter.';
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Simpan & Masuk'; }
            return;
        }
        if (pw !== pw2) {
            if (subscribePasswordError) subscribePasswordError.textContent = 'Konfirmasi kata sandi tidak cocok.';
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Simpan & Masuk'; }
            return;
        }

        try {
            const res = await fetch('/api/set-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({
                    token: subscribeSetPasswordToken,
                    password: pw,
                    password_confirmation: pw2,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (subscribePasswordError) subscribePasswordError.textContent = data?.message || data?.errors?.password?.[0] || 'Gagal menyimpan kata sandi.';
                return;
            }
            if (subscribeTitle) subscribeTitle.textContent = 'Akun Berhasil Dibuat!';
            setTimeout(() => { window.location.href = returnUrl; }, 600);
        } catch (err) {
            if (subscribePasswordError) subscribePasswordError.textContent = 'Terjadi kesalahan. Coba lagi.';
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Simpan & Masuk'; }
        }
    });
}
