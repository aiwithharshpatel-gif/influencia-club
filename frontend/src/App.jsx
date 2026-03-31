import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Public Pages
import Home from './pages/Home';
import About from './pages/About';
import Creators from './pages/Creators';
import Join from './pages/Join';
import Brands from './pages/Brands';
import Contact from './pages/Contact';
import Login from './pages/Login';

// Dashboard Pages
import DashboardLayout from './pages/dashboard/DashboardLayout';
import DashboardOverview from './pages/dashboard/Overview';
import Profile from './pages/dashboard/Profile';
import Referrals from './pages/dashboard/Referrals';
import Points from './pages/dashboard/Points';
import Collaborations from './pages/dashboard/Collabs';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/join" element={<Join />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />

          {/* Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="profile" element={<Profile />} />
            <Route path="referrals" element={<Referrals />} />
            <Route path="points" element={<Points />} />
            <Route path="collabs" element={<Collaborations />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
