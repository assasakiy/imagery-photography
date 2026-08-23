import Block from './Block';

export default function DetailSkeleton({ stepper = true, stats = 4 }) {
    const statCols = stats >= 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3';

    return (
        <div className="space-y-6">
            {/* Hero: judul + badge + strip statistik */}
            <div className="card space-y-5 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex gap-2">
                            <Block className="h-5 w-32 rounded-lg" />
                            <Block className="h-5 w-24 rounded-full" />
                        </div>
                        <Block className="h-7 w-2/3 max-w-md rounded" />
                        <Block className="h-3 w-48 rounded" />
                    </div>
                </div>
                <div className={`grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-line ${statCols}`}>
                    {Array.from({ length: stats }, (_, i) => (
                        <div key={i} className="bg-surface p-4">
                            <Block className="h-3 w-16 rounded" />
                            <Block className="mt-1.5 h-5 w-24 rounded" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Filmstrip stepper */}
            {stepper && (
                <div className="card mb-0 overflow-hidden">
                    <div className="bg-zinc-900 px-4 py-4 dark:bg-zinc-950 sm:px-6">
                        <div className="flex items-center justify-center gap-3 px-1 pb-1">
                            {Array.from({ length: 4 }, (_, i) => (
                                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                                    <Block className="h-10 w-10 rounded-full !bg-zinc-700/80" />
                                    <Block className="h-2.5 w-14 rounded !bg-zinc-700/60" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Panel tahap */}
            <div className="card space-y-4 p-5">
                <Block className="h-5 w-40 rounded" />
                <Block className="h-3 w-full max-w-lg rounded" />
                <Block className="h-3 w-3/4 max-w-md rounded" />
                <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
                    {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className="rounded-xl border border-line p-4">
                            <Block className="h-3 w-20 rounded" />
                            <Block className="mt-2 h-8 w-16 rounded" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Catatan riwayat */}
            <div className="card p-4 sm:p-5">
                <Block className="mb-4 h-5 w-36 rounded" />
                <div className="relative ml-1 space-y-5 border-l-2 border-line/50 pl-4 sm:ml-2 sm:pl-5">
                    {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className="relative">
                            <span className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full bg-surface-muted ring-4 ring-surface sm:-left-[27px]" />
                            <Block className="h-3.5 w-2/3 max-w-sm rounded" />
                            <Block className="mt-1.5 h-3 w-28 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
