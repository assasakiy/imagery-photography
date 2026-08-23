import Block from './Block';

export default function ChartSkeleton({ tall = false, rows = 6 }) {
    return (
        <div className={`card p-4 sm:p-5 ${tall ? 'flex flex-col' : ''}`}>
            <div className="mb-4 flex items-center justify-between">
                <Block className="h-5 w-40 rounded" />
                <Block className="h-8 w-24 rounded-lg" />
            </div>
            <div className={`flex items-end gap-2 ${tall ? 'h-64' : 'h-40'} w-full`}>
                {[45, 70, 35, 85, 60, 95, 50, 75].slice(0, Math.max(rows - 2, 3)).map((h, i) => (
                    <Block key={i} className="w-full rounded-t-lg" style={{ height: `${h}%` }} />
                ))}
            </div>
        </div>
    );
}
