import Button from '../../components/Button';
import { Field } from '../../components/ui';
import { TAB_FIELDS, MASK } from './constants';

export default function SocialTab({ ctx }) {
    const { form, meta, errors, saving, set, save, dirty, setChecked } = ctx;

    return (
        <div className="card w-full p-6">
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <h2 className="font-semibold text-ink">Masuk dengan Google</h2>
                    <p className="text-xs text-ink-muted">Izinkan admin masuk lewat akun Google.</p>
                </div>
                <span className={`badge ${form.google_auth_enabled ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-500/15 text-ink-muted'}`}>
                    {form.google_auth_enabled ? 'Aktif' : 'Nonaktif'}
                </span>
            </div>
            <div className="mb-4 flex items-center gap-2 text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-ink">
                    <input
                        type="checkbox"
                        checked={form.google_auth_enabled}
                        onChange={setChecked('google_auth_enabled')}
                        className="h-4 w-4 rounded border-line text-brand-600"
                    />
                    Aktifkan tombol "Masuk dengan Google"
                </label>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Client ID" hint="opsional">
                    <input className="input" autoComplete="off" value={form.google_client_id} onChange={(e) => set('google_client_id', e.target.value)} placeholder="xxxxxxxx.apps.googleusercontent.com" />
                </Field>
                <Field label="Client Secret" hint="opsional">
                    <input className="input" type="password" autoComplete="new-password" placeholder={form.google_client_secret === MASK ? '••••••••' : ''} value={form.google_client_secret === MASK ? '' : form.google_client_secret} onChange={(e) => set('google_client_secret', e.target.value)} />
                </Field>
                <div className="sm:col-span-2">
                    <Field label="URL Redirect (Callback)" hint="opsional" error={errors.google_redirect_url?.[0]}>
                        <input className="input" value={form.google_redirect_url} onChange={(e) => set('google_redirect_url', e.target.value)} placeholder="https://imagery.assasakiy.my.id/auth/google/callback" />
                    </Field>
                    <p className="mt-1 text-xs text-ink-muted">
                        Kosongkan untuk memakai otomatis: <code className="font-mono">{meta.google_redirect_url || '-'}</code>
                    </p>
                </div>
            </div>
            <div className="mt-6 flex justify-end border-t border-line pt-5">
                <Button icon="check" loading={saving} disabled={!dirty(TAB_FIELDS.social)} onClick={() => save(TAB_FIELDS.social)}>Simpan Login Sosial</Button>
            </div>
        </div>
    );
}