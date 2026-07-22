import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, User, Users, Award, MessageSquare, LogOut, Star, Search, Target, Bell, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { subscribeUserToPush } from '../../services/pushNotification';
import NotificationInbox from '../../components/NotificationInbox';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
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

  const [showPushBanner, setShowPushBanner] = useState(false);

  useEffect(() => {
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    const dismissed = sessionStorage.getItem('push_banner_dismissed') === 'true';
    if (isSupported && Notification.permission === 'default' && !dismissed) {
      setShowPushBanner(true);
    }
  }, []);

  const handleEnablePush = async () => {
    try {
      await subscribeUserToPush();
      setShowPushBanner(false);
    } catch (err) {
      console.error('Failed to subscribe to push:', err);
    }
  };

  const handleDismissPush = () => {
    sessionStorage.setItem('push_banner_dismissed', 'true');
    setShowPushBanner(false);
  };

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { path: '/dashboard/profile', label: 'Profile', icon: User },
    { path: '/dashboard/explore', label: 'Explore', icon: Search },
    { path: '/dashboard/collabs', label: 'Collabs', icon: Star },
    { path: '/dashboard/milestones', label: 'Milestones', icon: Target },
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
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleTheme}
                      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                      className="p-2 rounded-xl border border-gold/30 text-gold hover:bg-gold/10 transition-all focus:outline-none"
                    >
                      {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <NotificationInbox />
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
            <div className="lg:col-span-3 pb-16 lg:pb-0">
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
              {showPushBanner && (
                <div className="bg-gradient-to-r from-gold/15 via-gold/5 to-transparent border border-gold/20 p-4 mb-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 text-left">
                    <div className="p-2 bg-gold/10 text-gold rounded-xl">
                      <Bell size={20} className="animate-pulse text-primary" />
                    </div>
                    <div>
                      <h4 className="text-white text-sm font-semibold">Enable Real-Time Notifications</h4>
                      <p className="text-muted text-xs">Stay updated on new messages, invitations, and milestone approvals.</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleDismissPush}
                      className="px-3 py-1.5 text-muted hover:text-white text-xs font-semibold transition-colors"
                    >
                      Later
                    </button>
                    <button
                      onClick={handleEnablePush}
                      className="bg-primary hover:bg-primary-soft text-black px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)]"
                    >
                      Enable Now
                    </button>
                  </div>
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
