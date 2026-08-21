import { useSyncExternalStore } from 'react';

const MAX_VISIBLE = 5;

let toasts = [];
let listeners = new Set();
let idCounter = 0;

function emit() {
    listeners.forEach((l) => l());
}

function scheduleDismiss(id, duration) {
    const toast = toasts.find((t) => t.id === id);
    if (!toast) return;
    toast._remaining = duration;
    toast._startedAt = Date.now();
    toast._timer = setTimeout(() => dismiss(id), duration);
}

function push(type, message, opts = {}) {
    const id = ++idCounter;
    const duration = opts.duration ?? 4000;
    toasts = [...toasts, { id, type, message, _remaining: duration, _startedAt: Date.now(), _timer: null }];

    if (toasts.length > MAX_VISIBLE) {
        const oldest = toasts.find((t) => t.id !== id && !t._paused);
        if (oldest) dismiss(oldest.id);
    }

    emit();
    if (duration) scheduleDismiss(id, duration);
    return id;
}

export function dismiss(id) {
    const toast = toasts.find((t) => t.id === id);
    if (toast?._timer) clearTimeout(toast._timer);
    toasts = toasts.filter((t) => t.id !== id);
    emit();
}

export function pause(id) {
    const toast = toasts.find((t) => t.id === id);
    if (!toast?._timer) return;
    clearTimeout(toast._timer);
    toast._paused = true;
    toast._remaining = Math.max(0, toast._remaining - (Date.now() - toast._startedAt));
}

export function resume(id) {
    const toast = toasts.find((t) => t.id === id);
    if (!toast?._paused) return;
    toast._paused = false;
    if (toast._remaining > 0) scheduleDismiss(id, toast._remaining);
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
