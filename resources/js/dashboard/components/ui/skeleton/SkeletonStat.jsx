import Skeleton from './Skeleton';

export default function SkeletonStat() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="card p-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-9 w-9 rounded-lg" />
                            <Skeleton className="h-5 w-12 rounded-full" />
                        </div>
                        <Skeleton className="mt-3 h-6 w-20" />
                        <Skeleton className="mt-2 h-3 w-24" />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="card p-5 lg:col-span-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="mt-4 h-48 w-full" />
                </div>
                <div className="card p-5">
                    <Skeleton className="h-4 w-32" />
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="mt-4 flex items-center gap-3">
                            <Skeleton className="h-2.5 flex-1" />
                            <Skeleton className="h-3 w-10" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="card p-5 lg:col-span-1">
                        <Skeleton className="h-4 w-36" />
                        {Array.from({ length: 4 }).map((__, j) => (
                            <div key={j} className="mt-4 flex items-center gap-3">
                                <Skeleton className="h-3 w-2/5" />
                                <Skeleton className="ml-auto h-3 w-16" />
                            </div>
                        ))}
                    </div>
                ))}
                <div className="card flex items-center justify-between p-5 lg:col-span-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            </div>
        </div>
    );
}