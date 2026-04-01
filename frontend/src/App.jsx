import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useState, useEffect } from 'react';

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

// Dashboard Pages
import DashboardLayout from './pages/dashboard/DashboardLayout';
import DashboardOverview from './pages/dashboard/Overview';
import Profile from './pages/dashboard/Profile';
import Referrals from './pages/dashboard/Referrals';
import Points from './pages/dashboard/Points';
import Collaborations from './pages/dashboard/Collabs';

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
      <Router>
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

            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="profile" element={<Profile />} />
              <Route path="referrals" element={<Referrals />} />
              <Route path="points" element={<Points />} />
              <Route path="collabs" element={<Collaborations />} />
            </Route>
          </Routes>
        </PageTransition>
      </Router>
    </AuthProvider>
  );
}

export default App;
