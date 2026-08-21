function isVerified(user, explicit) {
    if (explicit !== undefined) return explicit;
    if (user?.verified !== undefined) return user.verified;
    if (['owner', 'admin'].includes(user?.role)) return true;
    return user?.roles?.some((role) => ['owner', 'admin'].includes(typeof role === 'string' ? role : role.name)) ?? false;
}

export default function VerifiedName({ user, name, verified, className = '' }) {
    return (
        <span className={`inline-flex min-w-0 items-center gap-1 ${className}`}>
            <span className="truncate">{name || user?.name || 'Pengguna'}</span>
            {isVerified(user, verified) && (
                <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white" title="Akun terverifikasi" aria-label="Akun terverifikasi">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m6.5 12.5 3.5 3.5 7.5-8" />
                    </svg>
                </span>
            )}
        </span>
    );
}
