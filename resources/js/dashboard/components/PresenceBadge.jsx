function relativeLabel(lastSeenAt) {
    if (!lastSeenAt) return 'belum pernah aktif';
    const diff = Math.max(0, (Date.now() - new Date(lastSeenAt).getTime()) / 1000);
    if (diff < 60) return 'baru saja';
    if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
    if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
    return Math.floor(diff / 86400) + ' hari lalu';
}

export default function PresenceBadge({ online, lastSeenAt, className = '' }) {
    return online ? (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 ${className}`}>
            <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            Online
        </span>
    ) : (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2 py-0.5 text-xs text-ink-muted ${className}`}>
            <span className="h-2 w-2 rounded-full bg-ink-muted/50"></span>
            {relativeLabel(lastSeenAt)}
        </span>
    );
}