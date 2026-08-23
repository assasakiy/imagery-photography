import Block from './Block';

function Cell({ shape }) {
    if (shape === 'avatar') {
        return (
            <div className="flex items-center gap-3">
                <Block className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                    <Block className="h-3.5 w-28 rounded" />
                    <Block className="h-3 w-36 max-w-full rounded" />
                </div>
            </div>
        );
    }
    if (shape === 'badge') return <Block className="h-5 w-20 rounded-full" />;
    if (shape === 'thumb') return <Block className="h-10 w-16 rounded-lg" />;
    if (shape === 'actions') {
        return (
            <div className="flex gap-1">
                <Block className="h-8 w-8 rounded-lg" />
                <Block className="h-8 w-8 rounded-lg" />
            </div>
        );
    }
    return <Block className="h-3 w-24 max-w-full rounded" />;
}

export default function DataTableSkeleton({ columns, rows = 5, pagination = true }) {
    const cols = columns?.length
        ? columns
        : [
              { label: 'Nama', width: '35%', shape: 'avatar' },
              { label: 'Status', width: '20%', shape: 'badge' },
              { label: 'Tanggal', width: '20%' },
              { label: 'Aksi', width: '25%', shape: 'actions' },
          ];

    return (
        <div className="card overflow-x-auto">
            <table className="table">
                <thead>
                    <tr>
                        {cols.map((c) => (
                            <th key={c.label} style={c.width ? { width: c.width } : undefined}>{c.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }, (_, i) => (
                        <tr key={i}>
                            {cols.map((c) => (
                                <td key={c.label}><Cell shape={c.shape} /></td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {pagination && (
                <div className="flex items-center justify-between border-t border-line px-4 py-3">
                    <Block className="h-3 w-40 rounded" />
                    <div className="flex gap-2">
                        <Block className="h-9 w-24 rounded-lg" />
                        <Block className="h-9 w-24 rounded-lg" />
                    </div>
                </div>
            )}
        </div>
    );
}
