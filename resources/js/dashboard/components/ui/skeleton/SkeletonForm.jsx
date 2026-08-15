import Skeleton from './Skeleton';

export default function SkeletonForm({ fields = 3, wide = false }) {
    return (
        <div className={`card space-y-6 p-6 ${wide ? '' : 'max-w-3xl'}`}>
            {Array.from({ length: fields }).map((_, i) => (
                <div key={i}>
                    <Skeleton className="mb-2 h-3 w-24" />
                    <Skeleton className={i === 2 ? 'h-32 w-full' : 'h-10 w-full'} />
                </div>
            ))}
            <div className="flex justify-end gap-2">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-32" />
            </div>
        </div>
    );
}