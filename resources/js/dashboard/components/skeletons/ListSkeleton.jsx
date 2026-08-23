import Block from './Block';

function Leading({ type }) {
    if (type === 'avatar') return <Block className="h-9 w-9 shrink-0 rounded-full" />;
    if (type === 'icon') return <Block className="h-9 w-9 shrink-0 rounded-lg" />;
    return <Block className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-surface" />;
}

export default function ListSkeleton({ rows = 5, leading = 'icon', trailingBadge = false, timeline = false }) {
    return (
        <div className={timeline ? 'relative ml-1 space-y-5 border-l-2 border-line/50 pl-4 sm:ml-2 sm:pl-5' : 'card divide-y divide-line/60 p-2'}>
            {Array.from({ length: rows }, (_, i) => (
                <div key={i} className={`flex items-center gap-3 ${timeline ? 'relative min-w-0' : 'p-3'}`}>
                    {!timeline && <Leading type={leading} />}
                    {timeline && <span className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full bg-surface-muted ring-4 ring-surface" />}
                    <div className="min-w-0 flex-1 space-y-1.5">
                        <Block className="h-3.5 w-3/4 max-w-sm rounded" />
                        <Block className="h-3 w-32 rounded" />
                    </div>
                    {trailingBadge && <Block className="h-5 w-16 shrink-0 rounded-full" />}
                </div>
            ))}
        </div>
    );
}
