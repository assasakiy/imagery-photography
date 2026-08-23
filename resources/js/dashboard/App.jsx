import { lazy, Suspense, useEffect } from 'react';
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
    '/dashboard/blog': 'Blog',
    '/dashboard/blog/create': 'Tulis Artikel',
    '/dashboard/kategori': 'Kategori',
    '/dashboard/blog/tags': 'Tag Blog',
    '/dashboard/faq': 'FAQ',
    '/dashboard/stats': 'Stats',
    '/dashboard/pages': 'Halaman',
    '/dashboard/pages/:slug/edit': 'Edit Halaman',
    '/dashboard/settings': 'Pengaturan',
    '/dashboard/team': 'Admin',
    '/dashboard/reviews': 'Review',
    '/dashboard/comments': 'Komentar',
    '/dashboard/subscribers': 'Subscriber',
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
import { BadgeProvider } from './context/BadgeContext';
import Layout from './components/Layout';
import ToastViewport from './components/ToastViewport';
import PageFallback from './components/PageFallback';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import { Spinner, FullPageSkeleton } from './components/ui';
import { pageImports } from './routes/routeImports';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import SetPassword from './pages/auth/SetPassword';

const Dashboard = lazy(pageImports['/dashboard']);
const Portfolio = lazy(pageImports['/dashboard/portfolios']);
const Media = lazy(pageImports['/dashboard/media']);
const Services = lazy(pageImports['/dashboard/services']);
const Clients = lazy(pageImports['/dashboard/clients']);
const Bookings = lazy(pageImports['/dashboard/bookings']);
const Projects = lazy(pageImports['/dashboard/projects']);
const ProjectDetail = lazy(pageImports['/dashboard/projects/:id']);
const Payments = lazy(pageImports['/dashboard/payments']);
const Messages = lazy(pageImports['/dashboard/messages']);
const Notifications = lazy(pageImports['/dashboard/notifications']);
const Settings = lazy(pageImports['/dashboard/settings']);
const Blog = lazy(pageImports['/dashboard/blog']);
const CreateEditBlog = lazy(pageImports['/dashboard/blog/create']);
const Categories = lazy(pageImports['/dashboard/kategori']);
const BlogTags = lazy(pageImports['/dashboard/blog/tags']);
const Faq = lazy(pageImports['/dashboard/faq']);
const Stats = lazy(pageImports['/dashboard/stats']);
const PageIndex = lazy(pageImports['/dashboard/pages']);
const PageEditor = lazy(pageImports['/dashboard/pages/:slug/edit']);
const Team = lazy(pageImports['/dashboard/team']);
const Reviews = lazy(pageImports['/dashboard/reviews']);
const Comments = lazy(pageImports['/dashboard/comments']);
const Subscribers = lazy(pageImports['/dashboard/subscribers']);
const AuditLog = lazy(pageImports['/dashboard/audit']);
const Analytics = lazy(pageImports['/dashboard/analytics']);
const RecycleBin = lazy(pageImports['/dashboard/recycle-bin']);
const ProfileSettings = lazy(pageImports['/dashboard/profile']);
const ClientBookings = lazy(pageImports['/dashboard/client-bookings']);
const ClientInvoices = lazy(pageImports['/dashboard/client-invoices']);
const PayInvoice = lazy(pageImports['/dashboard/client-invoices/pay']);
const Preview = lazy(pageImports['/dashboard/preview']);
const PreviewDetail = lazy(pageImports['/dashboard/preview/:id']);
const ClientMessages = lazy(pageImports['/dashboard/client-messages']);
const Bookmarks = lazy(pageImports['/dashboard/bookmarks']);
const History = lazy(pageImports['/dashboard/history']);
const Orders = lazy(pageImports['/dashboard/pesanan']);
const OrderDetail = lazy(pageImports['/dashboard/pesanan/:id']);

function withSuspense(node, variant = 'card') {
    return (
        <RouteErrorBoundary>
            <Suspense fallback={<PageFallback variant={variant} />}>{node}</Suspense>
        </RouteErrorBoundary>
    );
}

const STAFF_ROLES = ['admin', 'owner'];

function Protected({ children, adminOnly = false, ownerOnly = false, notStaffCase = false }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <FullPageSkeleton />;
    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
    if (ownerOnly && user.role !== 'owner') return <Navigate to="/dashboard" replace />;
    if (adminOnly && !STAFF_ROLES.includes(user.role)) return <Navigate to="/dashboard" replace />;
    if (notStaffCase && STAFF_ROLES.includes(user.role)) return <Navigate to="/dashboard" replace />;
    return children;
}

function LoginRoute() {
    const { user, loading } = useAuth();

    if (!loading && user) return <Navigate to="/dashboard" replace />;
    return <Login />;
}

