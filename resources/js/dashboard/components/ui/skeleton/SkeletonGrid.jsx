import { Fragment } from 'react';

export default function SkeletonGrid({ count = 3, columns = 'md:grid-cols-2 xl:grid-cols-3', className = '', children }) {
    return (
        <div className={`grid grid-cols-1 gap-4 ${columns} ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <Fragment key={i}>{children}</Fragment>
            ))}
        </div>
    );
}