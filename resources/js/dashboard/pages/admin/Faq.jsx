import { useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../../components/Icon';
import { PageHeader } from '../../components/ui';
import FaqTab from './content/FaqTab';
import StatsTab from './content/StatsTab';

const VIEWS = [
    { key: 'faq', to: '/dashboard/faq', label: 'FAQ', icon: 'message-circle', actionLabel: 'Tambah FAQ' },
    { key: 'stats', to: '/dashboard/stats', label: 'Stats', icon: 'trending-up', actionLabel: 'Tambah Stat' },
];

export default function Faq() {
    const location = useLocation();
    const faqRef = useRef(null);
    const statsRef = useRef(null);

    const active = VIEWS.find((v) => v.to === location.pathname) || VIEWS[0];
    const view = active.key;

    const handleAdd = () => {
        if (view === 'faq') faqRef.current?.openCreate();
        else statsRef.current?.openCreate();
    };

    return (
        <>
            <PageHeader
                title="FAQ & Stats"
                subtitle="Kelola pertanyaan yang sering diajukan dan statistik angka untuk dipilih pada halaman publik."
                action={
                    <button className="btn-primary" onClick={handleAdd}>
                        <Icon name="plus" size={18} /> {active.actionLabel}
                    </button>
                }
            />

            <div className="mb-5 flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1">
                {VIEWS.map((v) => (
                    <Link
                        key={v.key}
                        to={v.to}
                        className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                            view === v.key ? 'action-surface shadow shadow-black/10' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                        }`}
                    >
                        <Icon name={v.icon} size={16} /> {v.label}
                    </Link>
                ))}
            </div>

            {view === 'faq' ? <FaqTab ref={faqRef} /> : <StatsTab ref={statsRef} />}
        </>
    );
}