import { useState } from 'react';
import Icon from '../../components/Icon';
import Toggle from '../../components/Toggle';

function NotifCard({ channel, form, meta, toggleEvent, open, setOpen }) {
    const isEmail = channel === 'email';
    const configured = isEmail ? meta.email_enabled : meta.whatsapp_enabled;
    const events = isEmail ? form.email_events : form.whatsapp_events;
    const label = isEmail ? 'Email' : 'WhatsApp';
    const active = (events || []).some((e) => !!e.enabled);

    const badgeClass = !configured
        ? 'bg-zinc-500/15 text-ink-muted'
        : active
          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
          : 'bg-zinc-500/15 text-ink-muted';
    const badgeLabel = !configured ? 'Nonaktif' : active ? 'Aktif' : 'Nonaktif';

    return (
        <div className="card w-full p-6">
            <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4" aria-expanded={open}>
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-ink-muted">
                        <Icon name={isEmail ? 'mail' : 'message-circle'} size={20} />
                    </span>
                    <div className="text-left">
                        <h2 className="font-semibold text-ink">Notifikasi {label}</h2>
                        <p className="text-xs text-ink-muted">Atur event yang mengirim notifikasi {isEmail ? 'email' : 'WhatsApp'}.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClass}`}>{badgeLabel}</span>
                    <Icon name="chevron-down" size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {!configured && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
                    <Icon name="alert-triangle" size={16} className="mt-0.5 shrink-0" />
                    <p>
                        Koneksi {isEmail ? 'SMTP' : 'WhatsApp'} belum dikonfigurasi di tab Integrasi. Atur dulu di tab Integrasi untuk
                        mengaktifkan notifikasi {isEmail ? 'email' : 'WhatsApp'}.
                    </p>
                </div>
            )}

            {open && (
                <div className="mt-4 border-t border-line pt-2">
                    {(events || []).map((ev) => (
                        <div key={ev.key} className="flex items-center justify-between gap-4 py-3">
                            <div>
                                <p className="text-sm font-medium text-ink">
                                    {ev.label}
                                    {ev.mandatory && (
                                        <span className="ml-2 rounded-full bg-brand-600/10 px-2 py-0.5 text-xs font-semibold text-brand-600">Wajib</span>
                                    )}
                                </p>
                                <p className="text-xs text-ink-muted">{ev.key}</p>
                            </div>
                            <Toggle
                                size="sm"
                                checked={!!ev.enabled}
                                disabled={ev.mandatory || !configured}
                                onChange={(v) => toggleEvent(channel, ev.key, v)}
                            />
                        </div>
                    ))}
                    <p className="border-t border-line pt-2 text-xs text-ink-muted">
                        Event Wajib tidak bisa dinonaktifkan dan hanya berlaku jika kanal sudah dikonfigurasi.
                    </p>
                </div>
            )}
        </div>
    );
}

function InAppCard({ form, toggleEvent, open, setOpen }) {
    const events = form.inapp_events || [];
    const active = events.some((e) => !!e.enabled);

    return (
        <div className="card w-full p-6">
            <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4" aria-expanded={open}>
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-ink-muted">
                        <Icon name="bell" size={20} />
                    </span>
                    <div className="text-left">
                        <h2 className="font-semibold text-ink">Notifikasi Aplikasi (In-App)</h2>
                        <p className="text-xs text-ink-muted">Notifikasi yang tampil di dalam dashboard.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            active ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-500/15 text-ink-muted'
                        }`}
                    >
                        {active ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <Icon name="chevron-down" size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {open && (
                <div className="mt-4 border-t border-line pt-2">
                    {events.map((ev) => (
                        <div key={ev.key} className="flex items-center justify-between gap-4 py-3">
                            <div>
                                <p className="text-sm font-medium text-ink">
                                    {ev.label}
                                    {ev.mandatory && (
                                        <span className="ml-2 rounded-full bg-brand-600/10 px-2 py-0.5 text-xs font-semibold text-brand-600">Wajib</span>
                                    )}
                                </p>
                                <p className="text-xs text-ink-muted">{ev.key}</p>
                            </div>
                            <Toggle size="sm" checked={!!ev.enabled} disabled={ev.mandatory} onChange={(v) => toggleEvent('inapp', ev.key, v)} />
                        </div>
                    ))}
                    <p className="border-t border-line pt-2 text-xs text-ink-muted">
                        Event Wajib tidak bisa dinonaktifkan.
                    </p>
                </div>
            )}
        </div>
    );
}

export default function NotificationsTab({ form, meta, toggleEvent, show }) {
    const [openEmail, setOpenEmail] = useState(true);
    const [openWa, setOpenWa] = useState(false);
    const [openInApp, setOpenInApp] = useState(false);

    return (
        <div className="space-y-6">
            <NotifCard channel="email" form={form} meta={meta} toggleEvent={toggleEvent} open={openEmail} setOpen={setOpenEmail} />
            <NotifCard channel="whatsapp" form={form} meta={meta} toggleEvent={toggleEvent} open={openWa} setOpen={setOpenWa} />
            <InAppCard form={form} toggleEvent={toggleEvent} open={openInApp} setOpen={setOpenInApp} />
        </div>
    );
}
