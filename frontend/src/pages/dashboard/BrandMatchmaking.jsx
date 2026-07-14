import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, CheckCircle2, Star, MailOpen, AlertCircle, Globe, Check, X, DollarSign, Users } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import SkeletonCard from '../../components/SkeletonCard';

const BrandMatchmaking = () => {
  const { id } = useParams();
  const [matches, setMatches] = useState([]);
  const [campaign, setCampaign] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [invitingId, setInvitingId] = useState(null);
  const [updatingRecruitment, setUpdatingRecruitment] = useState(false);
  const [processingActionId, setProcessingActionId] = useState(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [expandedCreatorId, setExpandedCreatorId] = useState(null);
  const [weights, setWeights] = useState({
    wCategory: 30,
    wLocation: 15,
    wFollowers: 20,
    wPerformance: 15,
    wEngagement: 10
  });

  const fetchMatches = async (customWeights = weights) => {
    try {
      const params = {
        wCategory: customWeights.wCategory,
        wLocation: customWeights.wLocation,
        wFollowers: customWeights.wFollowers,
        wPerformance: customWeights.wPerformance,
        wEngagement: customWeights.wEngagement
      };
      const response = await api.get(`/brand/inquiries/${id}/matches`, { params });
      if (response.data.success) {
        setMatches(response.data.matches);
        setCampaign(response.data.campaign);
        setBudgetInput(response.data.campaign?.budget || '');
        if (response.data.campaign?.isPublic) {
          fetchApplications(response.data.campaign.id);
        }
      }
    } catch (error) {
      console.error('Error fetching creator matches:', error);
      toast.error('Failed to load matchmaking suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchMatches();
    }, 400);
    return () => clearTimeout(handler);
  }, [id, weights.wCategory, weights.wLocation, weights.wFollowers, weights.wPerformance, weights.wEngagement]);

  const fetchApplications = async (campaignId) => {
    try {
      setApplicationsLoading(true);
      const response = await api.get(`/brand/campaigns/${campaignId}/applications`);
      if (response.data.success) {
        setApplications(response.data.applications);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const handleInvite = async (creatorId) => {
    try {
      setInvitingId(creatorId);
      const response = await api.post(`/brand/inquiries/${id}/invite`, {
        creatorId,
        deliverables: 'Instagram Reel + Story post showcasing product usage'
      });
      if (response.data.success) {
        toast.success('Creator invited successfully!');
        setMatches(prev => 
          prev.map(m => m.id === creatorId ? { ...m, inviteStatus: 'invited' } : m)
        );
      } else {
        toast.error(response.data.message || 'Invitation failed');
      }
    } catch (error) {
      console.error('Error inviting creator:', error);
      toast.error(error.response?.data?.message || 'Failed to send invite');
    } finally {
      setInvitingId(null);
    }
  };

  const handleToggleRecruitment = async () => {
    if (!campaign) return;
    try {
      setUpdatingRecruitment(true);
      const newPublicState = !campaign.isPublic;
      const response = await api.put(`/brand/campaigns/${campaign.id}/recruitment`, {
        isPublic: newPublicState,
        budget: budgetInput
      });
      if (response.data.success) {
        setCampaign(prev => ({ ...prev, isPublic: newPublicState }));
        toast.success(newPublicState ? 'Public recruitment enabled!' : 'Public recruitment disabled.');
        if (newPublicState) {
          fetchApplications(campaign.id);
        } else {
          setApplications([]);
        }
      }
    } catch (error) {
      toast.error('Failed to update recruitment settings');
    } finally {
      setUpdatingRecruitment(false);
    }
  };

  const handleSaveBudget = async () => {
    if (!campaign) return;
    try {
      const response = await api.put(`/brand/campaigns/${campaign.id}/recruitment`, {
        isPublic: campaign.isPublic,
        budget: budgetInput
      });
      if (response.data.success) {
        setCampaign(prev => ({ ...prev, budget: budgetInput }));
        toast.success('Campaign budget updated!');
      }
    } catch (error) {
      toast.error('Failed to update campaign budget');
    }
  };

  const handleApplicationAction = async (appId, action) => {
    try {
      setProcessingActionId(appId);
      const response = await api.post(`/brand/applications/${appId}/action`, { action });
      if (response.data.success) {
        toast.success(`Application ${action === 'approve' ? 'accepted' : 'rejected'} successfully!`);
        fetchMatches(); // Re-fetch matches and applications to sync states
      } else {
        toast.error(response.data.message || 'Action failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process action');
    } finally {
      setProcessingActionId(null);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-10 h-10 bg-bg-card rounded-lg skeleton-shimmer" />
          <div className="space-y-2">
            <div className="h-3 w-24 bg-border/40 rounded" />
            <div className="h-6 w-48 bg-border/50 rounded" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <SkeletonCard variant="card" count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-4">
          <Link to="/brand/dashboard" className="w-10 h-10 bg-bg-card border border-border rounded-lg flex items-center justify-center text-muted hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-xs text-primary font-bold uppercase tracking-wider flex items-center">
              <Sparkles size={12} className="mr-1 text-primary animate-pulse" />
              AI Matchmaker
            </span>
            <h1 className="font-display text-2xl font-bold text-white">
              Campaign Recruitment Portal
            </h1>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Left Columns: Recommendations & Matches */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
              Creator Recommendations <Sparkles size={16} className="text-primary animate-pulse" />
            </h2>
            <span className="text-muted text-xs font-semibold uppercase">{matches.length} matches found</span>
          </div>

          {matches.length === 0 ? (
            <div className="bg-bg-card rounded-xl p-12 border border-border text-center">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} className="text-yellow-400" />
              </div>
              <h2 className="font-display text-xl font-bold text-white mb-2">
                No Matches Found
              </h2>
              <p className="text-muted text-sm max-w-md mx-auto">
                We couldn't find active verified creators matching your categories. Ensure your creators are verified and approved in the system.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {matches.map((creator) => (
                <div
                  key={creator.id}
                  className="bg-bg-card rounded-xl p-6 border border-border flex flex-col justify-between relative overflow-hidden group hover:border-primary/50 transition-colors"
                >
                  {/* Score Badge with toggle breakdown */}
                  <div className="absolute top-4 right-4 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCreatorId(expandedCreatorId === creator.id ? null : creator.id);
                      }}
                      className="bg-primary/25 hover:bg-primary/35 border border-primary/40 text-primary px-3 py-1.5 rounded-full text-xs font-bold font-display flex items-center shadow-lg transition-colors cursor-pointer group"
                    >
                      <Sparkles size={12} className="mr-1.5 text-primary group-hover:scale-125 transition-transform" />
                      {creator.matchPercentage} Match
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Creator Avatar & Basic Info */}
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-purple-glow rounded-full flex items-center justify-center shadow-md relative">
                        {creator.photoUrl ? (
                          <img
                            src={creator.photoUrl}
                            alt={creator.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-bold text-white">
                            {creator.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        {creator.isVerified && (
                          <div className="absolute -bottom-1 -right-1 bg-bg rounded-full p-0.5">
                            <CheckCircle2 size={16} className="text-primary fill-bg" />
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="font-display text-lg font-bold text-white flex items-center gap-1.5">
                          {creator.name}
                        </h3>
                        <p className="text-muted text-xs capitalize">
                          {creator.category} • {creator.city}
                        </p>
                        <p className="text-primary font-semibold text-sm mt-1">
                          {creator.followerCount || 'N/A'} Followers
                        </p>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      {creator.isFeatured && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gold/15 text-gold border border-gold/30">
                          <Star size={10} className="mr-1 fill-gold" />
                          Featured
                        </span>
                      )}
                    </div>

                    {/* Expandable Match Breakdown Details */}
                    {expandedCreatorId === creator.id && creator.matchBreakdown && (
                      <div className="p-4 bg-black/60 rounded-xl border border-border/80 space-y-3 animate-fadeIn text-xs">
                        <h4 className="font-bold text-white flex items-center gap-1 text-[10px] uppercase tracking-wider">
                          <Sparkles size={10} className="text-primary" /> Matching Points Breakdown
                        </h4>
                        
                        <div className="space-y-2">
                          {Object.entries(creator.matchBreakdown)
                            .filter(([_, value]) => value.max > 0)
                            .map(([key, val]) => {
                              const percent = val.max > 0 ? Math.round((val.points / val.max) * 100) : 0;
                              const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                              return (
                                <div key={key} className="space-y-1">
                                  <div className="flex justify-between text-[10px]">
                                    <span className="text-muted">{title}</span>
                                    <span className="text-white font-medium">{val.points} / {val.max} pts</span>
                                  </div>
                                  <div className="w-full bg-border/40 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-primary-gradient h-full rounded-full transition-all duration-500" 
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between gap-4">
                    {creator.inviteStatus === 'none' ? (
                      <button
                        onClick={() => handleInvite(creator.id)}
                        disabled={invitingId === creator.id}
                        className="w-full btn-primary py-2.5 text-sm flex items-center justify-center space-x-2"
                      >
                        <MailOpen size={16} />
                        <span>{invitingId === creator.id ? 'Inviting...' : 'Invite to Collab'}</span>
                      </button>
                    ) : creator.inviteStatus === 'invited' ? (
                      <button
                        disabled
                        className="w-full bg-border text-muted py-2.5 rounded-lg border border-border/60 text-sm font-semibold cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        <CheckCircle2 size={16} className="text-green-500" />
                        <span>Invited</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full bg-green-500/10 text-green-400 py-2.5 rounded-lg border border-green-500/20 text-sm font-semibold cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        <CheckCircle2 size={16} className="text-green-400" />
                        <span>Confirmed</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Public Recruitment Panel */}
        <div className="space-y-6">
          {/* AI Matchmaker Tuner Card */}
          <div className="bg-bg-card rounded-2xl border border-border p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="text-primary animate-pulse" size={20} />
                <h2 className="font-display text-lg font-bold text-white">Matchmaker Tuner</h2>
              </div>
              <button 
                onClick={() => setWeights({ wCategory: 30, wLocation: 15, wFollowers: 20, wPerformance: 15, wEngagement: 10 })}
                className="text-xs text-primary hover:underline transition-colors font-bold uppercase tracking-wider cursor-pointer"
              >
                Reset
              </button>
            </div>
            
            <p className="text-muted text-xs leading-relaxed">
              Fine-tune matching priorities. Sliding a weight to 0 ignores that factor. Results recalculate automatically.
            </p>

            <div className="space-y-4">
              {/* Category weight */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-white/80">Category Affinity</span>
                  <span className="text-primary font-bold">{weights.wCategory} pts</span>
                </div>
                <input 
                  type="range" min="0" max="50" 
                  value={weights.wCategory} 
                  onChange={(e) => setWeights(prev => ({ ...prev, wCategory: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                />
              </div>

              {/* Location weight */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-white/80">Location Match</span>
                  <span className="text-primary font-bold">{weights.wLocation} pts</span>
                </div>
                <input 
                  type="range" min="0" max="50" 
                  value={weights.wLocation} 
                  onChange={(e) => setWeights(prev => ({ ...prev, wLocation: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                />
              </div>

              {/* Followers weight */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-white/80">Follower Range</span>
                  <span className="text-primary font-bold">{weights.wFollowers} pts</span>
                </div>
                <input 
                  type="range" min="0" max="50" 
                  value={weights.wFollowers} 
                  onChange={(e) => setWeights(prev => ({ ...prev, wFollowers: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                />
              </div>

              {/* Performance weight */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-white/80">Past Performance</span>
                  <span className="text-primary font-bold">{weights.wPerformance} pts</span>
                </div>
                <input 
                  type="range" min="0" max="50" 
                  value={weights.wPerformance} 
                  onChange={(e) => setWeights(prev => ({ ...prev, wPerformance: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                />
              </div>

              {/* Engagement weight */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-white/80">Instagram Engagement</span>
                  <span className="text-primary font-bold">{weights.wEngagement} pts</span>
                </div>
                <input 
                  type="range" min="0" max="50" 
                  value={weights.wEngagement} 
                  onChange={(e) => setWeights(prev => ({ ...prev, wEngagement: parseInt(e.target.value) }))}
                  className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-bg-card rounded-2xl border border-border p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-2">
              <Globe className="text-primary" size={20} />
              <h2 className="font-display text-lg font-bold text-white">Public Recruitment</h2>
            </div>

            <p className="text-muted text-xs leading-relaxed">
              Enable public recruitment to list your campaign on the creator directory. Verified creators will be able to view details and apply directly with custom pitches and rates.
            </p>

            {/* Toggle public recruitment */}
            <div className="flex items-center justify-between bg-bg/50 p-4 rounded-xl border border-border/60">
              <span className="text-sm font-medium text-white">Recruit Publicly</span>
              <button
                type="button"
                onClick={handleToggleRecruitment}
                disabled={updatingRecruitment}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  campaign?.isPublic ? 'bg-primary' : 'bg-border'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    campaign?.isPublic ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Budget input field */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider">Campaign Budget</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    placeholder="E.g., ₹25,000 - ₹50,000"
                    className="w-full bg-bg border border-border rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                </div>
                <button
                  type="button"
                  onClick={handleSaveBudget}
                  className="bg-bg border border-border hover:border-primary px-4 rounded-xl text-xs font-bold text-white transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Incoming Applications List */}
          {campaign?.isPublic && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="text-gold" size={20} />
                <h2 className="font-display text-lg font-bold text-white">Applications</h2>
              </div>

              {applicationsLoading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : applications.length === 0 ? (
                <div className="bg-bg-card/50 rounded-xl p-8 border border-border/40 text-center">
                  <p className="text-muted text-xs">No active applications yet. Make sure your campaign recruitment is enabled!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="bg-bg-card rounded-xl border border-border/80 p-5 space-y-4 hover:border-gold/20 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {app.creator.photoUrl ? (
                            <img
                              src={app.creator.photoUrl}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-purple-glow flex items-center justify-center text-white font-bold text-sm">
                              {app.creator.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h4 className="font-display text-sm font-semibold text-white truncate max-w-[130px]">
                              {app.creator.name}
                            </h4>
                            <p className="text-gold text-[10px]">@{app.creator.instagram}</p>
                          </div>
                        </div>

                        {app.status !== 'pending' ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            app.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {app.status}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            Pending
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-muted leading-relaxed bg-bg/40 p-3 rounded-lg border border-border/20">
                        <p className="font-semibold text-[10px] text-muted uppercase tracking-wider mb-1">Pitch:</p>
                        <p className="italic">"{app.pitch}"</p>
                        {app.rate && (
                          <p className="mt-2 text-white font-medium text-[10px]">
                            Rate: <span className="text-gold">{app.rate}</span>
                          </p>
                        )}
                      </div>

                      {app.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApplicationAction(app.id, 'reject')}
                            disabled={processingActionId === app.id}
                            className="flex-1 py-2 rounded-lg border border-border hover:bg-red-500/10 hover:border-red-500/20 text-red-400 text-xs font-bold transition-all flex items-center justify-center gap-1"
                          >
                            <X size={14} />
                            Reject
                          </button>
                          <button
                            onClick={() => handleApplicationAction(app.id, 'approve')}
                            disabled={processingActionId === app.id}
                            className="flex-1 py-2 rounded-lg bg-primary hover:bg-primary-soft text-black text-xs font-bold transition-all flex items-center justify-center gap-1"
                          >
                            <Check size={14} />
                            Accept
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandMatchmaking;
