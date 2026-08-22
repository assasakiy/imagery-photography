import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { ensureCsrf } from '../../api';
import Icon from '../../components/Icon';
import Button from '../../components/Button';

const APP = window.APP_CONFIG || {};

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const otpCfg = APP.otp || { whatsapp: false, email: false };
    const waEnabled = otpCfg.whatsapp;
    const emailEnabled = otpCfg.email;

    const availableChannels = waEnabled && emailEnabled ? 'WhatsApp/Email' : waEnabled ? 'WhatsApp' : emailEnabled ? 'Email' : null;
    const inputLabel = waEnabled && emailEnabled ? 'Email / No. WhatsApp' : waEnabled ? 'No. WhatsApp' : 'Email';
    const inputPlaceholder = waEnabled && emailEnabled ? 'email@contoh.com / 08xxxx' : waEnabled ? '08xxxxxxxxxx' : 'email@contoh.com';

    

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await ensureCsrf();
            const { data } = await api.post('/forgot/verify', { identifier, otp: otpCode });
            navigate('/reset-password?token=' + data.recovery_token);
        } catch (err) {
            setError(err?.response?.data?.message || 'Kode salah.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await ensureCsrf();
            await api.post('/forgot', { identifier });
            setCooldown(60);
            setOtpSent(true);
            setError('');
        } catch (err) {
            setError(err?.response?.data?.message || 'Gagal mengirim. Periksa kembali.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-4 dark:bg-zinc-950">
            <div className="w-full max-w-md">
                <div className="card p-8">
                    <div className="mb-6 text-center">
                        {APP.logo ? (
                            <img src={APP.logo} alt={APP.siteName || 'Sopian Lalu Imagery'} className="mx-auto mb-4 h-16 w-16 rounded-2xl object-cover shadow-lg ring-1 ring-line" />
                        ) : (
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
                                <Icon name="lock" size={28} />
                            </div>
                        )}
                        <h1 className="text-xl font-bold text-ink">Lupa Kata Sandi</h1>
                        <p className="mt-1 text-sm text-ink-muted">Masukkan email atau nomor WhatsApp Anda.</p>
                    </div>

                    {!availableChannels ? (
                        <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:bg-amber-500/10">
                            <Icon name="alert-triangle" size={18} />
                            Fitur reset kata sandi belum tersedia karena layanan email dan WhatsApp sedang dinonaktifkan.
                        </div>
                    ) : null}

                    {error && (
                        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10">
                            <Icon name="alert-triangle" size={18} />
                            {error}
                        </div>
                    )}

                    {availableChannels && (
                        <form onSubmit={otpSent ? handleVerify : handleSubmit} className="space-y-4">
                            {!otpSent ? (
                                <div>
                                    <label className="label">{inputLabel}</label>
                                    <input className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={inputPlaceholder} required />
                                </div>
                            ) : (
                                <div>
                                    <p className="mb-4 text-sm text-ink-muted">Kode OTP dan tautan reset telah dikirim ke {availableChannels}. Masukkan kode atau klik tautan tersebut.</p>
                                    <label className="label">Kode OTP</label>
                                    <input className="input text-center text-xl tracking-widest" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="000000" inputMode="numeric" required />
                                </div>
                            )}
                            <Button type="submit" icon={otpSent ? "check" : "send"} loading={loading} disabled={loading || (!otpSent && cooldown > 0)} className="w-full">
                                {otpSent ? 'Verifikasi OTP' : cooldown > 0 ? `Tunggu (${cooldown}s)` : 'Kirim Tautan Reset'}
                            </Button>
                            
                            {otpSent && (
                                <p className="text-center text-xs text-ink-muted mt-4">
                                    Belum menerima kode?{' '}
                                    <button 
                                        type="button" 
                                        disabled={cooldown > 0 || loading} 
                                        onClick={handleSubmit}
                                        className="font-medium text-brand-600 hover:underline disabled:text-ink-muted disabled:no-underline dark:text-brand-400"
                                    >
                                        {cooldown > 0 ? `Tunggu (${cooldown}s)` : 'Kirim ulang'}
                                    </button>
                                </p>
                            )}
                        </form>
                    )}

                    <p className="mt-6 text-center text-xs text-ink-muted">
                        <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
                            ← Kembali ke login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}