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
    '/dashboard/landing': 'Halaman Depan',
    '/dashboard/blog': 'Blog',
    '/dashboard/blog/create': 'Tulis Artikel',
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

const Login = lazy(() => import('./pages/auth/Login'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const SetPassword = lazy(() => import('./pages/auth/SetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Portfolio = lazy(() => import('./pages/admin/Portfolio'));
const Media = lazy(() => import('./pages/admin/Media'));
const Services = lazy(() => import('./pages/admin/Services'));
const Clients = lazy(() => import('./pages/admin/Clients'));
const Bookings = lazy(() => import('./pages/admin/Bookings'));
const Projects = lazy(() => import('./pages/admin/projects/Projects'));
const ProjectDetail = lazy(() => import('./pages/admin/projects/ProjectDetail'));
const Payments = lazy(() => import('./pages/admin/Payments'));
const Messages = lazy(() => import('./pages/admin/Messages'));
const Notifications = lazy(() => import('./pages/admin/Notifications'));
const Landing = lazy(() => import('./pages/admin/Landing'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const Blog = lazy(() => import('./pages/admin/blog/Blog'));
const CreateEditBlog = lazy(() => import('./pages/admin/blog/CreateEditBlog'));
const BlogCategories = lazy(() => import('./pages/admin/blog/BlogCategories'));
const BlogTags = lazy(() => import('./pages/admin/blog/BlogTags'));
const Faq = lazy(() => import('./pages/admin/Faq'));
const Pages = lazy(() => import('./pages/admin/Pages'));
const Team = lazy(() => import('./pages/admin/Team'));
const Reviews = lazy(() => import('./pages/admin/Reviews'));
const AuditLog = lazy(() => import('./pages/admin/AuditLog'));
const RecycleBin = lazy(() => import('./pages/admin/RecycleBin'));
const ProfileSettings = lazy(() => import('./pages/admin/ProfileSettings'));
const ClientBookings = lazy(() => import('./pages/client/Bookings'));
const ClientInvoices = lazy(() => import('./pages/client/Invoices'));
const Preview = lazy(() => import('./pages/admin/Gallery'));
const PreviewDetail = lazy(() => import('./pages/admin/Detail'));
const ClientMessages = lazy(() => import('./pages/client/Messages'));
const Bookmarks = lazy(() => import('./pages/client/Bookmarks'));
const History = lazy(() => import('./pages/client/History'));
const Orders = lazy(() => import('./pages/client/orders/Orders'));
const OrderDetail = lazy(() => import('./pages/client/orders/OrderDetail'));

function PageFallback() {
    return (
        <div className="flex min-h-[50vh] items-center justify-center">
            <Spinner />
        </div>
    );
}

function withSuspense(node) {
    return <Suspense fallback={<PageFallback />}>{node}</Suspense>;
}



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
            <Route path="/login" element={withSuspense(<LoginRoute />)} />
            <Route path="/forgot" element={withSuspense(<ForgotPassword />)} />
            <Route path="/set-password" element={withSuspense(<SetPassword />)} />
            <Route path="/reset-password" element={withSuspense(<ResetPassword />)} />
            <Route
                path="/dashboard"
                element={
                    <Protected>
                        <Layout />
                    </Protected>
                }
            >
                <Route index element={withSuspense(<Dashboard />)} />
                <Route path="portfolios" element={withSuspense(<Protected adminOnly><Portfolio /></Protected>)} />
                <Route path="media" element={withSuspense(<Protected adminOnly><Media /></Protected>)} />
                <Route path="services" element={withSuspense(<Protected adminOnly><Services /></Protected>)} />
                <Route path="clients" element={withSuspense(<Protected adminOnly><Clients /></Protected>)} />
                <Route path="bookings" element={withSuspense(<Protected adminOnly><Bookings /></Protected>)} />
                <Route path="projects" element={withSuspense(<Protected adminOnly><Projects /></Protected>)} />
                <Route path="projects/:id" element={withSuspense(<Protected adminOnly><ProjectDetail /></Protected>)} />
                <Route path="pesanan" element={withSuspense(<Protected notStaffCase><Orders /></Protected>)} />
                <Route path="pesanan/:id" element={withSuspense(<Protected notStaffCase><OrderDetail /></Protected>)} />
                <Route path="client-bookings" element={withSuspense(<Protected notStaffCase><ClientBookings /></Protected>)} />
                <Route path="client-invoices" element={withSuspense(<Protected notStaffCase><ClientInvoices /></Protected>)} />
                <Route path="preview" element={withSuspense(<Preview />)} />
                <Route path="preview/:id" element={withSuspense(<PreviewDetail />)} />
                <Route path="client-messages" element={withSuspense(<Protected notStaffCase><ClientMessages /></Protected>)} />
                <Route path="bookmarks" element={withSuspense(<Protected notStaffCase><Bookmarks /></Protected>)} />
                <Route path="history" element={withSuspense(<Protected notStaffCase><History /></Protected>)} />
                <Route path="payments" element={withSuspense(<Protected adminOnly><Payments /></Protected>)} />
                <Route path="messages" element={withSuspense(<Protected adminOnly><Messages /></Protected>)} />
                <Route path="messages/:id" element={withSuspense(<Protected adminOnly><Messages /></Protected>)} />
                <Route path="notifications" element={withSuspense(<Notifications />)} />
                <Route path="reviews" element={withSuspense(<Protected adminOnly><Reviews /></Protected>)} />
                <Route path="profile" element={withSuspense(<ProfileSettings />)} />
                <Route path="landing" element={withSuspense(<Protected ownerOnly><Landing /></Protected>)} />
                <Route path="blog" element={withSuspense(<Protected adminOnly><Blog /></Protected>)} />
                <Route path="blog/create" element={withSuspense(<Protected adminOnly><CreateEditBlog /></Protected>)} />
                <Route path="blog/:id/edit" element={withSuspense(<Protected adminOnly><CreateEditBlog /></Protected>)} />
                <Route path="blog/categories" element={withSuspense(<Protected adminOnly><BlogCategories /></Protected>)} />
                <Route path="blog/tags" element={withSuspense(<Protected adminOnly><BlogTags /></Protected>)} />
                <Route path="faq" element={withSuspense(<Protected adminOnly><Faq /></Protected>)} />
                <Route path="pages" element={withSuspense(<Protected adminOnly><Pages /></Protected>)} />
                <Route path="team" element={withSuspense(<Protected ownerOnly><Team /></Protected>)} />
                <Route path="audit" element={withSuspense(<Protected adminOnly><AuditLog /></Protected>)} />
                <Route path="recycle-bin" element={withSuspense(<Protected adminOnly><RecycleBin /></Protected>)} />
                <Route path="settings" element={withSuspense(<Protected ownerOnly><Settings /></Protected>)} />
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
