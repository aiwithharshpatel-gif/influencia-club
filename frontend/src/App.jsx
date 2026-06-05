import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useState, useEffect, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';

// Components
import LoadingScreen from './components/LoadingScreen';
import PageTransition from './components/PageTransition';

// Public Pages
import Home from './pages/Home';
import About from './pages/About';
import Creators from './pages/Creators';
import Join from './pages/Join';
import Brands from './pages/Brands';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminLogin from './pages/admin/AdminLogin';

// Dashboard Pages
const DashboardLayout = lazy(() => import('./pages/dashboard/DashboardLayout'));
const DashboardOverview = lazy(() => import('./pages/dashboard/Overview'));
const Profile = lazy(() => import('./pages/dashboard/Profile'));
const Referrals = lazy(() => import('./pages/dashboard/Referrals'));
const Points = lazy(() => import('./pages/dashboard/Points'));
const Collaborations = lazy(() => import('./pages/dashboard/Collabs'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

const ProtectedRoute = ({ children }) => {
  const { loading, isAuthenticated, role } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated || role !== 'creator') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const ProtectedAdminRoute = ({ children }) => {
  const { loading, isAuthenticated, role } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated || role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Preload critical assets
    const preloadImages = () => {
      const images = ['/logo.png'];
      images.forEach(src => {
        const img = new Image();
        img.src = src;
      });
    };

    preloadImages();
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <AuthProvider>
      <Toaster 
        position="top-center" 
        toastOptions={{ 
          className: 'bg-bg-cardLight text-white border border-gold/20',
          style: { background: '#111', color: '#fff', border: '1px solid rgba(212, 175, 55, 0.2)' }
        }} 
      />
      <Router future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}>
        <PageTransition>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/creators" element={<Creators />} />
            <Route path="/join" element={<Join />} />
            <Route path="/brands" element={<Brands />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={
              <ProtectedAdminRoute>
                <Suspense fallback={<LoadingScreen />}>
                  <AdminDashboard />
                </Suspense>
              </ProtectedAdminRoute>
            } />

            {/* Dashboard Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingScreen />}>
                  <DashboardLayout />
                </Suspense>
              </ProtectedRoute>
            }>
              <Route index element={<DashboardOverview />} />
              <Route path="profile" element={<Profile />} />
              <Route path="referrals" element={<Referrals />} />
              <Route path="points" element={<Points />} />
              <Route path="collabs" element={<Collaborations />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PageTransition>
      </Router>
    </AuthProvider>
  );
}

export default App;
