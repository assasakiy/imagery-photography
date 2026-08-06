import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Icon from '../components/Icon';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { ensureCsrf } from '../api';
import { useTheme } from '../context/ThemeContext';

const APP = window.APP_CONFIG || {};

export default function Login() {
    const { login } = useAuth();
    const { theme, toggle } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const notice = location.state?.notice;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        try {
            await ensureCsrf();
            await login(email, password, remember);
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
                <div className="absolute right-4 top-4">
                    <button
                        onClick={toggle}
                        className="rounded-xl bg-surface p-2 text-ink-muted shadow-sm hover:text-ink"
                        aria-label="Ganti tema"
                    >
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

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        <div>
                            <label htmlFor="email" className="label">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                className="input"
                                placeholder="admin@imagery.my.id"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email[0]}</p>}
                        </div>

                        <div>
                            <label htmlFor="password" className="label">
                                Kata Sandi <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="input pr-12"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                >
                                    <Icon name={showPassword ? 'eye-off' : 'eye'} size={20} />
                                </button>
                            </div>
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

                    <p className="mt-6 text-center text-xs text-ink-muted">
                        <a href="/" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                            ← Kembali ke beranda
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
