import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { ensureCsrf } from '../../api';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import { useTheme } from '../../context/ThemeContext';
import PwaInstallButton from '../../components/PwaInstallButton';

const APP = window.APP_CONFIG || {};

export default function Register() {
    const { theme, toggle } = useTheme();
    const navigate = useNavigate();

    const [step, setStep] = useState('form');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [devOtp, setDevOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const otpRefs = useRef([]);

    const xsrfToken = () => {
        const m = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return m ? decodeURIComponent(m[1]) : '';
    };

    const startResendCooldown = () => {
        setResendCooldown(60);
        const t = setInterval(() => {
            setResendCooldown((c) => {
                if (c <= 1) { clearInterval(t); return 0; }
                return c - 1;
            });
        }, 1000);
    };

    const sendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await ensureCsrf();
            const res = await api.post('/subscribe', { name: name.trim(), email: email.trim() });
            setDevOtp(res.data.dev_otp || '');
            setStep('otp');
            startResendCooldown();
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch (err) {
            setError(err?.response?.data?.message || 'Gagal mengirim OTP.');
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async (e) => {
        e.preventDefault();
        const code = otpDigits.join('');
        if (code.length < 6) return;
        setError('');
        setLoading(true);
        try {
            await ensureCsrf();
            const { data } = await api.post('/subscribe/verify', { email: email.trim(), otp: code });
            if (data?.require_password) {
                navigate(`/set-password?token=${encodeURIComponent(data.set_password_token)}`);
                return;
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err?.response?.data?.message || 'Verifikasi gagal.');
            setOtpDigits(['', '', '', '', '', '']);
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } finally {
            setLoading(false);
        }
    };

    const resendOtp = async () => {
        setError('');
        setLoading(true);
        try {
            await ensureCsrf();
            const res = await api.post('/subscribe', { name: name.trim(), email: email.trim() });
            setDevOtp(res.data.dev_otp || '');
            startResendCooldown();
        } catch (err) {
            setError(err?.response?.data?.message || 'Gagal mengirim OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpInput = useCallback((i, val) => {
        const d = val.replace(/\D/g, '').slice(-1);
        setOtpDigits((prev) => {
            const next = [...prev];
            next[i] = d;
            return next;
        });
        if (d && i < 5) setTimeout(() => otpRefs.current[i + 1]?.focus(), 0);
    }, []);

    const handleOtpKeydown = useCallback((i, e) => {
        if (e.key === 'Backspace' && !otpDigits[i] && i > 0) {
            setOtpDigits((prev) => {
                const next = [...prev];
                next[i - 1] = '';
                return next;
            });
            setTimeout(() => otpRefs.current[i - 1]?.focus(), 0);
        }
    }, [otpDigits]);

    const handleOtpPaste = useCallback((e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
        setOtpDigits((prev) => {
            const next = [...prev];
            for (let i = 0; i < 6; i++) next[i] = text[i] || '';
            return next;
        });
        setTimeout(() => otpRefs.current[Math.min(text.length, 5)]?.focus(), 0);
    }, []);

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-4 dark:bg-zinc-950">
            <div className="w-full max-w-md">
                <div className="absolute right-4 top-4 flex items-center gap-2">
                    <PwaInstallButton compact />
                    <button onClick={toggle} className="rounded-xl bg-surface p-2 text-ink-muted shadow-sm hover:text-ink" aria-label="Ganti tema">
                        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
                    </button>
                </div>
                <div className="card p-8">
                    <div className="mb-8 text-center">
                        {APP.logo ? (
                            <img src={APP.logo} alt={APP.siteName || 'Sopian Lalu Imagery'} className="mx-auto mb-4 h-16 w-16 rounded-lg object-contain" />
                        ) : (
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl action-surface shadow-lg shadow-black/10">
                                <Icon name="camera" size={28} />
                            </div>
                        )}
                        <h1 className="text-xl font-bold text-ink">Daftar</h1>
                        <p className="mt-1 text-sm text-ink-muted">Buat akun untuk follow blog dan booking jasa</p>
                    </div>

                    {error && (
                        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10">
                            <Icon name="alert-triangle" size={18} />
                            {error}
                        </div>
                    )}

                    {APP.googleAuth && step === 'form' && (
                        <>
                            <a href={APP.googleRedirect} className="btn-outline w-full">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
                                    <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l2.85-2.22.81-.62Z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z" fill="#EA4335"/>
                                </svg>
                                Daftar dengan Google
                            </a>
                            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-ink-muted">
                                <span className="h-px flex-1 bg-line" />
                                atau
                                <span className="h-px flex-1 bg-line" />
                            </div>
                        </>
                    )}

                    {devOtp && (
                        <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-center font-mono text-sm font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                            Dev OTP: {devOtp}
                        </div>
                    )}

                    {step === 'form' ? (
                        <form onSubmit={sendOtp} className="space-y-4">
                            <div>
                                <label htmlFor="reg-name" className="label">
                                    Nama Lengkap <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="reg-name"
                                    type="text"
                                    required
                                    className="input"
                                    placeholder="Contoh: Ahmad"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label htmlFor="reg-email" className="label">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="reg-email"
                                    type="email"
                                    required
                                    className="input"
                                    placeholder="anda@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <Button type="submit" icon="send" loading={loading} disabled={loading || !name.trim() || !email.trim()} className="w-full">
                                Kirim OTP
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={verifyOtp} className="space-y-4">
                            <p className="text-center text-sm text-ink-muted">
                                Masukkan 6 digit kode yang dikirim ke <span className="font-semibold text-ink">{email}</span>
                            </p>
                            <div className="flex justify-center gap-2 py-2">
                                {otpDigits.map((d, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => { otpRefs.current[i] = el; }}
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={1}
                                        className="h-12 w-12 rounded-lg border-2 border-line bg-transparent text-center text-lg font-bold text-ink focus:border-brand-500 focus:outline-none dark:border-zinc-600"
                                        value={d}
                                        onChange={(e) => handleOtpInput(i, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeydown(i, e)}
                                        onPaste={i === 0 ? handleOtpPaste : undefined}
                                    />
                                ))}
                            </div>
                            <Button type="submit" icon="check" loading={loading} disabled={loading || otpDigits.join('').length < 6} className="w-full">
                                Verifikasi & Masuk
                            </Button>
                            <div className="flex flex-col items-center gap-2 text-sm">
                                <button type="button" onClick={resendOtp} disabled={resendCooldown > 0 || loading} className="font-medium text-brand-600 hover:underline disabled:opacity-50 dark:text-brand-400">
                                    {resendCooldown > 0 ? `Kirim ulang dalam ${resendCooldown}s` : 'Kirim ulang OTP'}
                                </button>
                                <button type="button" onClick={() => { setStep('form'); setOtpDigits(['', '', '', '', '', '']); setError(''); }} className="text-ink-muted hover:underline">
                                    Ganti email
                                </button>
                            </div>
                        </form>
                    )}

                    <p className="mt-6 text-center text-xs text-ink-muted">
                        Sudah punya akun?{' '}
                        <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                            Masuk
                        </Link>
                    </p>
                    <p className="mt-2 text-center text-xs text-ink-muted">
                        <a href="/" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                            ← Kembali ke beranda
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
