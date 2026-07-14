import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
import BrandLogin from './pages/BrandLogin';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import NotFound from './pages/NotFound';
import InstagramMockOAuth from './pages/InstagramMockOAuth';

// Dashboard Pages
const DashboardLayout = lazy(() => import('./pages/dashboard/DashboardLayout'));
const DashboardOverview = lazy(() => import('./pages/dashboard/Overview'));
const Profile = lazy(() => import('./pages/dashboard/Profile'));
const Referrals = lazy(() => import('./pages/dashboard/Referrals'));
const Points = lazy(() => import('./pages/dashboard/Points'));
const Collaborations = lazy(() => import('./pages/dashboard/Collabs'));
const CreatorMessages = lazy(() => import('./pages/dashboard/CreatorMessages'));
const ExploreCampaigns = lazy(() => import('./pages/dashboard/ExploreCampaigns'));
const CollabMilestones = lazy(() => import('./pages/dashboard/CollabMilestones'));

// Brand Dashboard Pages
const BrandDashboardLayout = lazy(() => import('./pages/dashboard/BrandDashboardLayout'));
const BrandDashboard = lazy(() => import('./pages/dashboard/BrandDashboard'));
const BrandMatchmaking = lazy(() => import('./pages/dashboard/BrandMatchmaking'));
const BrandAnalytics = lazy(() => import('./pages/dashboard/BrandAnalytics'));
const BrandMessages = lazy(() => import('./pages/dashboard/BrandMessages'));
const BrandCreators = lazy(() => import('./pages/dashboard/BrandCreators'));
const BrandMilestones = lazy(() => import('./pages/dashboard/BrandMilestones'));

// Admin Dashboard Pages
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboardLayout = lazy(() => import('./pages/dashboard/AdminDashboardLayout'));
const AdminOverview = lazy(() => import('./pages/dashboard/AdminOverview'));
const AdminCreators = lazy(() => import('./pages/dashboard/AdminCreators'));
const AdminInquiries = lazy(() => import('./pages/dashboard/AdminInquiries'));
const AdminRedemptions = lazy(() => import('./pages/dashboard/AdminRedemptions'));
const AdminPoints = lazy(() => import('./pages/dashboard/AdminPoints'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));


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
            <Route path="/oauth/instagram/mock" element={<InstagramMockOAuth />} />
            <Route path="/leaderboard" element={
              <Suspense fallback={<LoadingScreen />}>
                <Leaderboard />
              </Suspense>
            } />

            {/* Dashboard Routes */}
            <Route path="/dashboard" element={
              <Suspense fallback={<LoadingScreen />}>
                <DashboardLayout />
              </Suspense>
            }>
              <Route index element={<DashboardOverview />} />
              <Route path="profile" element={<Profile />} />
              <Route path="referrals" element={<Referrals />} />
              <Route path="points" element={<Points />} />
              <Route path="collabs" element={<Collaborations />} />
              <Route path="messages" element={<CreatorMessages />} />
              <Route path="explore" element={<ExploreCampaigns />} />
              <Route path="milestones" element={<CollabMilestones />} />
            </Route>

            {/* Brand Login Route */}
            <Route path="/brand-login" element={<BrandLogin />} />

            {/* Brand Dashboard Routes */}
            <Route path="/brand/dashboard" element={
              <Suspense fallback={<LoadingScreen />}>
                <BrandDashboardLayout />
              </Suspense>
            }>
              <Route index element={<BrandDashboard />} />
              <Route path="inquiries/:id/matches" element={<BrandMatchmaking />} />
              <Route path="creators" element={<BrandCreators />} />
              <Route path="analytics" element={<BrandAnalytics />} />
              <Route path="messages" element={<BrandMessages />} />
              <Route path="milestones" element={<BrandMilestones />} />
            </Route>

            {/* Admin Login Route */}
            <Route path="/admin-login" element={
              <Suspense fallback={<LoadingScreen />}>
                <AdminLogin />
              </Suspense>
            } />

            {/* Admin Dashboard Routes */}
            <Route path="/admin/dashboard" element={
              <Suspense fallback={<LoadingScreen />}>
                <AdminDashboardLayout />
              </Suspense>
            }>
              <Route index element={<AdminOverview />} />
              <Route path="creators" element={<AdminCreators />} />
              <Route path="inquiries" element={<AdminInquiries />} />
              <Route path="redemptions" element={<AdminRedemptions />} />
              <Route path="points" element={<AdminPoints />} />
            </Route>

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </Router>
    </AuthProvider>
  );
}

export default App;
