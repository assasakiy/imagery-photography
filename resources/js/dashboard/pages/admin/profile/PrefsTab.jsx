import Icon from '../../../components/Icon';
import { Field } from '../../../components/ui';

function Toggle({ checked, onChange, label, desc }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div>
                <p className="text-sm font-semibold text-ink">{label}</p>
                {desc && <p className="mt-0.5 text-xs text-ink-muted">{desc}</p>}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    checked ? 'bg-brand-600' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
            >
                <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        checked ? 'translate-x-5' : ''
                    }`}
                />
            </button>
        </div>
    );
}

export default function PrefsTab({ prefs, setPrefs, notifEvents, toggleEvent, otpChannel, setOtpChannel, notifMeta, emailActive, waActive, saving, prefsDirty, onSubmit }) {
    return (
        <div className="card p-5 lg:col-span-2">
            <h3 className="mb-1 flex items-center gap-2 font-semibold text-ink">
                <Icon name="bell" size={18} /> Preferensi Notifikasi
            </h3>
            <p className="mb-5 text-sm text-ink-muted">Pilih notifikasi apa saja yang ingin Anda terima. Kanal yang belum dikonfigurasi atau nonaktif tidak ditampilkan.</p>

            <div className="divide-y divide-line border-b border-line">
                <div className="py-3">
                    <Toggle
                        checked={prefs.notif_inapp}
                        onChange={(v) => setPrefs({ ...prefs, notif_inapp: v })}
                        label="Notifikasi di dalam aplikasi"
                        desc="Lonceng notifikasi di dashboard dan header situs."
                    />
                </div>
                {emailActive && (
                    <div className="py-3">
                        <Toggle
                            checked={prefs.notif_email}
                            onChange={(v) => setPrefs({ ...prefs, notif_email: v })}
                            label="Notifikasi via Email"
                            desc="Undangan, pembaruan status, dan info penting lewat email."
                        />
                    </div>
                )}
                {waActive && (
                    <div className="py-3">
                        <Toggle
                            checked={prefs.notif_whatsapp}
                            onChange={(v) => setPrefs({ ...prefs, notif_whatsapp: v })}
                            label="Notifikasi via WhatsApp"
                            desc="Pembaruan status project dan konfirmasi pembayaran lewat WhatsApp."
                        />
                    </div>
                )}
            </div>

            {!emailActive && !waActive ? (
                <p className="mt-5 rounded-xl border border-line bg-surface-muted/40 p-4 text-sm text-ink-muted">
                    Kanal notifikasi email dan WhatsApp belum tersedia untuk akun Anda.
                </p>
            ) : (
                ['email', 'whatsapp'].map((channel) => {
                    const isEmail = channel === 'email';
                    const active = isEmail ? emailActive : waActive;

                    if (!active) return null;

                    const events = notifMeta.events?.[channel] || [];
                    const label = isEmail ? 'Email' : 'WhatsApp';
                    const userOn = prefs[isEmail ? 'notif_email' : 'notif_whatsapp'];

                    return (
                        <div key={channel} className="mt-5">
                            <p className="mb-1 text-sm font-semibold text-ink">Event via {label}</p>
                            {!userOn && (
                                <p className="mb-2 text-xs text-ink-muted">Anda mematikan notifikasi {label} di atas.</p>
                            )}
                            <div className="divide-y divide-line rounded-xl border border-line">
                                {events.map((ev) => {
                                    const on = ev.mandatory || (notifEvents[channel] || []).includes(ev.key);
                                    return (
                                        <label key={ev.key} className="flex items-center justify-between gap-4 py-3 px-4">
                                            <div>
                                                <p className="text-sm font-medium text-ink">{ev.label}</p>
                                                <p className="font-mono text-xs text-ink-muted">{ev.key}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {ev.mandatory && (
                                                    <span className="badge bg-brand-600/10 text-brand-600 dark:text-brand-400">Wajib</span>
                                                )}
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-line text-brand-600"
                                                    checked={on}
                                                    disabled={ev.mandatory || !userOn}
                                                    onChange={() => toggleEvent(channel, ev.key)}
                                                />
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })
            )}

            {emailActive && waActive && (
                <div className="mt-5">
                    <Field label="Kanal untuk kode OTP login" hint="OTP login akan dikirim ke kanal ini.">
                        <select className="input" value={otpChannel} onChange={(e) => setOtpChannel(e.target.value)}>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="email">Email</option>
                        </select>
                    </Field>
                </div>
            )}

            <div className="flex justify-end pt-4">
                <button type="button" className="btn-primary" disabled={saving || !prefsDirty} onClick={onSubmit}>
                    <Icon name="check" size={16} /> Simpan Preferensi
                </button>
            </div>
        </div>
    );
}
