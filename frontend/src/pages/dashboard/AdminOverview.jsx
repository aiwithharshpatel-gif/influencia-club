import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, Target, Award, Sparkles, Clock, ArrowRight } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast.error('Failed to load system overview statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-bg-card border border-[#27272a] rounded-xl w-64 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-bg-card border border-[#27272a] rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-bg-card border border-[#27272a] rounded-2xl animate-pulse" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Creators',
      value: stats?.totalCreators || 0,
      sub: `${stats?.pendingCreators || 0} pending approval`,
      icon: Users,
      color: 'text-primary',
      bgGlow: 'shadow-[0_0_20px_rgba(212,175,55,0.05)]'
    },
    {
      title: 'Brand Inquiries',
      value: stats?.totalInquiries || 0,
      sub: `${stats?.newInquiries || 0} new campaign requests`,
      icon: FileText,
      color: 'text-blue-400',
      bgGlow: 'shadow-[0_0_20px_rgba(96,165,250,0.05)]'
    },
    {
      title: 'Active Campaigns',
      value: stats?.activeCampaigns || 0,
      sub: 'Currently running campaigns',
      icon: Target,
      color: 'text-emerald-400',
      bgGlow: 'shadow-[0_0_20px_rgba(52,211,153,0.05)]'
    },
    {
      title: 'Total Points System',
      value: `${stats?.totalPoints?.toLocaleString() || 0} pts`,
      sub: 'Issued gamified points',
      icon: Award,
      color: 'text-purple-400',
      bgGlow: 'shadow-[0_0_20px_rgba(192,132,252,0.05)]'
    }
  ];

  return (
    <div className="space-y-8 pb-10 text-left">
      {/* Header title */}
      <div>
        <h1 className="font-display text-3xl font-bold text-text-primary flex items-center gap-2">
          System Overview <Sparkles size={24} className="text-gold" />
        </h1>
        <p className="text-muted text-sm mt-1">
          Real-time system health, statistics, and brand collaborations metrics.
        </p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`bg-bg-card rounded-2xl border border-border/80 p-5 transition-all hover:-translate-y-1 hover:border-gold/30 hover:shadow-gold-sm ${card.bgGlow}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-muted text-xs font-semibold uppercase tracking-wider">{card.title}</span>
                <Icon size={20} className={card.color} />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-text-primary mt-3 font-display">
                {card.value}
              </div>
              <div className="text-[10px] text-muted font-medium mt-1">
                {card.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-bg-card rounded-2xl border border-border/85 p-6 shadow-lg">
          <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              <span>Recent Brand Inquiries</span>
            </h3>
            <Link 
              to="/admin/dashboard/inquiries"
              className="text-primary text-xs font-bold hover:text-primary-soft transition-colors flex items-center gap-1"
            >
              <span>Manage Inquiries</span>
              <ArrowRight size={14} className="stroke-[2.5]" />
            </Link>
          </div>

          {/* Inquiries table list */}
          {!stats?.recentInquiries || stats.recentInquiries.length === 0 ? (
            <div className="py-8 text-center text-muted text-sm">
              No recent campaign inquiries found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#a1a1aa]">
                <thead>
                  <tr className="text-white text-xs font-semibold uppercase tracking-wider border-b border-border/50 pb-3">
                    <th className="pb-3">Brand Name</th>
                    <th className="pb-3">Email Address</th>
                    <th className="pb-3">Budget Range</th>
                    <th className="pb-3">Submitted At</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 text-xs">
                  {stats.recentInquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 font-semibold text-white">{inq.brandName}</td>
                      <td className="py-4">{inq.email}</td>
                      <td className="py-4">{inq.budgetRange}</td>
                      <td className="py-4">{new Date(inq.createdAt).toLocaleDateString()}</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          inq.status === 'new'
                            ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20'
                            : inq.status === 'in_progress'
                            ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                            : inq.status === 'completed'
                            ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                            : 'bg-red-400/10 text-red-400 border border-red-400/20'
                        }`}>
                          {inq.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
