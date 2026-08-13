import CardSkeleton from './skeletons/CardSkeleton';
import TableSkeleton from './skeletons/TableSkeleton';
import FormSkeleton from './skeletons/FormSkeleton';

const SKELETON_MAP = {
    card: CardSkeleton,
    table: TableSkeleton,
    form: FormSkeleton,
};

export default function Skeleton({ variant = 'card' }) {
    const SkeletonComponent = SKELETON_MAP[variant] || CardSkeleton;
    return <SkeletonComponent />;
}