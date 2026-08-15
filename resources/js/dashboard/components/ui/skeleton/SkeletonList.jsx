import Skeleton from './Skeleton';

export default function SkeletonList({ rows = 5, wrap = false, className = '' }) {
    if (wrap) {
        return (
            <div className={`flex flex-wrap gap-3 ${className}`}>
                {Array.from({ length: rows }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-28 rounded-full" />
                ))}
            </div>
        );
    }

    return (
        <div className={`card divide-y divide-line ${className}`}>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1">
                        <Skeleton className={`h-3.5 ${i % 3 === 0 ? 'w-2/3' : i % 3 === 1 ? 'w-1/2' : 'w-3/4'}`} />
                        <Skeleton className="mt-2 h-3 w-2/5" />
                    </div>
                    <Skeleton className="h-6 w-14 shrink-0 rounded-full" />
                </div>
            ))}
        </div>
    );
}