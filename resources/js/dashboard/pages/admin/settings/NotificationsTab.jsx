import { useState } from 'react';
import Icon from '../../../components/Icon';
import Toggle from '../../../components/Toggle';

function NotifCard({ channel, form, meta, toggleEvent, open, setOpen }) {
    const isEmail = channel === 'email';
    const isEnabled = isEmail ? form.notif_email_enabled : form.notif_wa_enabled;
    const events = isEmail ? form.email_events : form.whatsapp_events;
    const label = isEmail ? 'Email' : 'WhatsApp';
    const active = isEnabled && (events || []).some((e) => !!e.enabled);
    const configured = isEmail ? meta.email_configured : meta.whatsapp_configured;
    const canConfigure = isEnabled && configured;

    const badgeClass = !configured
        ? 'bg-red-500/15 text-red-600 hover:bg-red-500/25 dark:text-red-400'
        : canConfigure
            ? (active
                ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400'
                : 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 dark:text-amber-400')
            : 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 dark:text-amber-400';
    const badgeLabel = !configured ? 'Belum Dikonfigurasi' : canConfigure ? (active ? 'Aktif' : 'Pasif') : 'Nonaktif';

    return (
        <div className="card w-full p-6">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-ink-muted">
                        <Icon name={isEmail ? 'mail' : 'message-circle'} size={20} />
                    </span>
                    <div className="text-left">
                        <h2 className="font-semibold text-ink">Notifikasi {label}</h2>
                        <p className="text-xs text-ink-muted">Atur event yang mengirim notifikasi {isEmail ? 'email' : 'WhatsApp'}.</p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setOpen(!open)}
                        aria-expanded={open}
                        className={`badge cursor-pointer transition-colors ${badgeClass}`}
                    >
                        <Icon name="chevron-down" size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                        {badgeLabel}
                    </button>
                </div>
            </div>

            {!canConfigure && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
                    <Icon name="alert-triangle" size={16} className="mt-0.5 shrink-0" />
                    <p>
                        {!configured
                            ? `Integrasi ${isEmail ? 'Email' : 'WhatsApp'} belum dikonfigurasi di tab Integrasi. Konfigurasi terlebih dahulu lalu aktifkan untuk dapat mengatur event notifikasi di bawah.`
                            : `Integrasi ${isEmail ? 'Email' : 'WhatsApp'} sedang nonaktif di tab Integrasi. Aktifkan terlebih dahulu untuk dapat mengatur event notifikasi di bawah.`}
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
                                disabled={ev.mandatory || !canConfigure}
                                onChange={(v) => toggleEvent(channel, ev.key, v)}
                            />
                        </div>
                    ))}
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
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-ink-muted">
                        <Icon name="bell" size={20} />
                    </span>
                    <div className="text-left">
                        <h2 className="font-semibold text-ink">Notifikasi Aplikasi (In-App)</h2>
                        <p className="text-xs text-ink-muted">Notifikasi yang tampil di dalam dashboard.</p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setOpen(!open)}
                        aria-expanded={open}
                        className={`badge cursor-pointer transition-colors ${
                            active ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 dark:text-amber-400'
                        }`}
                    >
                        <Icon name="chevron-down" size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                        {active ? 'Aktif' : 'Nonaktif'}
                    </button>
                </div>
            </div>

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
