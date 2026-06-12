import { useState, useEffect } from 'react';
import { BarChart3, Eye, MousePointerClick, TrendingUp, Users, Target, ArrowUpRight } from 'lucide-react';
import api from '../../utils/api';

const BrandAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/brand/analytics');
      if (response.data.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-bg-card rounded-lg skeleton-shimmer" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-bg-card rounded-xl p-6 border border-border h-32 skeleton-shimmer" />
          ))}
        </div>
        <div className="bg-bg-card rounded-xl p-6 border border-border h-64 skeleton-shimmer" />
      </div>
    );
  }

  const agg = data?.aggregated || {};

  const summaryStats = [
    {
      icon: Eye,
      label: 'Total Reach',
      value: formatNumber(agg.totalReach || 0),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      icon: BarChart3,
      label: 'Impressions',
      value: formatNumber(agg.totalImpressions || 0),
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      icon: TrendingUp,
      label: 'Avg. Engagement',
      value: `${agg.avgEngagementRate || '0.00'}%`,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      icon: Target,
      label: 'Conversions',
      value: formatNumber(agg.totalConversions || 0),
      color: 'text-gold',
      bgColor: 'bg-gold/10'
    }
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-white mb-8">
        Campaign Analytics
      </h1>

      {/* Summary Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon size={20} className={stat.color} />
                </div>
                <ArrowUpRight size={16} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-2xl font-display font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-muted text-sm">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Campaign Breakdown */}
      {data?.campaigns?.length === 0 ? (
        <div className="bg-bg-card rounded-xl p-12 border border-border text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 size={32} className="text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold text-white mb-2">
            No Campaign Data Yet
          </h2>
          <p className="text-muted text-sm max-w-md mx-auto">
            Once your campaigns are active and generating results, analytics will appear here. Start by inviting creators from the AI Matchmaker.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="font-display text-xl font-bold text-white">
            Per-Campaign Performance
          </h2>
          {data?.campaigns?.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-display text-lg font-bold text-white">
                    {campaign.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <CampaignStatusBadge status={campaign.status} />
                    <span className="text-muted text-xs">
                      Budget: <span className="text-white">{campaign.budgetRange}</span>
                    </span>
                    <span className="text-muted text-xs flex items-center">
                      <Users size={12} className="mr-1" />
                      {campaign.creatorsCount} creator{campaign.creatorsCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {campaign.analytics ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <MetricBlock
                    label="Reach"
                    value={formatNumber(campaign.analytics.totalReach)}
                    icon={Eye}
                  />
                  <MetricBlock
                    label="Impressions"
                    value={formatNumber(campaign.analytics.totalImpressions)}
                    icon={BarChart3}
                  />
                  <MetricBlock
                    label="Engagement Rate"
                    value={`${campaign.analytics.engagementRate}%`}
                    icon={TrendingUp}
                    highlight
                  />
                  <MetricBlock
                    label="Clicks"
                    value={formatNumber(campaign.analytics.totalClicks)}
                    icon={MousePointerClick}
                  />
                </div>
              ) : (
                <div className="bg-bg rounded-lg p-4 text-center text-muted text-sm border border-border/50">
                  Analytics will populate once the campaign is active and tracking begins.
                </div>
              )}

              {/* Creator avatars */}
              {campaign.creators?.length > 0 && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                  <span className="text-muted text-xs mr-2">Creators:</span>
                  <div className="flex -space-x-2">
                    {campaign.creators.slice(0, 5).map((c) => (
                      <div
                        key={c.id}
                        className="w-8 h-8 bg-purple-glow rounded-full flex items-center justify-center border-2 border-bg-card text-xs font-bold text-white"
                        title={c.name}
                      >
                        {c.photoUrl ? (
                          <img src={c.photoUrl} alt={c.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          c.name.charAt(0).toUpperCase()
                        )}
                      </div>
                    ))}
                    {campaign.creators.length > 5 && (
                      <div className="w-8 h-8 bg-border rounded-full flex items-center justify-center border-2 border-bg-card text-xs text-muted">
                        +{campaign.creators.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MetricBlock = ({ label, value, icon: Icon, highlight }) => (
  <div className={`bg-bg rounded-lg p-4 border ${highlight ? 'border-primary/30 bg-primary/5' : 'border-border/50'}`}>
    <div className="flex items-center gap-1.5 mb-2">
      <Icon size={14} className="text-muted" />
      <span className="text-muted text-xs">{label}</span>
    </div>
    <div className={`text-lg font-display font-bold ${highlight ? 'text-primary' : 'text-white'}`}>
      {value}
    </div>
  </div>
);

const CampaignStatusBadge = ({ status }) => {
  const styles = {
    planning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    active: 'bg-green-500/15 text-green-400 border-green-500/30',
    completed: 'bg-blue-500/15 text-blue-400 border-blue-500/30'
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${styles[status] || 'bg-muted/15 text-muted border-muted/30'}`}>
      {status}
    </span>
  );
};

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export default BrandAnalytics;
