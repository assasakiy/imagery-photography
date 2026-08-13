const DEFAULT_TZ = 'Asia/Makassar';

function getTz() {
    return (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.businessTimezone) || DEFAULT_TZ;
}

function toDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

function isDateOnly(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function businessTimezone() {
    return getTz();
}

export function formatDate(value) {
    if (isDateOnly(value)) {
        const [y, m, d] = value.split('-').map(Number);
        return new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(Date.UTC(y, m - 1, d)));
    }
    const dt = toDate(value);
    if (!dt) return '-';
    return new Intl.DateTimeFormat('id-ID', { timeZone: getTz(), day: 'numeric', month: 'short', year: 'numeric' }).format(dt);
}

export function formatTime(value) {
    const d = toDate(value);
    if (!d) return '-';
    return new Intl.DateTimeFormat('id-ID', { timeZone: getTz(), hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
}

export function formatDateTime(value) {
    const d = toDate(value);
    if (!d) return '-';
    return new Intl.DateTimeFormat('id-ID', {
        timeZone: getTz(),
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(d);
}

export function formatLongDate(value) {
    if (isDateOnly(value)) {
        const [y, m, d] = value.split('-').map(Number);
        return new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(Date.UTC(y, m - 1, d)));
    }
    const d = toDate(value);
    if (!d) return '-';
    return new Intl.DateTimeFormat('id-ID', { timeZone: getTz(), day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

export function formatTimeRange(start, end) {
    if (!start) return '-';
    return end ? `${formatTime(start)} - ${formatTime(end)}` : formatTime(start);
}

export function formatTimeInput(value) {
    const d = toDate(value);
    if (!d) return '';
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: getTz(), hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
    const hour = parts.find((p) => p.type === 'hour')?.value || '00';
    const minute = parts.find((p) => p.type === 'minute')?.value || '00';
    return `${hour}:${minute}`;
}

export function isEventPassed(eventStart) {
    const d = toDate(eventStart);
    if (!d) return false;
    return d.getTime() < Date.now();
}
