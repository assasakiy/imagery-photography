function Block({ className = '' }) {
    return <div className={`animate-pulse rounded-lg bg-surface-muted ${className}`} />;
}

export default function CardSkeleton() {
    return (
        <div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="card p-5">
                        <div className="flex items-center justify-between gap-2">
                            <Block className="h-3 w-20" />
                            <Block className="h-5 w-16 rounded-full" />
                        </div>
                        <Block className="mt-2 h-5 w-3/4" />
                        <Block className="mt-3 h-3 w-full" />
                        <Block className="mt-3 h-3 w-2/3" />
                        <div className="mt-5 flex items-center justify-between">
                            <Block className="h-8 w-24" />
                            <Block className="h-8 w-24" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}