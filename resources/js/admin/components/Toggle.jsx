export default function Toggle({ checked, onChange, disabled = false, label, desc, size = 'md' }) {
    const dims = size === 'sm' ? { track: 'h-5 w-9', knob: 'h-4 w-4', on: 'translate-x-[18px]', off: 'translate-x-0.5' } : { track: 'h-6 w-11', knob: 'h-5 w-5', on: 'translate-x-[22px]', off: 'translate-x-0.5' };

    return (
        <div className="flex items-center justify-between gap-4">
            {label && (
                <div>
                    <p className="text-sm font-semibold text-ink">{label}</p>
                    {desc && <p className="mt-0.5 text-xs text-ink-muted">{desc}</p>}
                </div>
            )}
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChange(!checked)}
                className={`relative shrink-0 rounded-full transition-colors ${dims.track} ${
                    disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                } ${checked ? 'bg-brand-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 ${dims.knob} rounded-full bg-white shadow transition-transform ${
                        checked ? dims.on : dims.off
                    }`}
                />
            </button>
        </div>
    );
}
