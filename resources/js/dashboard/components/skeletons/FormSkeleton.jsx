function Block({ className = '' }) {
    return <div className={`animate-pulse rounded-lg bg-surface-muted ${className}`} />;
}

export default function FormSkeleton() {
    return (
        <div>
            <div className="card max-w-3xl space-y-6 p-6">
                <div>
                    <Block className="mb-2 h-3 w-24" />
                    <Block className="h-10 w-full" />
                </div>
                <div>
                    <Block className="mb-2 h-3 w-24" />
                    <Block className="h-10 w-full" />
                </div>
                <div>
                    <Block className="mb-2 h-3 w-24" />
                    <Block className="h-32 w-full" />
                </div>
                <div className="flex justify-end gap-2">
                    <Block className="h-10 w-28" />
                    <Block className="h-10 w-32" />
                </div>
            </div>
        </div>
    );
}