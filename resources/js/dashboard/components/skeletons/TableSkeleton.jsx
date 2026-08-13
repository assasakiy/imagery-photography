function Block({ className = '' }) {
    return <div className={`animate-pulse rounded-lg bg-surface-muted ${className}`} />;
}

export default function TableSkeleton() {
    return (
        <div>
            <div className="card overflow-hidden">
                <div className="grid grid-cols-12 gap-4 border-b border-line px-5 py-4">
                    <Block className="col-span-4 h-3" />
                    <Block className="col-span-3 h-3" />
                    <Block className="col-span-2 h-3" />
                    <Block className="col-span-3 h-3" />
                </div>
                {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="grid grid-cols-12 items-center gap-4 border-b border-line px-5 py-4">
                        <Block className="col-span-4 h-3.5" />
                        <Block className="col-span-3 h-3.5" />
                        <Block className="col-span-2 h-3.5" />
                        <Block className="col-span-3 h-3.5" />
                    </div>
                ))}
                <div className="flex items-center justify-between px-5 py-4">
                    <Block className="h-3 w-32" />
                    <div className="flex gap-2">
                        <Block className="h-8 w-8" />
                        <Block className="h-8 w-8" />
                    </div>
                </div>
            </div>
        </div>
    );
}