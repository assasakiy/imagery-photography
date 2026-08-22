function Block({ className = '' }) {
    return <div className={`animate-pulse rounded bg-surface-muted ${className}`} />;
}

export default function TableSkeleton() {
    return (
        <div className="card overflow-x-auto">
            <table className="table">
                <thead>
                    <tr>
                        <th className="w-[35%]">Nama</th>
                        <th className="w-[20%]">Status</th>
                        <th className="w-[15%]">Project</th>
                        <th className="w-[15%]">Bergabung</th>
                        <th className="w-[15%]">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {[0, 1, 2, 3, 4].map((i) => (
                        <tr key={i}>
                            <td>
                                <div className="flex items-center gap-3">
                                    <Block className="h-10 w-10 shrink-0 rounded-full" />
                                    <div className="min-w-0 flex-1 space-y-1.5">
                                        <Block className="h-3.5 w-28 rounded" />
                                        <Block className="h-3 w-36 rounded" />
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className="flex flex-col gap-1.5">
                                    <Block className="h-5 w-20 rounded-full" />
                                    <Block className="h-5 w-16 rounded-full" />
                                </div>
                            </td>
                            <td><Block className="h-5 w-20 rounded-full" /></td>
                            <td><Block className="h-3 w-24 rounded" /></td>
                            <td>
                                <div className="flex gap-1">
                                    <Block className="h-8 w-8 rounded-lg" />
                                    <Block className="h-8 w-8 rounded-lg" />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-line px-4 py-3">
                <Block className="h-3 w-40 rounded" />
                <div className="flex gap-2">
                    <Block className="h-9 w-28 rounded-lg" />
                    <Block className="h-9 w-28 rounded-lg" />
                </div>
            </div>
        </div>
    );
}