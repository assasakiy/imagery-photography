import Skeleton from './Skeleton';

export default function SkeletonCard({ image = false, className = '' }) {
    return (
        <div className={`card overflow-hidden ${className}`}>
            {image && <Skeleton className="aspect-[4/3] w-full rounded-none" />}
            <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="mt-2 h-5 w-3/4" />
                <Skeleton className="mt-3 h-3 w-full" />
                <Skeleton className="mt-3 h-3 w-2/3" />
                <div className="mt-5 flex items-center justify-between">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                </div>
            </div>
        </div>
    );
}