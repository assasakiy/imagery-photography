import CardSkeleton from './skeletons/CardSkeleton';
import TableSkeleton from './skeletons/TableSkeleton';
import FormSkeleton from './skeletons/FormSkeleton';
import StatCardsSkeleton from './skeletons/StatCardsSkeleton';
import CardGridSkeleton from './skeletons/CardGridSkeleton';
import DataTableSkeleton from './skeletons/DataTableSkeleton';
import ListSkeleton from './skeletons/ListSkeleton';
import ChatSkeleton from './skeletons/ChatSkeleton';
import DetailSkeleton from './skeletons/DetailSkeleton';
import ChartSkeleton from './skeletons/ChartSkeleton';
import ProfileSkeleton from './skeletons/ProfileSkeleton';
import AvatarCardGridSkeleton from './skeletons/AvatarCardGridSkeleton';
import CardListSkeleton from './skeletons/CardListSkeleton';

const SKELETON_MAP = {
    card: CardGridSkeleton,
    'card-grid': CardGridSkeleton,
    'avatar-card-grid': AvatarCardGridSkeleton,
    'card-legacy': CardSkeleton,
    'card-list': CardListSkeleton,
    AvatarCardGridSkeleton,
    table: DataTableSkeleton,
    form: FormSkeleton,
    'stat-cards': StatCardsSkeleton,
    list: ListSkeleton,
    chat: ChatSkeleton,
    detail: DetailSkeleton,
    chart: ChartSkeleton,
    ProfileSkeleton,
    profile: ProfileSkeleton,
};

export default function Skeleton({ variant = 'card', ...props }) {
    const SkeletonComponent = SKELETON_MAP[variant] || CardGridSkeleton;
    return <SkeletonComponent {...props} />;
}

export {
    CardSkeleton,
    TableSkeleton,
    FormSkeleton,
    StatCardsSkeleton,
    CardGridSkeleton,
    DataTableSkeleton,
    ListSkeleton,
    ChatSkeleton,
    DetailSkeleton,
    ChartSkeleton,
    ProfileSkeleton,
    CardListSkeleton,
    AvatarCardGridSkeleton,
};
