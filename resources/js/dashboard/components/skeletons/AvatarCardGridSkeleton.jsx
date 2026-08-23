import Block from './Block';

export default function AvatarCardGridSkeleton({ count = 6, cols = 'md:grid-cols-2 xl:grid-cols-3' }) {
    return (
        <div className={`grid grid-cols-1 gap-4 ${cols}`}>
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="card p-5">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                            <Block className="h-12 w-12 shrink-0 rounded-full" />
                            <div className="min-w-0 space-y-1.5">
                                <Block className="h-4 w-32 rounded" />
                                <Block className="h-3 w-40 rounded" />
                                <Block className="h-3 w-24 rounded" />
                            </div>
                        </div>
                        <Block className="h-5 w-16 shrink-0 rounded-full" />
                    </div>
                    <div className="mt-3">
                        <Block className="h-4 w-24 rounded-full" />
                    </div>
                    <div className="mt-4 flex gap-1">
                        <Block className="h-8 w-16 rounded-lg" />
                        <Block className="h-8 w-16 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
}
