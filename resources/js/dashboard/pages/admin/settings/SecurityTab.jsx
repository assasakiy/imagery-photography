import { useEffect, useState } from 'react';
import Icon from '../../../components/Icon';
import Button from '../../../components/Button';
import Toggle from '../../../components/Toggle';
import { Field } from '../../../components/ui';
import { TAB_FIELDS, statusBadge } from './constants';
import api from '../../../api';

const METHOD_DESC = {
    password: 'Masuk dengan email dan kata sandi.',
    otp: 'Masuk tanpa kata sandi via kode OTP & tautan instan ke email/WhatsApp.',
    google: 'Masuk cepat dengan akun Google.',
};

const METHOD_LABEL = (method) => (method === 'otp' ? 'OTP & Link Akses' : method[0].toUpperCase() + method.slice(1));

export default function SecurityTab({ form, meta, errors, saving, set, save, dirty }) {
    const rateLimits = form.rate_limits || {};
    const rateLimitsBase = meta.rate_limits || {};

    const methods = Object.entries(form.login_methods_global || {}).filter(([method]) => {
        if (method === 'password') return true;
        // Hanya render representasi OTP, token akan mengikuti valuenya
        if (method === 'otp') return meta.email_available || meta.whatsapp_available;
        if (method === 'google') return meta.google_auth_enabled && meta.google_client_id;
        return false;
    });

    const isOtpConfigured = meta.email_available || meta.whatsapp_available;

    const updateRateLimit = (key, field, value) => {
        set('rate_limits', {
            ...rateLimits,
            [key]: { ...rateLimits[key], [field]: value },
        });
    };

    const isRateLimitsDirty = JSON.stringify(rateLimits) !== JSON.stringify(rateLimitsBase);

    return (
        <div className="space-y-6">
            <div className="card w-full p-6">
                <div className="mb-5">
                    <h2 className="font-semibold text-ink">Keamanan Login</h2>
                    <p className="text-xs text-ink-muted">Sesi ingat dan metode login yang tersedia.</p>
                </div>
                <div className="space-y-5">
                    <Field label="Jangan lupakan saya">
                        <Toggle checked={!!form.login_remember_enabled} onChange={(v) => set('login_remember_enabled', v)} />
                    </Field>
                    <Field label="Durasi sesi ingat" hint="hari">
                        <input
                            type="number"
                            className="input"
                            value={form.login_remember_days}
                            min={1}
                            disabled={!form.login_remember_enabled}
                            onChange={(e) => set('login_remember_days', e.target.value)}
                        />
                    </Field>
                    <div className="rounded-xl border border-line p-4">
                        <p className="mb-3 text-sm font-semibold text-ink">Metode Login</p>
                        <div className="space-y-3">
                            {methods.map(([method, enabled]) => (
                                    <Toggle
                                        key={method}
                                        size="sm"
                                        label={METHOD_LABEL(method)}
                                        desc={METHOD_DESC[method]}
                                        checked={!!enabled}
                                        disabled={method === 'otp' && !isOtpConfigured}
                                        onChange={(v) => {
                                            if (method === 'otp' && !isOtpConfigured) return;
                                            
                                            if (method === 'otp') {
                                                // Sinkronkan token agar sama dengan otp
                                                set('login_methods_global', { ...form.login_methods_global, otp: v, token: v });
                                            } else {
                                                set('login_methods_global', { ...form.login_methods_global, [method]: v });
                                            }
                                        }}
                                    />
                            ))}
                        </div>
                    </div>
                    <Field label="Masa berlaku undangan akun" hint="berapa jam link aktivasi valid sebelum kadaluarsa">
                        <select className="input" value={String(form.invite_expiry_hours)} onChange={(e) => set('invite_expiry_hours', parseInt(e.target.value, 10))}>
                            <option value="6">6 jam</option>
                            <option value="12">12 jam</option>
                            <option value="24">24 jam</option>
                            <option value="48">48 jam</option>
                            <option value="72">72 jam</option>
                        </select>
                    </Field>
                </div>
                <div className="mt-6 flex justify-end border-t border-line pt-5">
                    <Button icon="check" loading={saving} disabled={!dirty(TAB_FIELDS.security_login)} onClick={() => save(TAB_FIELDS.security_login)}>
                        Simpan Keamanan Login
                    </Button>
                </div>
            </div>

            <div className="card w-full p-6">
                <div className="mb-5">
                    <h2 className="font-semibold text-ink">Rate Limit Endpoint</h2>
                    <p className="text-xs text-ink-muted">
                        Batas request API per periode. Policy mandatory penting untuk keamanan dasar sistem.
                    </p>
                </div>
                <div className="space-y-3">
                    {Object.entries(rateLimits).length ? Object.entries(rateLimits).map(([key, policy]) => {
                        const isEditable = ['booking.create', 'booking.update', 'upload', 'payment', 'contact'].includes(key);
                        const isMandatory = ['otp.send', 'otp.verify', 'auth.login', 'auth.forgot', 'auth.register', 'subscribe.send', 'subscribe.verify', 'analytics.consent'].includes(key);
                        return (
                            <div key={key} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line px-5 py-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-ink">{key}</p>
                                        {isMandatory && <span className="rounded bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand-600 dark:text-brand-400">Wajib</span>}
                                    </div>
                                    <p className="mt-0.5 text-xs text-ink-muted">Scope: {policy.scope || 'global'}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {isEditable ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                className="w-16 rounded-lg border border-line bg-surface px-2 py-1.5 text-center text-sm text-ink focus:border-brand-500 focus:outline-none"
                                                value={policy.limit}
                                                min={policy.min || 1}
                                                max={policy.max || 100}
                                                disabled={!policy.enabled}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value, 10);
                                                    if (!isNaN(val)) updateRateLimit(key, 'limit', val);
                                                }}
                                            />
                                            <span className="text-sm text-ink-muted">/</span>
                                            <input
                                                type="number"
                                                className="w-20 rounded-lg border border-line bg-surface px-2 py-1.5 text-center text-sm text-ink focus:border-brand-500 focus:outline-none"
                                                value={policy.period || 60}
                                                min={10}
                                                step={10}
                                                disabled={!policy.enabled}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value, 10);
                                                    if (!isNaN(val)) updateRateLimit(key, 'period', val);
                                                }}
                                            />
                                            <span className="mr-3 text-xs text-ink-muted">detik</span>
                                        </div>
                                    ) : (
                                        <p className="mr-3 text-sm text-ink-muted">{policy.limit} req / {policy.period || 60} dtk</p>
                                    )}
                                    <Toggle
                                        checked={isMandatory ? true : !!policy.enabled}
                                        disabled={isMandatory}
                                        onChange={(v) => {
                                            if (!isMandatory) updateRateLimit(key, 'enabled', v);
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    }) : (
                        <p className="py-4 text-center text-sm text-ink-muted">Data rate limit tidak tersedia.</p>
                    )}
                </div>
                <div className="mt-6 flex justify-end border-t border-line pt-5">
                    <Button
                        icon="check"
                        loading={saving}
                        disabled={!isRateLimitsDirty}
                        onClick={() => save(['rate_limits'], { rate_limits: rateLimits })}
                    >
                        Simpan Rate Limit
                    </Button>
                </div>
            </div>

            <div className="card w-full p-6">
                <div className="mb-5">
                    <h2 className="font-semibold text-ink">Retensi File</h2>
                    <p className="text-xs text-ink-muted">Berapa lama file (gambar, video, dokumen) disimpan sebelum dihapus otomatis.</p>
                </div>
                <Field label="Lama penyimpanan" hint="0 = selamanya">
                    <select className="input" value={String(form.file_retention_days)} onChange={(e) => set('file_retention_days', parseInt(e.target.value, 10))}>
                        <option value="0">Selamanya</option>
                        <option value="30">30 hari</option>
                        <option value="90">90 hari</option>
                        <option value="180">180 hari</option>
                        <option value="365">1 tahun</option>
                    </select>
                </Field>
                <Field label="Masa aktif preview (hari)" hint="durasi link preview aktif">
                    <input type="number" className="input" value={form.preview_expiry_days} onChange={(e) => set('preview_expiry_days', parseInt(e.target.value, 10))} />
                </Field>
                <Field label="Masa tunggu arsip (hari)" hint="durasi sebelum arsip otomatis">
                    <input type="number" className="input" value={form.archive_delay_days} onChange={(e) => set('archive_delay_days', parseInt(e.target.value, 10))} />
                </Field>
                <div className="mt-6 flex justify-end border-t border-line pt-5">
                    <Button icon="check" loading={saving} disabled={!dirty(TAB_FIELDS.security_file)} onClick={() => save(TAB_FIELDS.security_file)}>
                        Simpan Retensi File
                    </Button>
                </div>
            </div>

            <div className="card w-full p-6">
                <div className="mb-5">
                    <h2 className="font-semibold text-ink">Analisis Kunjungan</h2>
                    <p className="text-xs text-ink-muted">Catat page view pengunjung situs publik untuk dashboard Analitik.</p>
                </div>
                <div className="space-y-5">
                    <Toggle
                        label="Aktifkan analitik"
                        desc="Tracking hanya berjalan setelah pengunjung mengizinkan cookie analitik (patuh UU Perlindungan Data Pribadi). IP di-hash dan tidak disimpan dalam bentuk asli."
                        checked={!!form.analytics_enabled}
                        onChange={(v) => set('analytics_enabled', v)}
                    />
                    <p className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(!!form.analytics_enabled, 'Aktif', 'Nonaktif')}`}>
                        {form.analytics_enabled ? 'Analitik aktif' : 'Analitik nonaktif'}
                    </p>
                </div>
                <div className="mt-6 flex justify-end border-t border-line pt-5">
                    <Button icon="check" loading={saving} disabled={!dirty(TAB_FIELDS.security_analytics)} onClick={() => save(TAB_FIELDS.security_analytics)}>
                        Simpan Analitik
                    </Button>
                </div>
            </div>

            <div className="card w-full p-6">
                <div className="mb-5">
                    <h2 className="font-semibold text-ink">Banner Preferensi Cookie</h2>
                    <p className="text-xs text-ink-muted">Tampilkan banner consent cookie di situs publik (opsi: terima semua / tolak / kustom).</p>
                </div>
                <div className="space-y-5">
                    <Toggle
                        label="Tampilkan banner cookie"
                        desc="Teks ini ditampilkan di bawah banner consent sebelum pengunjung memilih."
                        checked={!!form.cookie_banner_enabled}
                        onChange={(v) => set('cookie_banner_enabled', v)}
                    />
                    <Field label="Teks Banner">
                        <textarea
                            className="input w-full resize-none disabled:opacity-50"
                            rows={3}
                            value={form.cookie_banner_message || ''}
                            disabled={!form.cookie_banner_enabled}
                            onChange={(e) => set('cookie_banner_message', e.target.value)}
                            placeholder="Pesan untuk pengunjung tentang penggunaan cookie..."
                        />
                    </Field>
                </div>
                <div className="mt-6 flex justify-end border-t border-line pt-5">
                    <Button icon="check" loading={saving} disabled={!dirty(TAB_FIELDS.security_cookie)} onClick={() => save(TAB_FIELDS.security_cookie)}>
                        Simpan Banner Cookie
                    </Button>
                </div>
            </div>
        </div>
    );
}
