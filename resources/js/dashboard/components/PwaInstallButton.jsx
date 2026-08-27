import { useEffect, useState } from 'react';
import Icon from './Icon';
import { usePwaInstall } from '../hooks/usePwaInstall';

export default function PwaInstallButton({ compact = false }) {
    const { canInstall, installed, ios, install } = usePwaInstall();
    const [open, setOpen] = useState(false);
    const [showLabel, setShowLabel] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShowLabel(false), 3500);
        return () => clearTimeout(timer);
    }, []);

    if (installed || !canInstall) return null;

    const handleClick = async () => {
        if (ios) {
            setOpen(true);
            return;
        }
        await install();
    };

    return (
        <>
            <button type="button" onClick={handleClick} title="Pasang Aplikasi" aria-label="Pasang Aplikasi" className={compact ? 'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-muted hover:text-ink' : 'btn-primary'}>
                <Icon name="download" size={16} />
                {showLabel && <span className="whitespace-nowrap">Pasang Aplikasi</span>}
            </button>
            {open && ios && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setOpen(false)}>
                    <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="font-semibold text-ink">Pasang aplikasi</h2>
                                <p className="mt-2 text-sm leading-relaxed text-ink-muted">Tekan Share di browser, lalu pilih <strong className="text-ink">Add to Home Screen</strong>.</p>
                            </div>
                            <button type="button" onClick={() => setOpen(false)} className="icon-btn" aria-label="Tutup"><Icon name="x" size={18} /></button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
