import Block from './Block';

export default function StatCardsSkeleton({ count = 4, colsClass = 'sm:grid-cols-2 lg:grid-cols-4' }) {
    return (
        <div className={`grid grid-cols-2 gap-4 ${colsClass}`}>
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="card p-4 sm:p-5">
                    <Block className="h-3 w-20 rounded" />
                    <Block className="mt-2 h-6 w-28 rounded" />
                </div>
            ))}
        </div>
    );
}
