import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import Icon from './Icon';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api';

const adminNav = [
    { to: '/dashboard', icon: 'dashboard', label: 'Dashboard', end: true },
    { to: '/dashboard/bookings', icon: 'calendar', label: 'Booking' },
    { to: '/dashboard/portfolios', icon: 'images', label: 'Portofolio' },
    { to: '/dashboard/media', icon: 'image', label: 'Media' },
    { to: '/dashboard/services', icon: 'briefcase', label: 'Layanan' },
    { to: '/dashboard/clients', icon: 'users', label: 'Klien' },
    { to: '/dashboard/projects', icon: 'folder-open', label: 'Proyek' },
    { to: '/dashboard/preview', icon: 'image', label: 'Preview' },
    { to: '/dashboard/invoices', icon: 'file-text', label: 'Tagihan' },
    { to: '/dashboard/payments', icon: 'credit-card', label: 'Pembayaran' },
    { to: '/dashboard/messages', icon: 'message-circle', label: 'Pesan' },
    { to: '/dashboard/reviews', icon: 'star', label: 'Review' },
    { to: '/dashboard/blog', icon: 'edit', label: 'Blog' },
    { to: '/dashboard/faq', icon: 'message-circle', label: 'FAQ' },
    { to: '/dashboard/pages', icon: 'file', label: 'Halaman' },
    { to: '/dashboard/audit', icon: 'clock', label: 'Audit & Log' },
    { to: '/dashboard/recycle-bin', icon: 'trash', label: 'Recycle Bin' },
];

const ownerNav = [
    ...adminNav,
    { to: '/dashboard/team', icon: 'users', label: 'Tim & Admin' },
    { to: '/dashboard/landing', icon: 'palette', label: 'Landing' },
    { to: '/dashboard/settings', icon: 'settings', label: 'Pengaturan' },
];

const clientNav = [
    { to: '/dashboard', icon: 'dashboard', label: 'Dashboard', end: true },
    { to: '/dashboard/projects', icon: 'folder-open', label: 'Pesanan' },
    { to: '/dashboard/client-bookings', icon: 'calendar', label: 'Booking' },
    { to: '/dashboard/client-invoices', icon: 'credit-card', label: 'Tagihan' },
    { to: '/dashboard/preview', icon: 'image', label: 'Preview' },
    { to: '/dashboard/client-messages', icon: 'message-circle', label: 'Pesan' },
    { to: '/dashboard/bookmarks', icon: 'heart', label: 'Bookmark' },
    { to: '/dashboard/history', icon: 'clock', label: 'Riwayat' },
];

const subscribeNav = [
    { to: '/dashboard', icon: 'dashboard', label: 'Dashboard', end: true },
    { to: '/dashboard/bookmarks', icon: 'heart', label: 'Bookmark' },
    { to: '/dashboard/history', icon: 'clock', label: 'Riwayat' },
];

const ROLE_LABEL = { owner: 'Pemilik', admin: 'Dashboard Admin', client: 'Portal Klien', subscriber: 'Portal Subscriber' };

export default function Layout() {
    const { user, logout } = useAuth();
    const { theme, toggle } = useTheme();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const profileRef = useRef(null);

    const role = user?.role;
    const isStaff = ['admin', 'owner'].includes(role);
    const isClient = role === 'client';
    const nav = role === 'owner' ? ownerNav : isStaff ? adminNav : isClient ? clientNav : subscribeNav;

    const appConfig = window.APP_CONFIG || {};
    const siteLogo = appConfig.logo || '';
    const siteName = appConfig.siteName || 'Sopian Lalu Imagery';
    const siteFavicon = appConfig.favicon || '';

    const [unreadMessages, setUnreadMessages] = useState(0);
    const [unreadBookings, setUnreadBookings] = useState(0);

    useEffect(() => {
        document.title = `${siteName} — Dashboard`;
        if (siteFavicon) {
            const link = document.querySelector('link[rel="icon"]');
            if (link) link.href = siteFavicon;
        }
    }, [siteName, siteFavicon]);

    useEffect(() => {
        if (!user) return;
        const load = () => {
            api.get('/notifications/unread-count').then(({ data }) => setUnread(data.count)).catch(() => {});
            if (['admin', 'owner'].includes(user.role)) {
                api.get('/messages-unread/count').then(({ data }) => setUnreadMessages(data.count)).catch(() => {});
                api.get('/bookings', { params: { per_page: 1, status: 'pending' } }).then(({ data }) => setUnreadBookings(data.total)).catch(() => {});
            }
        };
        load();
        const timer = setInterval(load, 45000);
        return () => clearInterval(timer);
    }, [user]);

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
                    {nav.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                                        : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                                }`
                            }
                        >
                            <Icon name={item.icon} size={18} />
                            <span>{item.label}</span>
                            {item.to === '/dashboard/messages' && unreadMessages > 0 && (
                                <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                                    {unreadMessages}
                                </span>
                            )}
                            {item.to === '/dashboard/bookings' && unreadBookings > 0 && (
                                <span className="ml-auto rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                                    {unreadBookings}
                                </span>
                            )}
                        </NavLink>
                    ))}
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
                        <button
                            onClick={toggle}
                            className="rounded-lg p-2 text-ink-muted hover:bg-surface-muted hover:text-ink"
                            aria-label="Ganti tema"
                        >
                            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
                        </button>

                        {/* Profile dropdown */}
                        <div className="relative" ref={profileRef}>
                            <button
                                onClick={() => setProfileOpen((v) => !v)}
                                className="flex items-center gap-2 rounded-xl p-1.5 pr-2 text-ink transition-colors hover:bg-surface-muted"
                                aria-label="Menu profil"
                            >
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-brand-500/30" />
                                ) : (
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/20 text-sm font-bold text-brand-600 dark:text-brand-400">
                                        {initial}
                                    </span>
                                )}
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
        </div>
    );
}
