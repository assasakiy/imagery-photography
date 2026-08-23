import Block from './Block';

export default function CardListSkeleton({ count = 5 }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="card p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-2.5">
                            <Block className="h-5 w-48 rounded" />
                            <Block className="h-3.5 w-full max-w-2xl rounded" />
                            <div className="flex gap-2">
                                <Block className="h-3 w-16 rounded" />
                                <Block className="h-3 w-24 rounded" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Block className="h-9 w-9 rounded-lg" />
                            <Block className="h-9 w-9 rounded-lg" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
