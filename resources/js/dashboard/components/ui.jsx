import Icon from './Icon';

export function FullPageSkeleton() {
    return (
        <div className="flex h-screen w-full bg-surface">
            {/* Sidebar Skeleton (Hidden on mobile) */}
            <div className="hidden w-[280px] shrink-0 flex-col border-r border-line bg-surface lg:flex">
                <div className="flex h-16 items-center gap-3 border-b border-line px-6">
                    <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-surface-muted"></div>
                    <div className="h-4 w-32 animate-pulse rounded bg-surface-muted"></div>
                </div>
                <div className="flex-1 space-y-6 p-4">
                    <div>
                        <div className="mb-2 ml-3 h-3 w-16 animate-pulse rounded bg-surface-muted"></div>
                        <div className="space-y-1">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="flex h-10 items-center gap-3 rounded-xl px-3">
                                    <div className="h-5 w-5 animate-pulse rounded bg-surface-muted"></div>
                                    <div className="h-4 w-24 animate-pulse rounded bg-surface-muted"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {/* Main Content Skeleton */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                {/* Header Skeleton */}
                <div className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-8">
                    <div className="flex items-center gap-4">
                        <div className="h-6 w-6 animate-pulse rounded bg-surface-muted lg:hidden"></div>
                        <div className="hidden h-5 w-40 animate-pulse rounded bg-surface-muted sm:block"></div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 animate-pulse rounded-full bg-surface-muted"></div>
                        <div className="hidden h-4 w-24 animate-pulse rounded bg-surface-muted sm:block"></div>
                    </div>
                </div>
                {/* Content Area Skeleton */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="mb-8">
                        <div className="mb-2 h-8 w-48 animate-pulse rounded bg-surface-muted"></div>
                        <div className="h-4 w-64 animate-pulse rounded bg-surface-muted"></div>
                    </div>
                    
                    {/* KPI Cards Skeleton */}
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="h-9 w-9 animate-pulse rounded-lg bg-surface-muted"></div>
                                    <div className="h-5 w-16 animate-pulse rounded-full bg-surface-muted"></div>
                                </div>
                                <div className="mb-2 h-7 w-20 animate-pulse rounded bg-surface-muted"></div>
                                <div className="h-3 w-32 animate-pulse rounded bg-surface-muted"></div>
                            </div>
                        ))}
                    </div>

                    {/* Charts / Lower Section Skeleton */}
                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <div className="h-[400px] w-full animate-pulse rounded-2xl border border-line bg-surface p-6 shadow-sm">
                                <div className="mb-6 h-6 w-48 rounded bg-surface-muted"></div>
                                <div className="h-full w-full rounded bg-surface-muted/50"></div>
                            </div>
                        </div>
                        <div>
                            <div className="h-[400px] w-full animate-pulse rounded-2xl border border-line bg-surface p-6 shadow-sm">
                                <div className="mb-6 h-6 w-32 rounded bg-surface-muted"></div>
                                <div className="mx-auto h-48 w-48 rounded-full bg-surface-muted/50"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

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

export function PasswordInput({ value, onChange, placeholder = '••••••••', minLength, required, className = '', id, name, autoComplete = 'current-password' }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative w-full">
            <input
                id={id}
                name={name}
                type={show ? 'text' : 'password'}
                required={required}
                minLength={minLength}
                autoComplete={autoComplete}
                className={`input pr-12 w-full ${className}`}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />
            <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink focus:outline-none"
                aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            >
                <Icon name={show ? 'eye-off' : 'eye'} size={20} />
            </button>
        </div>
    );
}

export function formatRupiah(value) {
    if (value === null || value === undefined || value === '') return '-';
    return 'Rp ' + Number(value).toLocaleString('id-ID');
}

import { formatDate, formatDateTime, formatTime, formatTimeRange, formatTimeInput, formatLongDate, isEventPassed, dateBoxParts } from '../utils/date';

export { formatDate, formatDateTime, formatTime, formatTimeRange, formatTimeInput, formatLongDate, isEventPassed, dateBoxParts };
