import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';

export default function SearchableMultiSelect({ 
    options = [], 
    value = [], 
    onChange, 
    placeholder = "Pilih...",
    searchPlaceholder = "Cari...",
    allowCreate = false,
    emptyMessage = "Tidak ada opsi"
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef(null);

    const availableOptions = options.filter(o => !value.includes(o.value || o));
    const filteredOptions = availableOptions.filter(o => 
        (o.label || o).toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (val) => {
        onChange([...value, val]);
        setSearch('');
        setOpen(false);
    };

    const handleRemove = (val) => {
        onChange(value.filter(v => v !== val));
    };

    const handleKeyDown = (e) => {
        if (allowCreate && e.key === 'Enter' && search.trim()) {
            e.preventDefault();
            const val = search.trim();
            if (!value.includes(val)) {
                onChange([...value, val]);
            }
            setSearch('');
            setOpen(false);
        }
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

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div 
                className="input h-9 flex items-center justify-between cursor-pointer bg-white dark:bg-surface text-sm gap-2"
                onClick={() => setOpen(!open)}
            >
                <span className="text-ink-muted truncate">{placeholder}</span>
                <Icon name={open ? "chevron-up" : "chevron-down"} size={16} className="text-ink-muted shrink-0" />
            </div>

            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-line bg-surface shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-line">
                        <input 
                            type="text" 
                            className="input h-8 text-xs w-full" 
                            placeholder={searchPlaceholder} 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                    </div>
                    <ul className="max-h-48 overflow-y-auto py-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt, i) => (
                                <li 
                                    key={i} 
                                    className="px-3 py-1.5 text-sm cursor-pointer hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-900/30 text-ink"
                                    onClick={() => handleSelect(opt.value || opt)}
                                >
                                    {opt.label || opt}
                                </li>
                            ))
                        ) : (
                            <li className="px-3 py-2 text-xs text-ink-muted text-center">
                                {allowCreate && search ? `Tekan Enter untuk menambah "${search}"` : emptyMessage}
                            </li>
                        )}
                    </ul>
                </div>
            )}

            {value.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                    {value.map((v, i) => {
                        const opt = options.find(o => (o.value || o) === v) || { label: v, value: v };
                        return (
                            <div key={i} className="inline-flex items-center gap-1.5 px-2 py-1 bg-brand-600/10 text-brand-600 border border-brand-600/20 rounded-md text-xs">
                                <span className="font-medium">{opt.label || opt}</span>
                                <button type="button" onClick={() => handleRemove(v)} className="hover:bg-brand-600/20 rounded-full p-0.5">
                                    <Icon name="x" size={12} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
