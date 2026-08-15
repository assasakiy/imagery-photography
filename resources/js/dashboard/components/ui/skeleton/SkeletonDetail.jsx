import Skeleton from './Skeleton';

export default function SkeletonDetail({ rows = 6, media = true, className = '' }) {
    return (
        <div className={`space-y-5 ${className}`}>
            <div className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="mt-2 h-6 w-64" />
                        <Skeleton className="mt-3 h-3 w-40" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-28" />
                        <Skeleton className="h-9 w-9" />
                    </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-lg bg-surface-muted/50 p-3">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="mt-2 h-4 w-20" />
                        </div>
                    ))}
                </div>
            </div>

            {media && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: rows }).map((_, i) => (
                        <div key={i} className="card overflow-hidden">
                            <Skeleton className="aspect-[4/3] w-full rounded-none" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}