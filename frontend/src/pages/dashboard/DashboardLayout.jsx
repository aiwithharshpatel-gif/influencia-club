import { Link } from 'react-router-dom';
import { LayoutDashboard, User, Users, Award, MessageSquare, LogOut, Star, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { path: '/dashboard/profile', label: 'Profile', icon: User },
    { path: '/dashboard/explore', label: 'Explore', icon: Search },
    { path: '/dashboard/collabs', label: 'Collabs', icon: Star },
    { path: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
    { path: '/dashboard/referrals', label: 'Referrals', icon: Users },
    { path: '/dashboard/points', label: 'Points', icon: Award },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="bg-bg-card rounded-2xl p-6 border border-border sticky top-24">
                {/* User Info */}
                <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-border">
                  <div className="w-12 h-12 bg-purple-glow rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-lg font-semibold text-white truncate">
                      {user?.name || 'User'}
                    </div>
                    <div className="text-muted text-sm truncate">
                      {user?.email || 'user@email.com'}
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-glass text-white border border-primary'
                            : 'text-muted hover:bg-bg-card hover:text-white'
                        }`}
                      >
                        <Icon size={20} />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 mt-6 text-red-400 hover:text-red-300 transition-colors"
                >
                  <LogOut size={20} />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 pb-16 lg:pb-0">
              <Outlet />
            </div>
          </div>

          {/* Mobile Bottom Tab Bar */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-card/95 backdrop-blur-md border-t border-border">
            <div className="flex items-center justify-around py-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex flex-col items-center gap-1 px-2 py-1 transition-colors ${
                      isActive ? 'text-primary' : 'text-muted'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-[9px] font-medium truncate max-w-[55px]">{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex flex-col items-center gap-1 px-2 py-1 text-red-400"
              >
                <LogOut size={18} />
                <span className="text-[9px] font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DashboardLayout;
