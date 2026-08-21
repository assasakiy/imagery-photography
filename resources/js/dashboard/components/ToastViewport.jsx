import { useToasts, dismiss } from '../lib/toast';
import Icon from './Icon';

const STYLES = {
    success: { bg: 'bg-emerald-600', icon: 'check' },
    error: { bg: 'bg-red-600', icon: 'alert-triangle' },
    warning: { bg: 'bg-amber-500', icon: 'alert-triangle' },
    info: { bg: 'bg-sky-600', icon: 'info' },
};

export default function ToastViewport() {
    const toasts = useToasts();
    return (
        <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2" aria-live="polite" role="status">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    role={t.type === 'error' ? 'alert' : 'status'}
                    className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${STYLES[t.type].bg}`}
                >
                    <Icon name={STYLES[t.type].icon} size={18} />
                    <span>{t.message}</span>
                    <button onClick={() => dismiss(t.id)} className="ml-2 opacity-80 hover:opacity-100" aria-label="Tutup">
                        <Icon name="x" size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}
