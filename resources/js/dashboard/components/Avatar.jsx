import React from 'react';

export default function Avatar({ src, name, size = 'md', shape = 'full', className = '' }) {
    const sizeClasses = {
        xs: 'h-6 w-6 text-[10px]',
        sm: 'h-8 w-8 text-xs',
        md: 'h-9 w-9 text-xs',
        lg: 'h-10 w-10 text-sm',
        xl: 'h-14 w-14 text-base',
        '2xl': 'h-24 w-24 text-2xl',
    };

    const shapeClasses = {
        full: 'rounded-full',
        xl: 'rounded-xl',
        lg: 'rounded-lg',
    };

    const sz = sizeClasses[size] || sizeClasses.md;
    const sh = shapeClasses[shape] || shapeClasses.xl;
    
    // Inisial dari nama
    const initial = (name || '?').charAt(0).toUpperCase();

    return (
        <div className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-surface-muted text-ink-muted ring-1 ring-black/5 dark:ring-white/10 ${sz} ${sh} ${className}`}>
            {src ? (
                <img src={src} alt={name || 'Avatar'} className="h-full w-full object-cover" />
            ) : (
                <span className="font-bold">{initial}</span>
            )}
        </div>
    );
}
