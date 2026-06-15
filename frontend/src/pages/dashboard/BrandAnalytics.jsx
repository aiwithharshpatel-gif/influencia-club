import { useState, useEffect } from 'react';
import { BarChart3, Eye, MousePointerClick, TrendingUp, Users, Target, ArrowUpRight, RefreshCw, Download } from 'lucide-react';
import api, { API_URL } from '../../utils/api';
import toast from 'react-hot-toast';

const BrandAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState({});

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get('/brand/analytics');
      if (response.data.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (campaignId) => {
    setRefreshing(prev => ({ ...prev, [campaignId]: true }));
    const toastId = toast.loading('Recalculating analytics...');
    try {
      const response = await api.post(`/brand/analytics/${campaignId}/refresh`);
      if (response.data.success) {
        toast.success('Analytics refreshed successfully!', { id: toastId });
        await fetchAnalytics(true);
      } else {
        toast.error(response.data.message || 'Failed to refresh analytics', { id: toastId });
      }
    } catch (error) {
      console.error('Error refreshing analytics:', error);
      toast.error('Failed to refresh analytics', { id: toastId });
    } finally {
      setRefreshing(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  const handleExport = (campaignId) => {
    // Open report in a new tab. Cookies will be sent automatically.
    const url = `${API_URL}/brand/analytics/${campaignId}/report`;
    window.open(url, '_blank');
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display text-3xl font-bold text-white">
          Campaign Analytics
        </h1>
        <button
          onClick={() => fetchAnalytics(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-card border border-border text-muted hover:text-white transition-all text-xs font-semibold"
        >
          <RefreshCw size={14} />
          Refresh Dashboard
        </button>
      </div>

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
          {data?.campaigns?.map((campaign) => {
            const hasAnalytics = !!campaign.analytics;
            const analytics = campaign.analytics || {};
            
            // Estimates for traffic breakdown
            const metrics = [
              { label: 'Reach', value: analytics.totalReach || 0, color: '#818cf8' },
              { label: 'Impressions', value: analytics.totalImpressions || 0, color: '#a78bfa' },
              { label: 'Engagement', value: analytics.totalEngagement || 0, color: '#c084fc' },
              { label: 'Clicks', value: analytics.totalClicks || 0, color: '#e879f9' }
            ];
            const maxVal = Math.max(...metrics.map(m => m.value), 1);

            return (
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

                  {/* Actions Row */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRefresh(campaign.id)}
                      disabled={refreshing[campaign.id]}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg border border-border text-xs text-muted hover:text-white transition-all disabled:opacity-50"
                      title="Recalculate campaign analytics"
                    >
                      <RefreshCw size={12} className={refreshing[campaign.id] ? 'animate-spin' : ''} />
                      Refresh
                    </button>
                    {hasAnalytics && (
                      <button
                        onClick={() => handleExport(campaign.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 text-xs text-primary transition-all font-semibold"
                        title="Download/Export Campaign Report PDF"
                      >
                        <Download size={12} />
                        Export Report
                      </button>
                    )}
                  </div>
                </div>

                {hasAnalytics ? (
                  <>
                    {/* Basic Metric Blocks */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <MetricBlock
                        label="Reach"
                        value={formatNumber(analytics.totalReach)}
                        icon={Eye}
                      />
                      <MetricBlock
                        label="Impressions"
                        value={formatNumber(analytics.totalImpressions)}
                        icon={BarChart3}
                      />
                      <MetricBlock
                        label="Engagement Rate"
                        value={`${analytics.engagementRate}%`}
                        icon={TrendingUp}
                        highlight
                      />
                      <MetricBlock
                        label="Clicks"
                        value={formatNumber(analytics.totalClicks)}
                        icon={MousePointerClick}
                      />
                    </div>

                    {/* CSS/SVG Mini Graphs */}
                    <div className="flex flex-col md:flex-row gap-6 mt-6 pt-6 border-t border-border/50">
                      {/* Mini Bar Chart */}
                      <div className="flex-1 bg-bg/30 rounded-xl p-4 border border-border/50">
                        <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-4">Traffic Breakdown</h4>
                        <div className="h-28 flex items-end justify-between gap-4 px-2">
                          {metrics.map((m, idx) => {
                            const heightPercent = Math.max(8, Math.round((m.value / maxVal) * 100));
                            return (
                              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                                <span className="text-[10px] text-white font-semibold">{formatNumber(m.value)}</span>
                                <div className="w-full bg-slate-900/50 rounded-t-md overflow-hidden relative h-16">
                                  <div 
                                    className="absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-500" 
                                    style={{ height: `${heightPercent}%`, backgroundColor: m.color, opacity: 0.8 }}
                                  />
                                </div>
                                <span className="text-[9px] text-muted font-medium uppercase tracking-wider">{m.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Mini Donut Chart */}
                      <div className="w-full md:w-56 bg-bg/30 rounded-xl p-4 border border-border/50 flex flex-col items-center justify-center">
                        <h4 className="text-[10px] font-bold text-muted uppercase tracking-wider mb-3 w-full text-center">Engagement & Conversion</h4>
                        <div className="flex items-center gap-4">
                          {/* SVG Donut */}
                          <div className="relative w-16 h-16">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-slate-900"
                                strokeWidth="3.5"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className="text-primary transition-all duration-500"
                                strokeWidth="3.5"
                                strokeDasharray={`${analytics.engagementRate || 0}, 100`}
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-[11px] font-bold text-white">{analytics.engagementRate || 0}%</span>
                              <span className="text-[7px] text-muted">ER</span>
                            </div>
                          </div>
                          <div className="space-y-1 text-left">
                            <div className="text-[10px] text-muted">
                              CTR: <span className="text-white font-semibold">{analytics.ctr || 0}%</span>
                            </div>
                            <div className="text-[10px] text-muted">
                              Conversions: <span className="text-gold font-semibold">{analytics.conversions || 0}</span>
                            </div>
                            <div className="text-[10px] text-muted">
                              ROI: <span className="text-emerald-400 font-semibold">{analytics.roi || 0}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-bg rounded-lg p-6 text-center text-muted text-sm border border-border/50 flex flex-col items-center justify-center gap-2">
                    <p>Analytics will populate once the campaign has active creators and tracking begins.</p>
                    <button
                      onClick={() => handleRefresh(campaign.id)}
                      disabled={refreshing[campaign.id]}
                      className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-soft text-black text-xs font-bold transition-all disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={refreshing[campaign.id] ? 'animate-spin' : ''} />
                      Generate Sample Analytics
                    </button>
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
                          className="w-8 h-8 bg-purple-glow rounded-full flex items-center justify-center border-2 border-bg-card text-xs font-bold text-white overflow-hidden"
                          title={c.name}
                        >
                          {c.photoUrl ? (
                            <img src={c.photoUrl} alt={c.name} className="w-full h-full object-cover" />
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
            );
          })}
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
