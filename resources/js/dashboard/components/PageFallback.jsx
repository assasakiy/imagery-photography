import { useState, useEffect } from 'react';
import CardSkeleton from './skeletons/CardSkeleton';
import TableSkeleton from './skeletons/TableSkeleton';
import FormSkeleton from './skeletons/FormSkeleton';

const SKELETON_MAP = {
    card: CardSkeleton,
    table: TableSkeleton,
    form: FormSkeleton,
};

export default function PageFallback({ variant = 'card' }) {
    const [show, setShow] = useState(false);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    useEffect(() => {
        const timer = setTimeout(() => setShow(true), isMobile ? 200 : 150);
        return () => clearTimeout(timer);
    }, [isMobile]);

    if (!show) return null;

    const Skeleton = SKELETON_MAP[variant] || CardSkeleton;
    return <Skeleton />;
}