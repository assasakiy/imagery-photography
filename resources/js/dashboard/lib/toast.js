import { useSyncExternalStore } from 'react';

let toasts = [];
let listeners = new Set();
let idCounter = 0;

function emit() {
    listeners.forEach((l) => l());
}

function push(type, message, opts = {}) {
    const id = ++idCounter;
    const duration = opts.duration ?? 4000;
    toasts = [...toasts, { id, type, message }];
    emit();
    if (duration) setTimeout(() => dismiss(id), duration);
    return id;
}

export function dismiss(id) {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
}

export const toast = {
    success: (msg, opts) => push('success', msg, opts),
    error: (msg, opts) => push('error', msg, opts),
    warning: (msg, opts) => push('warning', msg, opts),
    info: (msg, opts) => push('info', msg, opts),
};

export function useToasts() {
    return useSyncExternalStore(
        (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
        () => toasts,
    );
}
