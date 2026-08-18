import { useEffect, useRef, useState } from 'react';
import { SOCIAL_PLATFORMS, SocialLogo } from './socialPlatforms';

export default function SocialSelect({ value, onChange, placeholder = 'Pilih platform...' }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const current = SOCIAL_PLATFORMS.find((p) => p.type === value);

    useEffect(() => {
        const onDoc = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="input flex items-center justify-between gap-2 text-left"
            >
                {current ? (
                    <span className="flex items-center gap-2">
                        <SocialLogo type={current.type} size={16} className="shrink-0 text-ink" />
                        {current.label}
                    </span>
                ) : (
                    <span className="text-ink-muted">{placeholder}</span>
                )}
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
            </button>

            {open && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-xl border border-line bg-surface p-1.5 shadow-lg shadow-black/5">
                    {SOCIAL_PLATFORMS.map((p) => (
                        <button
                            key={p.type}
                            type="button"
                            onClick={() => { onChange(p.type); setOpen(false); }}
                            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${value === p.type ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300' : 'text-ink hover:bg-surface-muted'}`}
                        >
                            <SocialLogo type={p.type} size={16} className="shrink-0 text-ink" />
                            <span className="font-medium">{p.label}</span>
                            {value === p.type && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto shrink-0 text-brand-600"><path d="M20 6 9 17l-5-5" /></svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}