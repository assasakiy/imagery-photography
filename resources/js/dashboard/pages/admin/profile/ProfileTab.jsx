import Icon from '../../../components/Icon';
import { Field } from '../../../components/ui';

export default function ProfileTab({ profile, setProfile, errors, usernameStatus, saving, profileDirty, onSubmit }) {
    return (
        <form onSubmit={onSubmit} className="card p-5 lg:col-span-2">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-ink">
                <Icon name="user" size={18} /> Informasi Profil
            </h3>
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Nama" required error={errors.full_name?.[0]}>
                        <input className="input" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} required />
                    </Field>
                    <Field
                        label="Username"
                        required
                        hint={
                            usernameStatus.checking
                                ? 'Memeriksa…'
                                : usernameStatus.available === false
                                    ? 'Username sudah dipakai.'
                                    : 'untuk login'
                        }
                        error={errors.username?.[0] || (usernameStatus.available === false && !errors.username?.[0] ? ['Username sudah dipakai.'] : undefined)}
                    >
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">@</span>
                            <input
                                className={`input pl-7 ${usernameStatus.available === false ? '!border-red-500' : usernameStatus.available === true ? '!border-emerald-500' : ''}`}
                                autoComplete="username"
                                minLength={3}
                                maxLength={40}
                                required
                                value={profile.username || ''}
                                onChange={(e) => setProfile({ ...profile, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                            />
                            {usernameStatus.available === true && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                                    <Icon name="check" size={16} />
                                </span>
                            )}
                            {usernameStatus.available === false && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                                    <Icon name="x" size={16} />
                                </span>
                            )}
                        </div>
                    </Field>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Email" required error={errors.email?.[0]}>
                        <input className="input" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required />
                    </Field>
                    <Field label="Nomor Ponsel" hint="opsional" error={errors.phone?.[0]}>
                        <input className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                    </Field>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Perusahaan" hint="opsional" error={errors.company?.[0]}>
                        <input className="input" value={profile.company || ''} onChange={(e) => setProfile({ ...profile, company: e.target.value })} />
                    </Field>
                    <Field label="Pekerjaan" hint="opsional" error={errors.occupation?.[0]}>
                        <input className="input" value={profile.occupation || ''} onChange={(e) => setProfile({ ...profile, occupation: e.target.value })} />
                    </Field>
                </div>
                <Field label="Website" hint="opsional" error={errors.website?.[0]}>
                    <input className="input" value={profile.website || ''} onChange={(e) => setProfile({ ...profile, website: e.target.value })} />
                </Field>
                <Field label="Bio" hint="ceritakan tentang Anda" error={errors.bio?.[0]}>
                    <textarea
                        className="input min-h-[100px] resize-y"
                        maxLength={1000}
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        placeholder="Contoh: Fotografer & videografer berbasis di Lombok. Menyukai momen golden hour."
                    />
                </Field>
                <div className="flex justify-end pt-2">
                    <button type="submit" className="btn-primary" disabled={saving || !profileDirty || !profile.username?.trim() || usernameStatus.checking || usernameStatus.available === false}>
                        <Icon name="check" size={16} /> Simpan Profil
                    </button>
                </div>
            </div>
        </form>
    );
}
