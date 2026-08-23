import Block from './Block';

const RATIOS = {
    photo: 'aspect-[4/3]',
    square: 'aspect-square',
    video: 'aspect-video',
    none: 'h-40',
};

export default function CardGridSkeleton({ count = 6, cols = 'sm:grid-cols-2 lg:grid-cols-3', ratio = 'photo', metaLines = 2, badge = false }) {
    return (
        <div className={`grid grid-cols-1 gap-4 ${cols}`}>
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="card overflow-hidden">
                    <Block className={`w-full rounded-none ${RATIOS[ratio] || RATIOS.photo}`} />
                    <div className="space-y-2 p-4">
                        {badge && <Block className="h-5 w-20 rounded-full" />}
                        {Array.from({ length: metaLines }, (_, j) => (
                            <Block key={j} className={j === 0 ? 'h-4 w-3/4 rounded' : 'h-3 w-1/2 rounded'} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
