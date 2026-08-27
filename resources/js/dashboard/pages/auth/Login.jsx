import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api, { ensureCsrf } from '../../api';
import { toast } from '../../lib/toast';
import Icon from '../../components/Icon';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import PwaInstallButton from '../../components/PwaInstallButton';

import { PasswordInput } from '../../components/ui';

const APP = window.APP_CONFIG || {};

export default function Login() {
    const { login, refresh } = useAuth();
    const { theme, toggle } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [mode, setMode] = useState('password');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [otpPhone, setOtpPhone] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const notice = location.state?.notice;

    const otpCfg = APP.otp || { enabled: false, whatsapp: false, email: false };
    const otpAvailable = otpCfg.enabled && (otpCfg.whatsapp || otpCfg.email);
    const otpLabel = otpCfg.whatsapp && otpCfg.email ? 'Email / No. WhatsApp' : otpCfg.whatsapp ? 'No. WhatsApp' : 'Email';
    const otpPlaceholder = otpCfg.whatsapp && otpCfg.email ? 'email@contoh.com / 08xxxxxxxxxx' : otpCfg.whatsapp ? '08xxxxxxxxxx' : 'email@contoh.com';

    

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const sendOtp = async (e) => {
        e.preventDefault();
        setErrors({});
        setOtpLoading(true);
        try {
            await ensureCsrf();
            await api.post('/send-otp', { identifier: otpPhone });
            setOtpSent(true);
            setCooldown(60);
        } catch (err) {
            setErrors({ form: err?.response?.data?.message || 'Gagal mengirim OTP.' });
        } finally {
            setOtpLoading(false);
        }
    };

    const verifyOtp = async (e) => {
        e.preventDefault();
        setOtpLoading(true);
        setErrors({});
        try {
            await ensureCsrf();
            const { data } = await api.post('/verify-otp', { identifier: otpPhone, otp: otpCode });
            if (data?.require_password) {
                navigate('/set-password?token=' + data.set_password_token);
                return;
            }
            if (data?.restored) {
                toast.success('Akun Anda berhasil dipulihkan dari penghapusan!');
            }
            await refresh();
            navigate('/dashboard');
        } catch (err) {
            setErrors({ form: err?.response?.data?.message || 'Kode OTP salah.' });
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        try {
            await ensureCsrf();
            const res = await login(email, password, remember);
            if (res?.restored) {
                toast.success('Akun Anda berhasil dipulihkan dari penghapusan!');
            }
            navigate('/dashboard');
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) {
                setErrors(data.errors);
            } else {
                setErrors({ form: data?.message || 'Terjadi kesalahan. Coba lagi.' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-4 dark:bg-zinc-950">
            <div className="w-full max-w-md">
                <div className="fixed right-4 top-4 z-20 flex items-center gap-1 rounded-xl border border-line bg-surface/90 p-1 shadow-sm backdrop-blur">
                    <PwaInstallButton compact />
                    <button onClick={toggle} className="group flex items-center gap-2 rounded-lg px-1.5 py-1 text-ink-muted hover:bg-surface-muted hover:text-ink" aria-label="Ganti tema">
                        <span className="relative flex h-7 w-12 shrink-0 items-center rounded-full bg-zinc-200 px-1 transition-colors duration-300 dark:bg-zinc-700">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 dark:translate-x-5 dark:shadow-md">
                                <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={12} className={theme === 'dark' ? 'text-brand-400' : 'text-amber-500'} />
                            </span>
                        </span>
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
                        <h1 className="text-xl font-bold text-ink">Selamat Datang</h1>
                        <p className="mt-1 text-sm text-ink-muted">Masuk ke dashboard {APP.siteName || 'Sopian Lalu Imagery'}</p>
                    </div>

                    {APP.googleAuth && (
                        <>
                            <a href={APP.googleRedirect} className="btn-outline w-full">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
                                    <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l2.85-2.22.81-.62Z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z" fill="#EA4335"/>
                                </svg>
                                Masuk dengan Google
                            </a>
                            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-ink-muted">
                                <span className="h-px flex-1 bg-line" />
                                atau
                                <span className="h-px flex-1 bg-line" />
                            </div>
                        </>
                    )}

                    {errors.form && (
                        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10">
                            <Icon name="alert-triangle" size={18} />
                            {errors.form}
                        </div>
                    )}

                    {notice && (
                        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10">
                            <Icon name="check" size={18} />
                            {notice}
                        </div>
                    )}

                    {mode === 'password' ? (
                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            <div>
                                <label htmlFor="email" className="label">
                                    Email / Username / No. WhatsApp <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="email"
                                    type="text"
                                    required
                                    autoComplete="username"
                                    className="input"
                                    placeholder="email / username / 08xxxxxxxxxx"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email[0]}</p>}
                            </div>

                            <div>
                                <label htmlFor="password" className="label">
                                    Kata Sandi <span className="text-red-500">*</span>
                                </label>
                                <PasswordInput
                                    id="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password[0]}</p>}
                            </div>

                            {APP.rememberEnabled && (
                                <div className="flex items-center justify-between">
                                    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
                                        <input
                                            type="checkbox"
                                            checked={remember}
                                            onChange={(e) => setRemember(e.target.checked)}
                                            className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
                                        />
                                        Jangan lupakan saya
                                    </label>
                                    <Link to="/forgot" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                                        Lupa Password?
                                    </Link>
                                </div>
                            )}
                            {!APP.rememberEnabled && (
                                <div className="flex justify-end">
                                    <Link to="/forgot" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                                        Lupa Password?
                                    </Link>
                                </div>
                            )}

                            <Button type="submit" icon="send" loading={loading} disabled={loading} className="w-full">
                                Masuk
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={otpSent ? verifyOtp : sendOtp} className="space-y-4" noValidate>
                            {!otpSent && (
                                <div>
                                    <label htmlFor="otpPhone" className="label">
                                        {otpLabel} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="otpPhone"
                                        type="text"
                                        required
                                        className="input"
                                        placeholder={otpPlaceholder}
                                        value={otpPhone}
                                        onChange={(e) => setOtpPhone(e.target.value)}
                                    />
                                </div>
                            )}
                            {otpSent && (
                                <div>
                                    <label htmlFor="otpCode" className="label">
                                        Kode OTP <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="otpCode"
                                        type="text"
                                        inputMode="numeric"
                                        required
                                        className="input"
                                        placeholder="6 digit"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value)}
                                    />
                                </div>
                            )}
                            <Button type="submit" icon={otpSent ? 'check' : 'send'} loading={otpLoading} disabled={otpLoading || (otpSent === false && cooldown > 0)} className="w-full">
                                {otpSent ? 'Verifikasi & Masuk' : cooldown > 0 ? `Tunggu (${cooldown}s)` : 'Kirim OTP'}
                            </Button>
                            {otpSent && (
                                <p className="text-center text-xs text-ink-muted">
                                    Belum menerima kode?{' '}
                                    <button 
                                        type="button" 
                                        disabled={cooldown > 0 || otpLoading} 
                                        onClick={sendOtp}
                                        className="font-medium text-brand-600 hover:underline disabled:text-ink-muted disabled:no-underline dark:text-brand-400"
                                    >
                                        {cooldown > 0 ? `Tunggu (${cooldown}s)` : 'Kirim ulang'}
                                    </button>
                                </p>
                            )}
                        </form>
                    )}

                    {otpAvailable && (
                        <div className="mt-4 flex items-center justify-between text-sm">
                            <button
                                type="button"
                                onClick={() => { setMode(mode === 'password' ? 'otp' : 'password'); setErrors({}); }}
                                className="font-medium text-brand-600 hover:underline dark:text-brand-400"
                            >
                                {mode === 'password' ? 'Masuk dengan OTP' : '← Masuk dengan kata sandi'}
                            </button>
                        </div>
                    )}

                    <p className="mt-6 text-center text-xs text-ink-muted">
                        Belum punya akun?{' '}
                        <Link to="/register" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                            Daftar
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
