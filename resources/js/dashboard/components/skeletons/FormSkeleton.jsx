function Block({ className = '' }) {
    return <div className={`animate-pulse bg-surface-muted ${className}`} />;
}

export default function FormSkeleton() {
    return (
        <div className="w-full max-w-4xl space-y-6">
            {/* Tabs Skeleton */}
            <div className="flex gap-1 overflow-x-hidden rounded-2xl border border-line bg-surface p-1.5">
                {[1, 2, 3, 4, 5].map(i => (
                    <Block key={i} className="h-10 w-24 rounded-xl flex-shrink-0" />
                ))}
            </div>

            {/* Form Card Skeleton 1 */}
            <div className="card space-y-6 p-6">
                <div className="mb-5">
                    <Block className="mb-2 h-5 w-40 rounded" />
                    <Block className="h-3 w-64 rounded" />
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <Block className="mb-2 h-3 w-24 rounded" />
                        <Block className="h-10 w-full rounded-lg" />
                    </div>
                    <div>
                        <Block className="mb-2 h-3 w-20 rounded" />
                        <Block className="h-10 w-full rounded-lg" />
                    </div>
                </div>

                <div>
                    <Block className="mb-2 h-3 w-32 rounded" />
                    <Block className="h-24 w-full rounded-lg" />
                </div>

                <div className="mt-6 flex justify-end border-t border-line pt-5">
                    <Block className="h-10 w-32 rounded-lg" />
                </div>
            </div>

            {/* Form Card Skeleton 2 */}
            <div className="card space-y-6 p-6">
                <div className="mb-5">
                    <Block className="mb-2 h-5 w-32 rounded" />
                    <Block className="h-3 w-48 rounded" />
                </div>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Block className="mb-1 h-4 w-40 rounded" />
                            <Block className="h-3 w-56 rounded" />
                        </div>
                        <Block className="h-6 w-12 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <Block className="mb-1 h-4 w-32 rounded" />
                            <Block className="h-3 w-48 rounded" />
                        </div>
                        <Block className="h-6 w-12 rounded-full" />
                    </div>
                </div>

                <div className="mt-6 flex justify-end border-t border-line pt-5">
                    <Block className="h-10 w-32 rounded-lg" />
                </div>
            </div>
        </div>
    );
}