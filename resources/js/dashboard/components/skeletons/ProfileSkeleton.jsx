import Block from './Block';
import FormSkeleton from './FormSkeleton';

export default function ProfileSkeleton() {
    return (
        <div className="space-y-6">
            <div className="card overflow-hidden">
                <Block className="h-32 w-full rounded-none sm:h-40" />
                <div className="relative z-10 px-5 pb-6 sm:px-8">
                    <div className="-mt-12 flex items-end justify-between sm:-mt-14">
                        <Block className="h-24 w-24 rounded-full ring-4 ring-surface sm:h-28 sm:w-28" />
                    </div>
                    <div className="mt-4 space-y-2">
                        <Block className="h-6 w-48 rounded" />
                        <Block className="h-4 w-32 rounded" />
                        <Block className="h-4 w-64 rounded" />
                    </div>
                </div>
            </div>
            <FormSkeleton />
        </div>
    );
}
