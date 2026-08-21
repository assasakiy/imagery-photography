import { useState } from 'react';
import Icon from './Icon';

export default function FilterDropdown({ title, icon, options, value, onChange, multi = false, singlePerGroup = false }) {
    const [open, setOpen] = useState(false);
    const isArr = Array.isArray(value);
    const selected = isArr ? options.filter((option) => value.includes(option.key)) : options.filter((option) => option.key === value);
    const activeLabel = selected.length ? selected.map((option) => option.label).join(', ') : title;

    const toggle = (option) => {
        if (!multi) {
            onChange(value === option.key ? '' : option.key);
            setOpen(false);
            return;
        }
        const active = value.includes(option.key);
        if (active) {
            onChange(value.filter((key) => key !== option.key));
        } else {
            const next = singlePerGroup && option.group
                ? value.filter((key) => options.find((item) => item.key === key)?.group !== option.group)
                : value;
            onChange([...next, option.key]);
        }
    };

    return (
        <div className="relative ml-auto w-full md:w-auto">
            <button type="button" onClick={() => setOpen((current) => !current)} className="input flex w-full items-center justify-between gap-2 px-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                    <Icon name={icon} size={14} className="shrink-0 text-ink-muted" />
                    <span className="truncate font-medium text-ink">{activeLabel}</span>
                    {selected.length > 0 && <span className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold leading-none text-white">{selected.length}</span>}
                </span>
                <Icon name="chevron-down" size={14} className={`shrink-0 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute left-0 top-full z-30 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-xl">
                    <button type="button" onClick={() => { onChange(multi ? [] : ''); setOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink-muted transition-colors hover:bg-surface-muted">
                        <Icon name="x" size={14} className="shrink-0" />
                        Semua
                    </button>
                    {options.map((option, index) => {
                        const active = isArr ? value.includes(option.key) : value === option.key;
                        const showDivider = option.group && index > 0 && options[index - 1].group !== option.group;
                        return (
                            <div key={option.key}>
                                {showDivider && <div className="my-1.5 h-px bg-line" />}
                                <button type="button" onClick={() => toggle(option)} className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface-muted ${active ? 'font-semibold text-brand-600 dark:text-brand-400' : 'text-ink'}`}>
                                    <span className="flex min-w-0 items-center gap-2">
                                        {option.icon && <Icon name={option.icon} size={14} className="shrink-0 text-ink-muted" />}
                                        <span className="truncate">{option.label}</span>
                                    </span>
                                    {active && <Icon name="check" size={14} className="shrink-0 text-brand-600" />}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
