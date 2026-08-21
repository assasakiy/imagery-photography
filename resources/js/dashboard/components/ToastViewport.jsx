import { useToasts, dismiss, pause, resume } from '../lib/toast';
import Icon from './Icon';

const STYLES = {
    success: { bg: 'bg-emerald-600', icon: 'check' },
    error: { bg: 'bg-red-600', icon: 'alert-triangle' },
    warning: { bg: 'bg-amber-500', icon: 'alert-triangle' },
    info: { bg: 'bg-sky-600', icon: 'alert-circle' },
};

export default function ToastViewport() {
    const toasts = useToasts();
    return (
        <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2" aria-live="polite" role="status">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    role={t.type === 'error' ? 'alert' : 'status'}
                    onMouseEnter={() => pause(t.id)}
                    onMouseLeave={() => resume(t.id)}
                    className={`toast-enter flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${STYLES[t.type].bg}`}
                >
                    <Icon name={STYLES[t.type].icon} size={18} />
                    <span className="min-w-0">{t.message}</span>
                    <button onClick={() => dismiss(t.id)} className="ml-2 shrink-0 opacity-80 hover:opacity-100" aria-label="Tutup">
                        <Icon name="x" size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}
