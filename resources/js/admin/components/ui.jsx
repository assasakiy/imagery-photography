import { useState } from 'react';
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

export function Modal({ open, onClose, title, children, wide = false, fullscreen = false }) {
    if (!open) return null;

    const shell = fullscreen
        ? 'relative flex h-full w-full flex-col bg-surface shadow-2xl'
        : `relative max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-line bg-surface p-6 shadow-2xl ${
              wide ? 'max-w-3xl' : 'max-w-lg'
          }`;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${fullscreen ? 'p-0' : 'p-4'}`}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={shell}>
                <div className={fullscreen ? 'flex shrink-0 items-center justify-between border-b border-line px-4 py-3 sm:px-6' : 'mb-4 flex items-center justify-between'}>
                    <h2 className="text-lg font-bold text-ink">{title}</h2>
                    <button onClick={onClose} className="rounded-lg p-1 text-ink-muted hover:bg-surface-muted" aria-label="Tutup">
                        <Icon name="x" size={20} />
                    </button>
                </div>
                <div className={fullscreen ? 'flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6' : ''}>{children}</div>
            </div>
        </div>
    );
}

export function Confirm({ open, onClose, onConfirm, title = 'Yakin hapus?', message = 'Aksi ini tidak bisa dibatalkan.' }) {
    return (
        <Modal open={open} onClose={onClose} title={title}>
            <p className="text-sm text-ink-muted">{message}</p>
            <div className="mt-6 flex justify-end gap-2">
                <button className="btn-outline" onClick={onClose}>
                    Batal
                </button>
                <button className="btn bg-red-600 text-white hover:bg-red-700" onClick={onConfirm}>
                    <Icon name="trash" size={16} />
                    Hapus
                </button>
            </div>
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

export function useToast() {
    const [toast, setToast] = useState(null);

    const show = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const node = toast && (
        <div className="fixed bottom-4 right-4 z-[60]">
            <div
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${
                    toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
                }`}
            >
                <Icon name={toast.type === 'error' ? 'alert-triangle' : 'check'} size={18} />
                {toast.message}
            </div>
        </div>
    );

    return { toast, show, node };
}

export function formatRupiah(value) {
    if (value === null || value === undefined || value === '') return '-';
    return 'Rp ' + Number(value).toLocaleString('id-ID');
}

export function formatDate(value) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
