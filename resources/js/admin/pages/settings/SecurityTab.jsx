import Icon from '../../components/Icon';
import Button from '../../components/Button';
import Toggle from '../../components/Toggle';
import { Field } from '../../components/ui';
import { TAB_FIELDS, statusBadge } from './constants';

const METHOD_DESC = {
    password: 'Masuk dengan email dan kata sandi.',
    token: 'Kirim link akses sekali pakai ke email.',
    otp: 'Kode OTP sekali pakai ke email/WhatsApp.',
    google: 'Masuk cepat dengan akun Google.',
};

const METHOD_LABEL = (method) => (method === 'token' ? 'Access Link' : method[0].toUpperCase() + method.slice(1));

export default function SecurityTab({ form, meta, errors, saving, set, save, dirty }) {
    const methods = Object.entries(form.login_methods_global || {}).filter(([method]) => {
        if (method === 'password' || method === 'token') return true;
        if (method === 'otp') return meta.email_enabled || meta.whatsapp_enabled;
        if (method === 'google') return meta.google_auth_enabled && meta.google_client_id;
        return false;
    });

    return (
        <div className="space-y-6">
            <div className="card w-full p-6">
                <div className="mb-5">
                    <h2 className="font-semibold text-ink">Keamanan Login</h2>
                    <p className="text-xs text-ink-muted">Percobaan login, sesi ingat, dan metode login yang tersedia.</p>
                </div>
                <div className="space-y-5">
                    <Field label="Maksimal percobaan" hint="sebelum akun dikunci" error={errors.login_attempts_max?.[0]}>
                        <input
                            type="number"
                            className="input"
                            value={form.login_attempts_max}
                            min={1}
                            onChange={(e) => set('login_attempts_max', e.target.value)}
                        />
                    </Field>
                    <Field label="Durasi kunci" hint="menit" error={errors.login_attempts_lockout_minutes?.[0]}>
                        <input
                            type="number"
                            className="input"
                            value={form.login_attempts_lockout_minutes}
                            min={1}
                            onChange={(e) => set('login_attempts_lockout_minutes', e.target.value)}
                        />
                    </Field>
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
                                    onChange={(v) => set('login_methods_global', { ...form.login_methods_global, [method]: v })}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end border-t border-line pt-5">
                    <Button icon="check" loading={saving} disabled={!dirty(TAB_FIELDS.security_login)} onClick={() => save(TAB_FIELDS.security_login)}>
                        Simpan Keamanan Login
                    </Button>
                </div>
            </div>

            <div className="card w-full p-6">
                <div className="mb-5">
                    <h2 className="font-semibold text-ink">Retensi File</h2>
                    <p className="text-xs text-ink-muted">Berapa lama file (gambar, video, dokumen) disimpan sebelum dihapus otomatis.</p>
                </div>
                <Field label="Lama penyimpanan" hint="0 = selamanya">
<select className="input" value={form.file_retention_days} onChange={(e) => set('file_retention_days', e.target.value)}>
                            <option value="0">Selamanya</option>
                            <option value="30">30 hari</option>
                            <option value="90">90 hari</option>
                            <option value="180">180 hari</option>
                            <option value="365">1 tahun</option>
                        </select>
                </Field>
                <div className="mt-6 flex justify-end border-t border-line pt-5">
                    <Button icon="check" loading={saving} disabled={!dirty(TAB_FIELDS.security_file)} onClick={() => save(TAB_FIELDS.security_file)}>
                        Simpan Retensi File
                    </Button>
                </div>
            </div>
        </div>
    );
}
