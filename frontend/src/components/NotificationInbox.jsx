import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, CreditCard, Target, Award, Megaphone, Settings, ChevronDown, X } from 'lucide-react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const typeIcons = {
  payment: CreditCard,
  milestone: Target,
  payout: CreditCard,
  campaign: Megaphone,
  approval: Check,
  system: Settings
};

const typeColors = {
  payment: 'text-emerald-400',
  milestone: 'text-blue-400',
  payout: 'text-amber-400',
  campaign: 'text-purple-400',
  approval: 'text-green-400',
  system: 'text-zinc-400'
};

const NotificationInbox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnreadCount();
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/inbox/unread-count');
      if (res.data.success) {
        setUnreadCount(res.data.count);
      }
    } catch (err) {
      // Silently fail — notification count is non-critical
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications/inbox?limit=15');
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/inbox/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleClick = async (notification) => {
    // Mark as read
    if (!notification.isRead) {
      try {
        await api.patch(`/notifications/inbox/${notification.id}/read`);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        // Non-critical
      }
    }

    // Navigate if link present
    if (notification.link) {
      setIsOpen(false);
      navigate(notification.link);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-xl bg-bg border border-border flex items-center justify-center text-muted hover:text-white hover:border-primary/50 transition-all duration-200"
        id="notification-bell"
      >
        <Bell size={18} className={isOpen ? 'text-primary' : ''} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center animate-pulse">
            <span className="text-[10px] font-bold text-black">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-[380px] max-h-[500px] bg-bg-card border border-border rounded-xl shadow-2xl shadow-black/50 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-white font-bold text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-primary hover:text-primary-soft transition-colors flex items-center gap-1"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-12 h-12 bg-bg rounded-full flex items-center justify-center mb-3">
                  <Bell size={24} className="text-muted/30" />
                </div>
                <p className="text-muted text-sm">No notifications yet</p>
                <p className="text-muted/60 text-xs mt-1">
                  You'll see updates about milestones, payments, and more here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const IconComponent = typeIcons[notif.type] || Bell;
                const iconColor = typeColors[notif.type] || 'text-zinc-400';

                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-bg/80 transition-colors flex items-start gap-3 ${
                      !notif.isRead ? 'bg-primary/[0.03]' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      !notif.isRead ? 'bg-primary/10' : 'bg-bg'
                    }`}>
                      <IconComponent size={16} className={iconColor} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium truncate ${
                          !notif.isRead ? 'text-white' : 'text-muted'
                        }`}>
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted/70 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-muted/50 mt-1">
                        {formatTime(notif.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationInbox;
