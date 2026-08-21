import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { ensureCsrf } from '../../api';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import { useTheme } from '../../context/ThemeContext';

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
            await api.post('/subscribe/verify', { email: email.trim(), otp: code });
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
                <div className="absolute right-4 top-4">
                    <button onClick={toggle} className="rounded-xl bg-surface p-2 text-ink-muted shadow-sm hover:text-ink" aria-label="Ganti tema">
                        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
                    </button>
                </div>

                <div className="card p-8">
                    <div className="mb-8 text-center">
                        {APP.logo ? (
                            <img src={APP.logo} alt={APP.siteName || 'Sopian Lalu Imagery'} className="mx-auto mb-4 h-16 w-16 rounded-2xl object-cover shadow-lg ring-1 ring-line" />
                        ) : (
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
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
