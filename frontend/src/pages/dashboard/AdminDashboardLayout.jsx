import { useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Gift, PlusCircle, LogOut, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const AdminDashboardLayout = () => {
  const { user, role, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Auth role protection check
    if (!loading && (!user || role !== 'admin')) {
      navigate('/admin-login');
    }
  }, [user, role, loading, navigate]);

  const navItems = [
    { path: '/admin/dashboard', label: 'Stats Overview', icon: LayoutDashboard },
    { path: '/admin/dashboard/creators', label: 'Creators Directory', icon: Users },
    { path: '/admin/dashboard/inquiries', label: 'Brand Inquiries', icon: FileText },
    { path: '/admin/dashboard/redemptions', label: 'Redemptions', icon: Gift },
    { path: '/admin/dashboard/points', label: 'Points Allocation', icon: PlusCircle },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading || (!user || role !== 'admin')) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8">
            
            {/* Sidebar component - Desktop */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="bg-bg-card rounded-2xl p-6 border border-border sticky top-24">
                {/* Admin Status Profile Box */}
                <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-border">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#D4AF37] to-yellow-600 p-[1.5px] shadow-[0_0_15px_rgba(212,175,55,0.15)]">
                    <div className="w-full h-full bg-[#0c0c0c] rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {user?.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-display text-base font-semibold text-white truncate flex items-center gap-1">
                      {user?.name || 'Admin Manager'}
                      <ShieldCheck size={14} className="text-primary fill-primary/10" />
                    </div>
                    <div className="text-gold/90 text-xs font-bold uppercase tracking-wider mt-0.5 flex items-center gap-0.5">
                      <Sparkles size={10} className="animate-pulse" />
                      <span>{user?.role?.replace('_', ' ') || 'Manager'}</span>
                    </div>
                  </div>
                </div>

                {/* Left navigation menu */}
                <nav className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.path === '/admin/dashboard'
                      ? location.pathname === '/admin/dashboard'
                      : location.pathname.startsWith(item.path);
                    
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
                        <Icon size={18} />
                        <span className="font-medium text-sm">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>

                {/* Logout action */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 mt-6 text-red-400 hover:text-red-300 transition-colors"
                >
                  <LogOut size={18} />
                  <span className="font-medium text-sm">Logout</span>
                </button>
              </div>
            </div>

            {/* Admin Nested Route Outlet Grid Column */}
            <div className="lg:col-span-3">
              <Outlet />
            </div>

          </div>

          {/* Bottom Tab Bar - Mobile Screen sizes */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-card/95 backdrop-blur-md border-t border-border">
            <div className="flex items-center justify-around py-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.path === '/admin/dashboard'
                  ? location.pathname === '/admin/dashboard'
                  : location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                      isActive ? 'text-primary' : 'text-muted'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-[9px] font-medium">{item.label.split(' ')[0]}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex flex-col items-center gap-1 px-3 py-1.5 text-red-400"
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

export default AdminDashboardLayout;
