import Icon from '../../components/Icon';
import Button from '../../components/Button';
import Toggle from '../../components/Toggle';
import { Field } from '../../components/ui';
import { SMTP_FIELDS, WA_FIELDS, MASK } from './constants';

export default function IntegrasiTab({
    form, meta, errors, saving, set, save, dirty,
    openEmail, setOpenEmail, openWa, setOpenWa,
    toggleEmailChannel, toggleWaChannel,
    testEmail, testWhatsapp,
    waDrivers, waDriver, waFields, waConfig, setWaDriver,
    testingEmail, testingWhatsapp,
}) {

    return (
        <div className="space-y-6">
            <div className="card w-full p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="font-semibold text-ink">Email (SMTP)</h2>
                        <p className="text-xs text-ink-muted">Dipakai untuk notifikasi email, OTP login, dan email uji.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setOpenEmail((v) => !v)}
                            className={`badge cursor-pointer transition-colors ${
                                meta.email_configured
                                    ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400'
                                    : 'bg-red-500/15 text-red-600 hover:bg-red-500/25 dark:text-red-400'
                            }`}
                        >
                            <Icon name="chevron-down" size={12} className={`transition-transform ${openEmail ? 'rotate-180' : ''}`} />
                            {meta.email_configured ? 'Terkonfigurasi' : 'Belum Dikonfigurasi'}
                        </button>
                    </div>
                </div>

                {meta.email_configured && (
                    <div className="mt-4 border-b border-line pb-4">
                        <Toggle
                            checked={form.notif_email_enabled}
                            onChange={(v) => toggleEmailChannel(v)}
                            label="Aktifkan integrasi Email"
                            desc={form.notif_email_enabled
                                ? 'Integrasi aktif — notifikasi email dikirim.'
                                : 'Integrasi nonaktif. Konfigurasi tetap tersimpan.'}
                        />
                    </div>
                )}

                {meta.env_mail_configured && (
                    <p className="mt-4 rounded-lg bg-sky-500/10 px-3 py-2 text-xs text-sky-600 dark:text-sky-400">
                        SMTP juga dikonfigurasi di file <code>.env</code>. Nilai di dashboard ini menimpa konfigurasi tersebut.
                    </p>
                )}

                {openEmail && (
                    <div className="mt-5">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Host" hint="wajib" error={errors.mail_host?.[0]}>
                                <input className="input" placeholder="smtp.gmail.com" value={form.mail_host} onChange={(e) => set('mail_host', e.target.value)} />
                            </Field>
                            <Field label="Port" hint="wajib" error={errors.mail_port?.[0]}>
                                <input className="input" type="number" placeholder="587" value={form.mail_port} onChange={(e) => set('mail_port', e.target.value)} />
                            </Field>
                            <Field label="Username" hint="opsional">
                                <input className="input" autoComplete="off" value={form.mail_username} onChange={(e) => set('mail_username', e.target.value)} />
                            </Field>
                            <Field label="Password" hint="opsional">
                                <input className="input" type="password" autoComplete="new-password" placeholder={form.mail_password === MASK ? '••••••••' : ''} value={form.mail_password === MASK ? '' : form.mail_password} onChange={(e) => set('mail_password', e.target.value)} />
                            </Field>
                            <Field label="Dari (email)" hint="opsional" error={errors.mail_from_address?.[0]}>
                                <input className="input" type="email" value={form.mail_from_address} onChange={(e) => set('mail_from_address', e.target.value)} />
                            </Field>
                            <Field label="Dari (nama)" hint="opsional">
                                <input className="input" value={form.mail_from_name} onChange={(e) => set('mail_from_name', e.target.value)} />
                            </Field>
                        </div>
                        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-line pt-5">
                            <Button variant="outline" icon="send" loading={testingEmail} disabled={!meta.email_configured} onClick={testEmail}>
                                Tes Koneksi
                            </Button>
                            <Button icon="check" loading={saving} disabled={!dirty(SMTP_FIELDS)} onClick={() => save(SMTP_FIELDS)}>Simpan SMTP</Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="card w-full p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="font-semibold text-ink">WhatsApp</h2>
                        <p className="text-xs text-ink-muted">Pilih driver, isi konfigurasinya, lalu tes koneksi.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setOpenWa((v) => !v)}
                            className={`badge cursor-pointer transition-colors ${
                                meta.whatsapp_configured
                                    ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400'
                                    : 'bg-red-500/15 text-red-600 hover:bg-red-500/25 dark:text-red-400'
                            }`}
                        >
                            <Icon name="chevron-down" size={12} className={`transition-transform ${openWa ? 'rotate-180' : ''}`} />
                            {meta.whatsapp_configured ? 'Terkonfigurasi' : 'Belum Dikonfigurasi'}
                        </button>
                    </div>
                </div>

                {meta.whatsapp_configured && (
                    <div className="mt-4 border-b border-line pb-4">
                        <Toggle
                            checked={form.notif_wa_enabled}
                            onChange={(v) => toggleWaChannel(v)}
                            label="Aktifkan integrasi WhatsApp"
                            desc={form.notif_wa_enabled
                                ? 'Integrasi aktif — pesan WhatsApp dikirim.'
                                : 'Integrasi nonaktif. Konfigurasi tetap tersimpan.'}
                        />
                    </div>
                )}

                {openWa && (
                    <div className="mt-5">
                        <Field label="Driver" required>
                            <div className="space-y-2">
                                <select className="input" value={waDriver} onChange={(e) => setWaDriver(e.target.value)}>
                                    {(waDrivers || []).map((d) => (
                                        <option key={d.key} value={d.key}>{d.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-ink-muted">
                                    {waDrivers.find((d) => d.key === waDriver)?.description || ''}
                                </p>
                            </div>
                        </Field>

                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {waFields.map((f) => {
                                const val = waConfig[f.key] ?? '';
                                const masked = val === MASK;
                                const setVal = (v) => set('whatsapp_config', { ...form.whatsapp_config, config: { ...waConfig, [f.key]: v } });

                                if (f.type === 'select') {
                                    return (
                                        <Field key={f.key} label={f.label} required={f.required} hint={f.help}>
                                            <select className="input" value={val} onChange={(e) => setVal(e.target.value)}>
                                                {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </Field>
                                    );
                                }

                                if (f.type === 'password') {
                                    return (
                                        <Field key={f.key} label={f.label} required={f.required} hint={f.help}>
                                            <input
                                                className="input"
                                                type="password"
                                                autoComplete="new-password"
                                                placeholder={masked ? MASK : ''}
                                                value={masked ? '' : val}
                                                onChange={(e) => setVal(e.target.value)}
                                            />
                                        </Field>
                                    );
                                }

                                if (f.type === 'textarea') {
                                    return (
                                        <Field key={f.key} label={f.label} required={f.required} hint={f.help}>
                                            <textarea className="input min-h-[150px] resize-y font-mono text-xs" value={val} onChange={(e) => setVal(e.target.value)} />
                                        </Field>
                                    );
                                }

                                return (
                                    <Field key={f.key} label={f.label} required={f.required} hint={f.help}>
                                        <input className="input" type={f.type === 'url' ? 'url' : 'text'} placeholder={f.placeholder} value={val} onChange={(e) => setVal(e.target.value)} />
                                    </Field>
                                );
                            })}
                        </div>

                        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-line pt-5">
                            <Button variant="outline" icon="send" loading={testingWhatsapp} disabled={!meta.whatsapp_configured} onClick={testWhatsapp}>
                                Tes Koneksi
                            </Button>
                            <Button icon="check" loading={saving} disabled={!dirty(WA_FIELDS)} onClick={() => save(WA_FIELDS)}>Simpan WhatsApp</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}