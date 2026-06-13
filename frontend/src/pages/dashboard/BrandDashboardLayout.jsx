import { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, FilePlus, LogOut, ArrowLeft, BarChart3, MessageSquare, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const BrandDashboardLayout = () => {
  const { user, role, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  useEffect(() => {
    if (!loading && (!user || role !== 'brand')) {
      navigate('/brand-login');
    }
  }, [user, role, loading, navigate]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const navItems = [
    { path: '/brand/dashboard', label: 'Campaign Hub', icon: LayoutDashboard },
    { path: '/brand/dashboard/creators', label: 'Marketplace', icon: Search },
    { path: '/brand/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/brand/dashboard/messages', label: 'Messages', icon: MessageSquare },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (loading || (!user || role !== 'brand')) {
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
            {/* Sidebar */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="bg-bg-card rounded-2xl p-6 border border-border sticky top-24">
                {/* Brand Info */}
                <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-border">
                  <div className="w-12 h-12 bg-purple-glow rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {user?.brandName?.charAt(0).toUpperCase() || 'B'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-lg font-semibold text-white truncate">
                      {user?.brandName || 'Brand Partner'}
                    </div>
                    <div className="text-muted text-sm truncate">
                      {user?.email || 'brand@email.com'}
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.path === '/brand/dashboard'
                      ? location.pathname === '/brand/dashboard'
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
                        <Icon size={20} />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                  <Link
                    to="/brands#inquiry-form"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-muted hover:bg-bg-card hover:text-white transition-colors"
                  >
                    <FilePlus size={20} />
                    <span className="font-medium">New Campaign</span>
                  </Link>
                </nav>

                {/* PWA Install Button */}
                {showInstallBtn && (
                  <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl text-center space-y-2">
                    <p className="text-white text-xs font-semibold">Install Influenzia App for faster access!</p>
                    <button
                      onClick={handleInstallClick}
                      className="w-full bg-primary hover:bg-primary-soft text-black py-2 rounded-lg text-xs font-bold transition-colors"
                    >
                      Install App
                    </button>
                  </div>
                )}

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
            <div className="lg:col-span-3">
              {showInstallBtn && (
                <div className="lg:hidden mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between gap-4">
                  <div className="text-left">
                    <p className="text-white text-xs font-semibold">Install Influenzia App</p>
                    <p className="text-muted text-[10px]">Access your dashboard faster on mobile</p>
                  </div>
                  <button
                    onClick={handleInstallClick}
                    className="bg-primary hover:bg-primary-soft text-black px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
                  >
                    Install
                  </button>
                </div>
              )}
              <Outlet />
            </div>
          </div>

          {/* Mobile Bottom Tab Bar */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-card/95 backdrop-blur-md border-t border-border">
            <div className="flex items-center justify-around py-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.path === '/brand/dashboard'
                  ? location.pathname === '/brand/dashboard'
                  : location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                      isActive ? 'text-primary' : 'text-muted'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex flex-col items-center gap-1 px-3 py-1.5 text-red-400"
              >
                <LogOut size={20} />
                <span className="text-[10px] font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BrandDashboardLayout;
