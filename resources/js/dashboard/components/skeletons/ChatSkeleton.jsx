import Block from './Block';

function Bubble({ own = false, w = 'w-2/3' }) {
    return (
        <div className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
            <Block className={`h-10 ${w} max-w-[75%] rounded-2xl ${own ? 'rounded-br-md' : 'rounded-bl-md'}`} />
        </div>
    );
}

export default function ChatSkeleton() {
    return (
        <div className="card grid h-[calc(100vh-13rem)] grid-cols-1 overflow-hidden md:grid-cols-[280px_1fr]">
            {/* Daftar percakapan */}
            <div className="hidden flex-col divide-y divide-line/60 border-r border-line md:flex">
                {Array.from({ length: 7 }, (_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3.5">
                        <Block className="h-10 w-10 shrink-0 rounded-full" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <Block className="h-3.5 w-24 rounded" />
                                <Block className="h-2.5 w-8 rounded" />
                            </div>
                            <Block className="h-3 w-full max-w-[170px] rounded" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Thread */}
            <div className="flex min-h-0 flex-col">
                <div className="flex items-center gap-3 border-b border-line p-4">
                    <Block className="h-9 w-9 rounded-full" />
                    <Block className="h-4 w-36 rounded" />
                </div>
                <div className="flex flex-1 flex-col justify-end gap-3 p-4">
                    <Bubble w="w-1/2" />
                    <Bubble own w="w-2/3" />
                    <Bubble w="w-3/5" />
                    <Bubble own w="w-2/5" />
                    <Bubble w="w-3/4" />
                </div>
                <div className="flex items-center gap-3 border-t border-line p-3">
                    <Block className="h-10 flex-1 rounded-xl" />
                    <Block className="h-10 w-10 shrink-0 rounded-xl" />
                </div>
            </div>
        </div>
    );
}
