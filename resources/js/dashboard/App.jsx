import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

const SITE = 'Sopian Lalu Imagery';

const PAGE_TITLES = {
    '/login': 'Login',
    '/dashboard': 'Dashboard',
    '/dashboard/portfolios': 'Portofolio',
    '/dashboard/media': 'Media',
    '/dashboard/services': 'Layanan',
    '/dashboard/clients': 'Klien',
    '/dashboard/projects': 'Proyek',
    '/dashboard/payments': 'Pembayaran',
    '/dashboard/messages': 'Pesan',
    '/dashboard/notifications': 'Notifikasi',
    '/dashboard/client-bookings': 'Booking Saya',
    '/dashboard/client-invoices': 'Tagihan',
    '/dashboard/client-gallery': 'Galeri Saya',
    '/dashboard/client-messages': 'Pesan',
    '/dashboard/bookmarks': 'Bookmark',
    '/dashboard/history': 'Riwayat',
    '/dashboard/landing': 'Halaman Depan',
    '/dashboard/blog': 'Blog',
    '/dashboard/blog/categories': 'Kategori Blog',
    '/dashboard/blog/tags': 'Tag Blog',
    '/dashboard/faq': 'FAQ',
    '/dashboard/pages': 'Halaman',
    '/dashboard/settings': 'Pengaturan',
    '/dashboard/team': 'Tim & Admin',
    '/dashboard/reviews': 'Review',
    '/dashboard/audit': 'Audit & Log',
    '/dashboard/recycle-bin': 'Recycle Bin',
    '/dashboard/profile': 'Pengaturan Profil',
};

function TitleSync() {
    const location = useLocation();

    useEffect(() => {
        const exact = PAGE_TITLES[location.pathname];

        if (exact) {
            document.title = `${exact} - ${SITE}`;
            return;
        }

        const match = location.pathname.match(/^\/dashboard\/projects\/\d+$/);
        document.title = match ? `Detail Proyek - ${SITE}` : `${SITE}`;
    }, [location.pathname]);

    return null;
}
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import { Spinner } from './components/ui';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import SetPassword from './pages/auth/SetPassword';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/admin/Portfolio';
import Media from './pages/admin/Media';
import Services from './pages/admin/Services';
import Clients from './pages/admin/Clients';
import Bookings from './pages/admin/Bookings';
import Projects from './pages/admin/projects/Projects';
import ProjectDetail from './pages/admin/projects/ProjectDetail';
import Payments from './pages/admin/Payments';
import Messages from './pages/admin/Messages';
import Notifications from './pages/admin/Notifications';
import Landing from './pages/admin/Landing';
import Settings from './pages/admin/Settings';
import Blog from './pages/admin/blog/Blog';
import BlogCategories from './pages/admin/blog/BlogCategories';
import BlogTags from './pages/admin/blog/BlogTags';
import Faq from './pages/admin/Faq';
import Pages from './pages/admin/Pages';
import Team from './pages/admin/Team';
import Reviews from './pages/client/Reviews';
import AuditLog from './pages/admin/AuditLog';
import RecycleBin from './pages/admin/RecycleBin';
import ProfileSettings from './pages/admin/ProfileSettings';
import ClientBookings from './pages/client/Bookings';
import ClientInvoices from './pages/client/Invoices';
import Preview from './pages/admin/Gallery';
import PreviewDetail from './pages/admin/Detail';
import ClientMessages from './pages/client/Messages';
import Bookmarks from './pages/client/Bookmarks';
import History from './pages/client/History';
import Orders from './pages/client/orders/Orders';
import OrderDetail from './pages/client/orders/OrderDetail';



const STAFF_ROLES = ['admin', 'owner'];

function Protected({ children, adminOnly = false, ownerOnly = false, notStaffCase = false }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <Spinner />;
    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
    if (ownerOnly && user.role !== 'owner') return <Navigate to="/dashboard" replace />;
    if (adminOnly && !STAFF_ROLES.includes(user.role)) return <Navigate to="/dashboard" replace />;
    if (notStaffCase && STAFF_ROLES.includes(user.role)) return <Navigate to="/dashboard" replace />;
    return children;
}

function LoginRoute() {
    const { user, loading } = useAuth();

    if (loading) return <Spinner />;
    if (user) return <Navigate to="/dashboard" replace />;
    return <Login />;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/set-password" element={<SetPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
                path="/dashboard"
                element={
                    <Protected>
                        <Layout />
                    </Protected>
                }
            >
                <Route index element={<Dashboard />} />
                <Route path="portfolios" element={<Protected adminOnly><Portfolio /></Protected>} />
                <Route path="media" element={<Protected adminOnly><Media /></Protected>} />
                <Route path="services" element={<Protected adminOnly><Services /></Protected>} />
                <Route path="clients" element={<Protected adminOnly><Clients /></Protected>} />
                <Route path="bookings" element={<Protected adminOnly><Bookings /></Protected>} />
                <Route path="projects" element={<Protected adminOnly><Projects /></Protected>} />
                <Route path="projects/:id" element={<Protected adminOnly><ProjectDetail /></Protected>} />
                <Route path="pesanan" element={<Protected notStaffCase><Orders /></Protected>} />
                <Route path="pesanan/:id" element={<Protected notStaffCase><OrderDetail /></Protected>} />
                <Route path="client-bookings" element={<Protected notStaffCase><ClientBookings /></Protected>} />
                <Route path="client-invoices" element={<Protected notStaffCase><ClientInvoices /></Protected>} />
                <Route path="preview" element={<Preview />} />
                <Route path="preview/:id" element={<PreviewDetail />} />
                <Route path="client-messages" element={<Protected notStaffCase><ClientMessages /></Protected>} />
                <Route path="bookmarks" element={<Protected notStaffCase><Bookmarks /></Protected>} />
                <Route path="history" element={<Protected notStaffCase><History /></Protected>} />
                <Route path="payments" element={<Protected adminOnly><Payments /></Protected>} />
                <Route path="messages" element={<Protected adminOnly><Messages /></Protected>} />
                <Route path="messages/:id" element={<Protected adminOnly><Messages /></Protected>} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="reviews" element={<Reviews />} />
                <Route path="profile" element={<ProfileSettings />} />
                <Route path="landing" element={<Protected ownerOnly><Landing /></Protected>} />
                <Route path="blog" element={<Protected adminOnly><Blog /></Protected>} />
                <Route path="blog/categories" element={<Protected adminOnly><BlogCategories /></Protected>} />
                <Route path="blog/tags" element={<Protected adminOnly><BlogTags /></Protected>} />
                <Route path="faq" element={<Protected adminOnly><Faq /></Protected>} />
                <Route path="pages" element={<Protected adminOnly><Pages /></Protected>} />
                <Route path="team" element={<Protected ownerOnly><Team /></Protected>} />
                <Route path="audit" element={<Protected adminOnly><AuditLog /></Protected>} />
                <Route path="recycle-bin" element={<Protected adminOnly><RecycleBin /></Protected>} />
                <Route path="settings" element={<Protected ownerOnly><Settings /></Protected>} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <TitleSync />
                    <AppRoutes />
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}
