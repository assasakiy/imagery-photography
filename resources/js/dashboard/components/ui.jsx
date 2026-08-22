import Icon from './Icon';

export function Spinner({ className = 'h-8 w-8 text-brand-600' }) {
    return (
        <div className="flex items-center justify-center p-8">
            <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-label="Memuat">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
            </svg>
        </div>
    );
}

export function ButtonSpinner({ className = 'h-4 w-4 text-inherit' }) {
    return (
        <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
        </svg>
    );
}

export function PageHeader({ title, subtitle, action }) {
    return (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}

export function EmptyState({ icon = 'image', title, message }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line p-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-muted text-ink-muted">
                <Icon name={icon} size={28} />
            </div>
            <p className="font-semibold text-ink">{title}</p>
            {message && <p className="mt-1 max-w-sm text-sm text-ink-muted">{message}</p>}
        </div>
    );
}

export function Modal({ open, onClose, title, children, wide = false, fullscreen = false, bodyClassName = '', footer = null }) {
    if (!open) return null;

    const shell = fullscreen
        ? 'relative flex h-full w-full flex-col bg-surface shadow-2xl'
        : `relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl ${
              wide ? 'max-w-3xl' : 'max-w-lg'
          }`;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${fullscreen ? 'p-0' : 'p-4'}`}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={shell}>
                <div className={`shrink-0 ${fullscreen ? 'flex items-center justify-between border-b border-line px-4 py-3 sm:px-6' : 'flex items-center justify-between px-6 py-4'}`}>
                    <h2 className="text-lg font-bold text-ink">{title}</h2>
                    <button onClick={onClose} className="rounded-lg p-1 text-ink-muted hover:bg-surface-muted" aria-label="Tutup">
                        <Icon name="x" size={20} />
                    </button>
                </div>
                <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto ${bodyClassName || 'p-6'}`}>{children}</div>
                {footer && (
                    <div className={`shrink-0 border-t border-line ${fullscreen ? '' : 'bg-surface px-4 py-3 [&_.btn]:px-4 [&_.btn]:py-2'}`}>{footer}</div>
                )}
            </div>
        </div>
    );
}

export function Confirm({ open, onClose, onConfirm, title = 'Yakin hapus?', message = 'Aksi ini tidak bisa dibatalkan.' }) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            footer={
                <div className="flex justify-end gap-2">
                    <button className="btn-outline" onClick={onClose}>
                        Batal
                    </button>
                    <button className="btn bg-red-600 text-white hover:bg-red-700" onClick={onConfirm}>
                        <Icon name="trash" size={16} />
                        Hapus
                    </button>
                </div>
            }
        >
            <p className="text-sm text-ink-muted">{message}</p>
        </Modal>
    );
}

export function Field({ label, required, hint, error, children }) {
    return (
        <div>
            <label className="label">
                {label}
                {required && <span className="text-red-500"> *</span>}
                {hint && <span className="ml-1 text-xs font-normal text-ink-muted">({hint})</span>}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

export function formatRupiah(value) {
    if (value === null || value === undefined || value === '') return '-';
    return 'Rp ' + Number(value).toLocaleString('id-ID');
}

import { formatDate, formatDateTime, formatTime, formatTimeRange, formatTimeInput, formatLongDate, isEventPassed, dateBoxParts } from '../utils/date';

export { formatDate, formatDateTime, formatTime, formatTimeRange, formatTimeInput, formatLongDate, isEventPassed, dateBoxParts };
