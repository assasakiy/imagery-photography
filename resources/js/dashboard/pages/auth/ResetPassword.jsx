import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { ensureCsrf } from '../../api';
import Icon from '../../components/Icon';
import Button from '../../components/Button';

const APP = window.APP_CONFIG || {};

export default function ResetPassword() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const token = params.get('token') || '';
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await ensureCsrf();
            await api.post('/reset-password', { token, password, password_confirmation: confirm });
            navigate('/login', { state: { notice: 'Kata sandi berhasil direset. Silakan masuk.' } });
        } catch (err) {
            setError(err?.response?.data?.message || (err?.response?.data?.errors?.password?.[0]) || 'Gagal mereset kata sandi.');
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
                        <h1 className="text-xl font-bold text-ink">Reset Kata Sandi</h1>
                        <p className="mt-1 text-sm text-ink-muted">Buat kata sandi baru untuk akun Anda.</p>
                    </div>

                    {!token && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:bg-amber-500/10">Tautan tidak valid.</p>}

                    {error && (
                        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-500/10">
                            <Icon name="alert-triangle" size={18} />
                            {error}
                        </div>
                    )}

                    {token && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="label">Kata Sandi Baru</label>
                                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                            <div>
                                <label className="label">Ulangi Kata Sandi</label>
                                <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                            </div>
                            <Button type="submit" icon="check" loading={loading} disabled={loading} className="w-full">
                                Reset Kata Sandi
                            </Button>
                        </form>
                    )}

                    <p className="mt-6 text-center text-xs text-ink-muted">
                        <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">← Kembali ke login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}