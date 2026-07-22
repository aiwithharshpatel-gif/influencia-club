import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Calendar, ArrowRight, FolderKanban, UserPlus, HeartHandshake } from 'lucide-react';
import api from '../../utils/api';
import SkeletonCard from '../../components/SkeletonCard';

const BrandDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const response = await api.get('/brand/inquiries');
      if (response.data.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Error fetching brand inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      new: 'bg-blue-500/20 text-blue-400',
      in_progress: 'bg-yellow-500/20 text-yellow-400',
      completed: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${styles[status] || 'bg-muted/20 text-muted'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div>
        <div className="h-8 w-48 bg-bg-card rounded-lg skeleton-shimmer mb-8" />
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          <SkeletonCard variant="stat" count={3} />
        </div>
        <div className="bg-bg-card rounded-xl p-6 border border-border">
          <div className="h-6 w-48 bg-border/40 rounded mb-6" />
          <div className="space-y-4">
            <SkeletonCard variant="row" count={3} />
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      icon: FolderKanban,
      label: 'Campaign Requests',
      value: data?.stats?.totalInquiries || 0,
      color: 'text-primary'
    },
    {
      icon: UserPlus,
      label: 'Invites Sent',
      value: data?.stats?.totalInvites || 0,
      color: 'text-gold'
    },
    {
      icon: HeartHandshake,
      label: 'Confirmed Creators',
      value: data?.stats?.confirmedCollabs || 0,
      color: 'text-green-400'
    }
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-text-primary mb-8">
        Campaign Hub
      </h1>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-bg-card rounded-xl p-6 border border-border shadow-md"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-glow/20 rounded-lg flex items-center justify-center">
                  <Icon size={24} className={stat.color} />
                </div>
              </div>
              <div className="text-3xl font-display font-bold text-text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-muted text-sm">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Campaign List */}
      <div className="bg-bg-card rounded-xl p-6 border border-border">
        <h2 className="font-display text-xl font-bold text-text-primary mb-6">
          Your Staged Campaigns
        </h2>

        {data?.inquiries?.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <p>You haven't submitted any inquiries yet.</p>
            <Link to="/brands" className="text-primary hover:text-primary-soft font-semibold mt-4 inline-block">
              Submit your first inquiry
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {data?.inquiries?.map((inq) => {
              const categories = typeof inq.categories === 'string' 
                ? JSON.parse(inq.categories) 
                : inq.categories;

              return (
                <div
                  key={inq.id}
                  className="bg-bg rounded-xl p-6 border border-border/80 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/50 transition-colors"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-display text-lg font-bold text-text-primary">
                        {inq.brandName} Campaign
                      </h3>
                      {getStatusBadge(inq.status)}
                    </div>

                    <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-muted">
                      <span className="flex items-center">
                        <Calendar size={14} className="mr-1.5" />
                        {new Date(inq.createdAt).toLocaleDateString()}
                      </span>
                      <span>
                        Budget: <span className="text-text-primary font-medium">{inq.budgetRange}</span>
                      </span>
                      <span>
                        Target: <span className="text-text-primary font-medium capitalize">{categories.join(', ')}</span>
                      </span>
                    </div>

                    <p className="text-muted text-sm line-clamp-2 italic bg-bg-card/50 p-3 rounded-lg border border-border/20">
                      "{inq.message}"
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[180px]">
                    <Link
                      to={`/brand/dashboard/inquiries/${inq.id}/matches`}
                      className="btn-primary py-3 px-4 text-sm flex items-center justify-center space-x-2"
                    >
                      <Sparkles size={16} className="text-white animate-pulse" />
                      <span>AI Matchmaker</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandDashboard;