function RegisterRoute() {
    const { user, loading } = useAuth();

    if (!loading && user) return <Navigate to="/dashboard" replace />;
    return <Register />;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/register" element={<RegisterRoute />} />
            <Route path="/forgot" element={<ForgotPassword />} />
            <Route path="/set-password" element={<SetPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
                path="/dashboard"
                element={
                    <Protected>
                        <BadgeProvider>
                            <Layout />
                        </BadgeProvider>
                    </Protected>
                }
            >
                <Route index element={withSuspense(<Dashboard />, 'card')} />
                <Route path="portfolios" element={withSuspense(<Protected adminOnly><Portfolio /></Protected>, 'table')} />
                <Route path="media" element={withSuspense(<Protected adminOnly><Media /></Protected>, 'table')} />
                <Route path="services" element={withSuspense(<Protected adminOnly><Services /></Protected>, 'table')} />
                <Route path="clients" element={withSuspense(<Protected adminOnly><Clients /></Protected>, 'table')} />
                <Route path="bookings" element={withSuspense(<Protected adminOnly><Bookings /></Protected>, 'table')} />
                <Route path="projects" element={withSuspense(<Protected adminOnly><Projects /></Protected>, 'card')} />
                <Route path="projects/:id" element={withSuspense(<Protected adminOnly><ProjectDetail /></Protected>, 'form')} />
                <Route path="pesanan" element={withSuspense(<Protected notStaffCase><Orders /></Protected>, 'card')} />
                <Route path="pesanan/:id" element={withSuspense(<Protected notStaffCase><OrderDetail /></Protected>, 'form')} />
                <Route path="client-bookings" element={withSuspense(<Protected notStaffCase><ClientBookings /></Protected>, 'table')} />
                <Route path="client-invoices" element={withSuspense(<Protected notStaffCase><ClientInvoices /></Protected>, 'table')} />
                <Route path="client-invoices/:id/bayar" element={withSuspense(<Protected notStaffCase><PayInvoice /></Protected>, 'form')} />
                <Route path="preview" element={withSuspense(<Preview />, 'card')} />
                <Route path="preview/:id" element={withSuspense(<PreviewDetail />, 'form')} />
                <Route path="client-messages" element={withSuspense(<Protected notStaffCase><ClientMessages /></Protected>, 'table')} />
                <Route path="bookmarks" element={withSuspense(<Protected notStaffCase><Bookmarks /></Protected>, 'card')} />
                <Route path="history" element={withSuspense(<Protected notStaffCase><History /></Protected>, 'table')} />
                <Route path="payments" element={withSuspense(<Protected adminOnly><Payments /></Protected>, 'table')} />
                <Route path="messages" element={withSuspense(<Protected adminOnly><Messages /></Protected>, 'card')} />
                <Route path="messages/:id" element={withSuspense(<Protected adminOnly><Messages /></Protected>, 'card')} />
                <Route path="notifications" element={withSuspense(<Notifications />, 'table')} />
                <Route path="reviews" element={withSuspense(<Protected adminOnly><Reviews /></Protected>, 'table')} />
                <Route path="comments" element={withSuspense(<Protected adminOnly><Comments /></Protected>, 'table')} />
                <Route path="subscribers" element={withSuspense(<Protected adminOnly><Subscribers /></Protected>, 'table')} />
                <Route path="profile" element={withSuspense(<ProfileSettings />, 'form')} />
                <Route path="blog" element={withSuspense(<Protected adminOnly><Blog /></Protected>, 'table')} />
                <Route path="blog/create" element={withSuspense(<Protected adminOnly><CreateEditBlog /></Protected>, 'form')} />
                <Route path="blog/:id/edit" element={withSuspense(<Protected adminOnly><CreateEditBlog /></Protected>, 'form')} />
                <Route path="kategori" element={withSuspense(<Protected adminOnly><Categories /></Protected>, 'table')} />
                <Route path="blog/tags" element={withSuspense(<Protected adminOnly><BlogTags /></Protected>, 'table')} />
                <Route path="faq" element={withSuspense(<Protected adminOnly><Faq /></Protected>, 'table')} />
                <Route path="stats" element={withSuspense(<Protected adminOnly><Stats /></Protected>, 'table')} />
                <Route path="pages" element={withSuspense(<Protected adminOnly><PageIndex /></Protected>, 'table')} />
                <Route path="pages/:slug/edit" element={withSuspense(<Protected adminOnly><PageEditor /></Protected>, 'form')} />
                <Route path="team" element={withSuspense(<Protected ownerOnly><Team /></Protected>, 'table')} />
                <Route path="audit" element={withSuspense(<Protected adminOnly><AuditLog /></Protected>, 'table')} />
                <Route path="analytics" element={withSuspense(<Protected adminOnly><Analytics /></Protected>, 'card')} />
                <Route path="recycle-bin" element={withSuspense(<Protected adminOnly><RecycleBin /></Protected>, 'table')} />
                <Route path="settings" element={withSuspense(<Protected ownerOnly><Settings /></Protected>, 'form')} />
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
                <ToastViewport />
            </AuthProvider>
        </ThemeProvider>
    );
}