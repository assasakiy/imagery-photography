import Icon from './Icon';

export function InlineSpinner({ size = 16, className = '' }) {
    return (
        <svg className={`animate-spin ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label="Memuat">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
        </svg>
    );
}

const VARIANTS = {
    primary: 'bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700',
    dark: 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200',
    outline: 'border border-line bg-transparent text-ink hover:bg-surface-muted',
    ghost: 'text-ink-muted hover:bg-surface-muted hover:text-ink',
    danger: 'bg-red-600 text-white shadow-lg shadow-red-600/25 hover:bg-red-700',
    'danger-outline': 'border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40',
};

const SIZES = {
    md: 'px-5 py-2.5 text-sm',
    sm: 'px-3 py-2 text-sm',
    xs: 'px-2.5 py-1.5 text-xs',
};

export default function Button({
    icon,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    type = 'button',
    className = '',
    children,
    onClick,
    ...rest
}) {
    const iconSize = size === 'md' ? 16 : 14;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
            {...rest}
        >
            {loading ? <InlineSpinner size={iconSize} /> : icon ? <Icon name={icon} size={iconSize} /> : null}
            {children}
        </button>
    );
}
