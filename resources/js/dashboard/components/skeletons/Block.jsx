export default function Block({ className = '', style }) {
    return <div className={`animate-pulse rounded bg-surface-muted ${className}`} style={style} />;
}
