import Icon from '../../../components/Icon';
import { statusBadge } from './constants';

function Toggle({ checked, onChange, disabled }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );
}

export default function AnalyticsTab({ form, set, save, dirty }) {
    const analyticsFields = ['analytics_enabled', 'cookie_banner_enabled', 'cookie_banner_message'];
    const dirtyAnalytics = dirty(analyticsFields);

    return (
        <div className="space-y-6">
            <div className="card divide-y divide-line overflow-hidden">
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 dark:text-brand-400">
                            <Icon name="trending-up" size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-ink">Analisis Kunjungan</h3>
                            <p className="text-sm text-ink-muted">Catat page view pengunjung situs publik untuk dashboard Analitik.</p>
                        </div>
                    </div>
                    <Toggle checked={!!form.analytics_enabled} onChange={(v) => set('analytics_enabled', v)} />
                </div>
                <div className="px-5 py-4">
                    <p className="text-sm text-ink-muted">
                        Tracking hanya berjalan setelah pengunjung <b className="text-ink">mengizinkan cookie analitik</b> (patuh UU Perlindungan Data Pribadi).
                        IP di-hash dan tidak disimpan dalam bentuk asli.
                    </p>
                    <p className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(!!form.analytics_enabled, 'Aktif', 'Nonaktif')}`}>
                        {form.analytics_enabled ? 'Analitik aktif' : 'Analitik nonaktif'}
                    </p>
                </div>
            </div>

            <div className="card divide-y divide-line overflow-hidden">
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/10 text-brand-600 dark:text-brand-400">
                            <Icon name="layers" size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-ink">Banner Preferensi Cookie</h3>
                            <p className="text-sm text-ink-muted">Tampilkan banner consent cookie di situs publik (opsi: terima semua / tolak / kustom).</p>
                        </div>
                    </div>
                    <Toggle checked={!!form.cookie_banner_enabled} onChange={(v) => set('cookie_banner_enabled', v)} />
                </div>
                <div className="px-5 py-4">
                    <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-ink">Teks Banner</span>
                        <textarea
                            value={form.cookie_banner_message || ''}
                            onChange={(e) => set('cookie_banner_message', e.target.value)}
                            rows={3}
                            disabled={!form.cookie_banner_enabled}
                            className="input w-full resize-none disabled:opacity-50"
                            placeholder="Pesan untuk pengunjung tentang penggunaan cookie..."
                        />
                    </label>
                    <p className="mt-1.5 text-xs text-ink-muted">
                        Teks ini ditampilkan di bawah banner consent sebelum pengunjung memilih.
                    </p>
                </div>
            </div>

            {dirtyAnalytics && (
                <div className="flex justify-end">
                    <button type="button" onClick={() => save(analyticsFields)} className="btn btn-primary">
                        Simpan Pengaturan Analitik
                    </button>
                </div>
            )}
        </div>
    );
}