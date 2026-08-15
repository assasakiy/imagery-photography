import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';

export default function CustomSelect({ 
    options = [], 
    value, 
    onChange, 
    placeholder = "Pilih..."
}) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    const handleSelect = (val) => {
        onChange(val);
        setOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => (o.value || o) === value) || { label: value, value: value };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div 
                className="input h-9 flex items-center justify-between cursor-pointer bg-white dark:bg-surface text-sm gap-2"
                onClick={() => setOpen(!open)}
            >
                <span className="text-ink truncate font-medium text-brand-600">{value ? selectedOption.label || selectedOption : placeholder}</span>
                <Icon name={open ? "chevron-up" : "chevron-down"} size={16} className="text-ink-muted shrink-0" />
            </div>

            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-line bg-surface shadow-lg overflow-hidden">
                    <ul className="max-h-48 overflow-y-auto py-1">
                        {options.length > 0 ? (
                            options.map((opt, i) => (
                                <li 
                                    key={i} 
                                    className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-900/30 text-ink ${(opt.value || opt) === value ? 'bg-brand-50/50 dark:bg-brand-900/10 font-semibold' : ''}`}
                                    onClick={() => handleSelect(opt.value || opt)}
                                >
                                    {opt.label || opt}
                                </li>
                            ))
                        ) : (
                            <li className="px-3 py-2 text-xs text-ink-muted text-center">Tidak ada opsi</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
