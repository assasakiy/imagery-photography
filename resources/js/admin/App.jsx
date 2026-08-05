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
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Media from './pages/Media';
import Services from './pages/Services';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Payments from './pages/Payments';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Landing from './pages/Landing';
import Settings from './pages/Settings';
import Blog from './pages/Blog';
import BlogCategories from './pages/BlogCategories';
import BlogTags from './pages/BlogTags';
import Faq from './pages/Faq';
import Pages from './pages/Pages';
import Team from './pages/Team';
import Reviews from './pages/Reviews';
import AuditLog from './pages/AuditLog';
import ProfileSettings from './pages/ProfileSettings';

const STAFF_ROLES = ['admin', 'owner'];

function Protected({ children, adminOnly = false, ownerOnly = false }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <Spinner />;
    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
    if (ownerOnly && user.role !== 'owner') return <Navigate to="/dashboard" replace />;
    if (adminOnly && !STAFF_ROLES.includes(user.role)) return <Navigate to="/dashboard" replace />;
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
                <Route path="projects" element={<Projects />} />
                <Route path="projects/:id" element={<ProjectDetail />} />
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
