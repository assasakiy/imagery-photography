import Skeleton from './Skeleton';

export default function SkeletonTable({ columns = 4, rows = 5 }) {
    const colClass = `grid-cols-${Math.min(columns, 12)}`;

    return (
        <div className="card overflow-hidden">
            <div className={`grid ${colClass} gap-4 border-b border-line px-5 py-4`}>
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className="h-3" />
                ))}
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className={`grid ${colClass} items-center gap-4 border-b border-line px-5 py-4`}>
                    {Array.from({ length: columns }).map((_, j) => (
                        <Skeleton
                            key={j}
                            className={`h-3.5 ${j === columns - 1 ? 'w-16' : j === 0 ? 'w-4/5' : j % 2 === 0 ? 'w-3/5' : 'w-2/3'}`}
                        />
                    ))}
                </div>
            ))}
            <div className="flex items-center justify-between px-5 py-4">
                <Skeleton className="h-3 w-32" />
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                </div>
            </div>
        </div>
    );
}