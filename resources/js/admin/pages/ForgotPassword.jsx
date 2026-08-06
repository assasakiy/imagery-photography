import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { ensureCsrf } from '../api';
import Icon from '../components/Icon';
import Button from '../components/Button';

const APP = window.APP_CONFIG || {};

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [identifier, setIdentifier] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await ensureCsrf();
            await api.post('/forgot', { identifier });
            navigate('/login', { state: { notice: 'Tautan dan kode reset telah dikirim ke WhatsApp/Email Anda.' } });
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
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
                            <Icon name="lock" size={28} />
                        </div>
                        <h1 className="text-xl font-bold text-ink">Lupa Kata Sandi</h1>
                        <p className="mt-1 text-sm text-ink-muted">Masukkan email atau nomor WhatsApp Anda.</p>
                    </div>

                    {error && (
                        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10">
                            <Icon name="alert-triangle" size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">Email / No. WhatsApp</label>
                            <input className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="email@contoh.com / 08xxxx" required />
                        </div>
                        <Button type="submit" icon="send" loading={loading} disabled={loading} className="w-full">
                            Kirim Tautan Reset
                        </Button>
                    </form>

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