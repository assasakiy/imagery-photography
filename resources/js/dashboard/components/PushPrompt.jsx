import { useState } from 'react';
import Icon from './Icon';
import { usePushSubscription } from '../hooks/usePushSubscription';

export default function PushPrompt() {
    const { supported, subscribed, shouldShowPrompt, isDeniedForever, subscribe, loading } = usePushSubscription();
    const [dismissed, setDismissed] = useState(false);

    if (loading || !supported || !shouldShowPrompt || subscribed || dismissed || isDeniedForever) {
        return null;
    }

    const handleActivate = async () => {
        const ok = await subscribe();
        if (!ok) {
            setDismissed(true);
        }
    };

    return (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-brand-500/20 bg-brand-500/5 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
                <Icon name="bell" size={20} />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">Aktifkan notifikasi?</p>
                <p className="text-xs text-ink-muted">Terima pemberitahuan pesan, booking, dan pembayaran meskipun aplikasi ditutup.</p>
            </div>
            <div className="flex shrink-0 gap-2">
                <button onClick={handleActivate} className="btn-primary px-3 py-1.5 text-xs">
                    Aktifkan
                </button>
                <button onClick={() => setDismissed(true)} className="btn-outline px-3 py-1.5 text-xs">
                    Nanti
                </button>
            </div>
        </div>
    );
}
