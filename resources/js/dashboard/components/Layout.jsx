import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import Icon from './Icon';
import Avatar from './Avatar';
import Toggle from './Toggle';
import ScrollToTop from './ScrollToTop';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useBadges } from '../context/BadgeContext';
import { preloadRoute } from '../routes/preloadRoute';

function NavGroup({ item, setSidebarOpen, unreadMessages, unreadBookings, pendingPayments }) {
    const [open, setOpen] = useState(true);
    const location = useLocation();

    return (
        <div className="pt-2">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full px-3 py-1.5 group"
            >
                <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted/50 group-hover:text-ink-muted transition-colors">
                    {item.label}
                </span>
                <Icon name="chevron-down" size={14} className={`text-ink-muted/40 group-hover:text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="space-y-0.5 mt-1">
                    {item.sub.map(subItem => (
                            <NavLink
                                key={subItem.to}
                                to={subItem.to}
                                end={subItem.end}
                                onClick={() => setSidebarOpen(false)}
                                onMouseEnter={() => preloadRoute(subItem.to)}
                                onFocus={() => preloadRoute(subItem.to)}
                                onTouchStart={() => preloadRoute(subItem.to)}
                                className={({ isActive }) => {
                                        const active = subItem.activePaths ? subItem.activePaths.includes(location.pathname) : isActive;
                                        return `flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                                            active
                                                ? 'bg-brand-600/10 text-brand-600'
                                                : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                                        }`;
                                    }}
                            >
                                <Icon name={subItem.icon} size={18} className="shrink-0" />
                                <span className="ml-3">{subItem.label}</span>
                                {subItem.to === '/dashboard/messages' && unreadMessages > 0 && (
                                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full action-surface text-[10px] font-bold shadow-sm">
                                        {unreadMessages > 9 ? '9+' : unreadMessages}
                                    </span>
                                )}
                                {subItem.to === '/dashboard/bookings' && unreadBookings > 0 && (
                                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm">
                                        {unreadBookings > 9 ? '9+' : unreadBookings}
                                    </span>
                                )}
                                {subItem.to === '/dashboard/payments' && pendingPayments > 0 && (
                                    <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm">
                                        {pendingPayments > 9 ? '9+' : pendingPayments}
                                    </span>
                                )}
                            </NavLink>
                    ))}
                </div>
            )}
        </div>
    );
}

const adminNav = [
    { to: '/dashboard', icon: 'dashboard', label: 'Dashboard', end: true },
    {
        label: 'Katalog & Media',
        sub: [
            { to: '/dashboard/services', icon: 'list', label: 'Layanan' },
            { to: '/dashboard/portfolios', icon: 'briefcase', label: 'Portofolio' },
            { to: '/dashboard/media', icon: 'image', label: 'Media' },
        ]
    },
    {
        label: 'Proyek & Transaksi',
        sub: [
            { to: '/dashboard/bookings', icon: 'calendar', label: 'Booking' },
            { to: '/dashboard/projects', icon: 'folder-open', label: 'Proyek' },
            { to: '/dashboard/preview', icon: 'image', label: 'Preview' },
            { to: '/dashboard/payments', icon: 'credit-card', label: 'Pembayaran' },
        ]
    },
    {
        label: 'Interaksi & Klien',
        sub: [
            { to: '/dashboard/messages', icon: 'message-circle', label: 'Pesan' },
            { to: '/dashboard/reviews', icon: 'star', label: 'Review' },
            { to: '/dashboard/comments', icon: 'message-circle', label: 'Komentar' },
            { to: '/dashboard/clients', icon: 'users', label: 'Daftar Klien' },
            { to: '/dashboard/subscribers', icon: 'users', label: 'Subscriber' },
        ]
    },
    {
        label: 'Konten Website',
        sub: [
            { to: '/dashboard/blog', icon: 'file-text', label: 'Semua Artikel', end: true },
            { to: '/dashboard/kategori', icon: 'folder', label: 'Kategori' },
            { to: '/dashboard/blog/tags', icon: 'tag', label: 'Tag Blog' },
            { to: '/dashboard/faq', icon: 'message-circle', label: 'FAQ & Stats', activePaths: ['/dashboard/faq', '/dashboard/stats'] },
            { to: '/dashboard/pages', icon: 'file', label: 'Halaman' },
        ]
    },
    {
        label: 'Sistem',
        sub: [
            { to: '/dashboard/analytics', icon: 'trending-up', label: 'Analitik' },
            { to: '/dashboard/audit', icon: 'clock', label: 'Audit & Log' },
            { to: '/dashboard/recycle-bin', icon: 'trash', label: 'Recycle Bin' },
        ]
    }
];

const ownerNav = [
    { to: '/dashboard', icon: 'dashboard', label: 'Dashboard', end: true },
    ...adminNav.slice(1, -1),
    {
        label: 'Sistem',
        sub: [
            { to: '/dashboard/analytics', icon: 'trending-up', label: 'Analitik' },
            { to: '/dashboard/audit', icon: 'clock', label: 'Audit & Log' },
            { to: '/dashboard/recycle-bin', icon: 'trash', label: 'Recycle Bin' },
            { to: '/dashboard/team', icon: 'users', label: 'Admin' },
            { to: '/dashboard/settings', icon: 'settings', label: 'Pengaturan' },
        ]
    }
];

const clientNav = [
    { to: '/dashboard', icon: 'dashboard', label: 'Dashboard', end: true },
    { to: '/dashboard/pesanan', icon: 'folder-open', label: 'Pesanan' },
    { to: '/dashboard/client-bookings', icon: 'calendar', label: 'Booking' },
    { to: '/dashboard/client-invoices', icon: 'credit-card', label: 'Tagihan' },
    { to: '/dashboard/preview', icon: 'image', label: 'Preview' },
    { to: '/dashboard/client-messages', icon: 'message-circle', label: 'Pesan' },
    { to: '/dashboard/bookmarks', icon: 'heart', label: 'Bookmark' },
    { to: '/dashboard/history', icon: 'clock', label: 'Riwayat' },
];

const subscribeNav = [
    { to: '/dashboard', icon: 'dashboard', label: 'Dashboard', end: true },
    { to: '/dashboard/client-bookings', icon: 'calendar', label: 'Booking' },
    { to: '/dashboard/bookmarks', icon: 'heart', label: 'Bookmark' },
    { to: '/dashboard/history', icon: 'clock', label: 'Riwayat' },
];

const ROLE_LABEL = { owner: 'Pemilik', admin: 'Admin', client: 'Klien', subscriber: 'Subscriber' };

export default function Layout() {
    const { user, logout } = useAuth();
    const { theme, toggle } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const { unread, unreadMessages, unreadBookings, unpaidInvoices, pendingPayments, refresh } = useBadges();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef(null);

    const role = user?.role;
    const isStaff = ['admin', 'owner'].includes(role);
    const isClient = role === 'client';
    const nav = role === 'owner' ? ownerNav : isStaff ? adminNav : isClient ? clientNav : subscribeNav;

    const appConfig = window.APP_CONFIG || {};
    const siteLogo = appConfig.logo || '';
    const siteName = appConfig.siteName || 'Sopian Lalu Imagery';
    const siteFavicon = appConfig.favicon || '';

    useEffect(() => {
        document.title = `${siteName} — Dashboard`;
        if (siteFavicon) {
            const link = document.querySelector('link[rel="icon"]');
            if (link) link.href = siteFavicon;
        }
    }, [siteName, siteFavicon]);

    useEffect(() => {
        if (!user) return;
        refresh();
    }, [user, location.pathname, refresh]);

    useEffect(() => {
        const onClick = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    const handleLogout = async () => {
        setProfileOpen(false);
        await logout();
        navigate('/login');
    };

    const initial = (user?.name || '?').charAt(0).toUpperCase();

    return (
        <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
            {sidebarOpen && (
                <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface transition-transform duration-300 lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex h-16 items-center gap-3 border-b border-line px-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-muted">
                        {siteLogo ? (
                            <img src={siteLogo} alt={siteName} className="h-full w-full object-cover" />
                        ) : (
                            <Icon name="camera" size={20} />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink">{siteName}</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                        {nav.map((item) => {
                            if (item.sub) {
                                return <NavGroup key={item.label} item={item} setSidebarOpen={setSidebarOpen} unreadMessages={unreadMessages} unreadBookings={unreadBookings} pendingPayments={pendingPayments} />;
                            }

                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    onClick={() => setSidebarOpen(false)}
                                    onMouseEnter={() => preloadRoute(item.to)}
                                    onFocus={() => preloadRoute(item.to)}
                                    onTouchStart={() => preloadRoute(item.to)}
                                    className={({ isActive }) => {
                                        const active = item.activePaths ? item.activePaths.includes(location.pathname) : isActive;
                                        return `flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                                            active
                                                ? 'action-surface shadow-lg shadow-black/10'
                                                : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                                        }`;
                                    }}
                                >
                                    <Icon name={item.icon} size={18} className="shrink-0" />
                                    <span className="ml-3">{item.label}</span>
                                    {item.to === '/dashboard/messages' && unreadMessages > 0 && (
                                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full action-surface text-[10px] font-bold shadow-sm">
                                            {unreadMessages > 9 ? '9+' : unreadMessages}
                                        </span>
                                    )}
                                    {item.to === '/dashboard/bookings' && unreadBookings > 0 && (
                                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm">
                                            {unreadBookings > 9 ? '9+' : unreadBookings}
                                        </span>
                                    )}
                                    {item.to === '/dashboard/payments' && pendingPayments > 0 && (
                                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm">
                                            {pendingPayments > 9 ? '9+' : pendingPayments}
                                        </span>
                                    )}
                                    {item.to === '/dashboard/client-invoices' && unpaidInvoices > 0 && (
                                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm">
                                            {unpaidInvoices > 9 ? '9+' : unpaidInvoices}
                                        </span>
                                    )}
                                </NavLink>
                            );
                        })}
                </nav>

                <div className="border-t border-line p-4">
                    <a
                        href="/"
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-muted hover:text-ink"
                    >
                        <Icon name="globe" size={18} />
                        Lihat Situs
                    </a>
                </div>
            </aside>

            {/* Main */}
            <div className="lg:pl-64">
                {/* Topbar */}
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-line bg-surface/80 px-4 backdrop-blur sm:px-6">
                    <div className="flex items-center gap-3">
                        <button
                            className="rounded-lg p-2 text-ink-muted hover:bg-surface-muted lg:hidden"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Buka menu"
                        >
                            <Icon name="menu" size={22} />
                        </button>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <Link
                            to="/dashboard/notifications"
                            className="relative rounded-lg p-2 text-ink-muted hover:bg-surface-muted hover:text-ink"
                            aria-label="Notifikasi"
                        >
                            <Icon name="bell" size={20} />
                            {unread > 0 && (
                                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                    {unread}
                                </span>
                            )}
                        </Link>
                        

                        {/* Profile dropdown */}
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setProfileOpen((v) => !v)}
                                className="flex items-center gap-2 rounded-xl p-1.5 pr-2 text-ink transition-colors hover:bg-surface-muted"
                                aria-label="Menu profil"
                            >
                                <Avatar src={user?.avatar} name={user?.name} size="sm" shape="full" className="ring-2 ring-brand-500/30" />
                                <span className="hidden max-w-[120px] truncate text-sm font-semibold md:block">{user?.name}</span>
                                <Icon
                                    name="chevron-down"
                                    size={16}
                                    className={`text-ink-muted transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 top-full z-50 mt-2 w-56 origin-top-right overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
                                    <div className="border-b border-line bg-surface-muted px-4 py-3">
                                        <p className="truncate text-sm font-bold text-ink">{user?.name}</p>
                                        <p className="truncate text-xs text-ink-muted">{user?.email}</p>
                                    </div>
                                    <div className="p-1.5">
                                        <Link
                                            to="/dashboard/profile"
                                            onClick={() => setProfileOpen(false)}
                                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-muted hover:text-ink"
                                        >
                                            <Icon name="user" size={16} /> Profil Saya
                                        </Link>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggle();
                                            }}
                                            className="group flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
                                        >
                                            <span className="flex items-center gap-2.5">
                                                <Icon name="palette" size={16} /> Tema
                                            </span>
                                            <div className={`relative flex h-7 w-12 shrink-0 items-center rounded-full px-1 transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-700' : 'bg-zinc-200'}`}>
                                                <span className={`flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 ${theme === 'dark' ? 'translate-x-5 shadow-md' : 'translate-x-0'}`}>
                                                    {theme === 'dark' ? (
                                                        <Icon name="moon" size={12} className="text-brand-400" />
                                                    ) : (
                                                        <Icon name="sun" size={12} className="text-amber-500" />
                                                    )}
                                                </span>
                                            </div>
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10"
                                        >
                                            <Icon name="logout" size={16} /> Keluar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
                    <Outlet />
                </main>
            </div>

            <ScrollToTop />
        </div>
    );
}
