import Icon from '../../../components/Icon';
import { Field, PasswordInput } from '../../../components/ui';

export default function PasswordTab({ pass, setPass, errors, saving, passDirty, onSubmit }) {
    return (
        <form onSubmit={onSubmit} className="card p-5 lg:col-span-2">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-ink">
                <Icon name="lock" size={18} /> Ubah Kata Sandi
            </h3>
            <div className="space-y-4">
                <Field label="Kata sandi saat ini" required error={errors.current_password?.[0]}>
                    <PasswordInput value={pass.current_password} onChange={(e) => setPass({ ...pass, current_password: e.target.value })} required autoComplete="current-password" />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Kata sandi baru" required error={errors.password?.[0]}>
                        <PasswordInput minLength={8} value={pass.password} onChange={(e) => setPass({ ...pass, password: e.target.value })} required autoComplete="new-password" />
                    </Field>
                    <Field label="Ulangi kata sandi baru" required error={errors.password_confirmation?.[0]}>
                        <PasswordInput value={pass.password_confirmation} onChange={(e) => setPass({ ...pass, password_confirmation: e.target.value })} required autoComplete="new-password" />
                    </Field>
                </div>
                <div className="flex justify-end pt-2">
                    <button type="submit" className="btn-primary" disabled={saving || !passDirty}>
                        <Icon name="lock" size={16} /> Ubah Kata Sandi
                    </button>
                </div>
            </div>
        </form>
    );
}
