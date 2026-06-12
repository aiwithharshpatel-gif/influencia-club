import { useState, useEffect } from 'react';
import { Search, Globe, Award, Sparkles, Send, X, CheckCircle2, Hourglass, DollarSign } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import SkeletonCard from '../../components/SkeletonCard';

const ExploreCampaigns = () => {
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' or 'applications'
  const [campaigns, setCampaigns] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Apply Modal State
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [pitch, setPitch] = useState('');
  const [rate, setRate] = useState('');

  useEffect(() => {
    if (activeTab === 'explore') {
      fetchCampaigns();
    } else {
      fetchApplications();
    }
  }, [activeTab]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/campaigns/explore');
      if (response.data.success) {
        setCampaigns(response.data.campaigns);
      }
    } catch (error) {
      console.error('Error fetching explore campaigns:', error);
      toast.error('Failed to load campaigns directory');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/campaigns/applications');
      if (response.data.success) {
        setApplications(response.data.applications);
      }
    } catch (error) {
      console.error('Error fetching submitted applications:', error);
      toast.error('Failed to load your applications');
    } finally {
      setLoading(false);
    }
  };

  const openApplyModal = (campaign) => {
    setSelectedCampaign(campaign);
    setIsApplyModalOpen(true);
  };

  const closeApplyModal = () => {
    setIsApplyModalOpen(false);
    setSelectedCampaign(null);
    setPitch('');
    setRate('');
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!pitch.trim()) {
      toast.error('Please write a pitch statement');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post(`/dashboard/campaigns/${selectedCampaign.id}/apply`, {
        pitch: pitch.trim(),
        rate: rate ? rate.trim() : 'Negotiable'
      });

      if (response.data.success) {
        toast.success('Application submitted successfully!');
        closeApplyModal();
        fetchCampaigns(); // Refresh listings
      } else {
        toast.error(response.data.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white flex items-center gap-2">
            Campaign Hub <Sparkles size={24} className="text-primary animate-pulse" />
          </h1>
          <p className="text-muted text-sm mt-1">
            Discover open briefs from premium brands and apply to earn points and commissions.
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-bg-card border border-border p-1 rounded-xl flex gap-1 self-start">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'explore'
                ? 'bg-primary text-black'
                : 'text-muted hover:text-white'
            }`}
          >
            Open Briefs
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'applications'
                ? 'bg-primary text-black'
                : 'text-muted hover:text-white'
            }`}
          >
            My Applications
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          <SkeletonCard variant="card" count={4} />
        </div>
      ) : activeTab === 'explore' ? (
        /* EXPLORE CAMPAIGNS TAB */
        campaigns.length === 0 ? (
          <div className="bg-bg-card rounded-2xl p-12 border border-border text-center">
            <div className="w-16 h-16 bg-purple-glow/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe size={32} className="text-primary" />
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-2">No Open Briefs</h3>
            <p className="text-muted text-sm max-w-md mx-auto">
              There are currently no public campaigns recruiting creators. Check back soon for new opportunities!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                className="bg-bg-card rounded-2xl border border-border/60 p-6 flex flex-col justify-between hover:border-primary/40 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.02)] transition-all"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-primary font-bold uppercase tracking-wider px-2 py-0.5 bg-primary/10 rounded-full border border-primary/25">
                        {camp.brandName}
                      </span>
                      <h3 className="font-display text-lg font-bold text-white mt-2">
                        {camp.title}
                      </h3>
                    </div>
                    {camp.isMatched && (
                      <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        Matched
                      </span>
                    )}
                  </div>

                  <p className="text-muted text-xs line-clamp-3 leading-relaxed">
                    {camp.notes || "No campaign notes or deliverables detailed yet."}
                  </p>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-muted">
                    <span className="flex items-center gap-1.5">
                      <DollarSign size={14} className="text-primary" />
                      Budget: <span className="text-white font-medium">{camp.budget || 'Negotiable'}</span>
                    </span>
                    <span>
                      Posted: {new Date(camp.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  {camp.isMatched ? (
                    <button
                      disabled
                      className="w-full bg-green-500/10 text-green-400 py-3 rounded-xl border border-green-500/20 text-xs font-semibold cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <CheckCircle2 size={14} />
                      <span>Collaboration Confirmed</span>
                    </button>
                  ) : camp.alreadyApplied ? (
                    <button
                      disabled
                      className="w-full bg-border text-muted py-3 rounded-xl border border-border/60 text-xs font-semibold cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {camp.applicationStatus === 'rejected' ? (
                        <>
                          <X size={14} className="text-red-400" />
                          <span>Application Rejected</span>
                        </>
                      ) : (
                        <>
                          <Hourglass size={14} className="text-yellow-400" />
                          <span>Applied ({camp.applicationStatus})</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => openApplyModal(camp)}
                      className="w-full btn-primary py-3 text-xs tracking-wider uppercase font-semibold flex items-center justify-center space-x-2"
                    >
                      <Send size={14} />
                      <span>Apply Now</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* MY APPLICATIONS TAB */
        applications.length === 0 ? (
          <div className="bg-bg-card rounded-2xl p-12 border border-border text-center">
            <div className="w-16 h-16 bg-purple-glow/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award size={32} className="text-primary" />
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-2">No Applications Submitted</h3>
            <p className="text-muted text-sm max-w-md mx-auto">
              You haven't applied to any public briefs yet. Head to "Open Briefs" to send your first application.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-bg-card rounded-xl border border-border p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-primary/30 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-primary font-bold">{app.campaign.brandName}</span>
                    <span className="text-muted">•</span>
                    <h3 className="font-display font-semibold text-white text-sm">{app.campaign.title}</h3>
                  </div>

                  <p className="text-muted text-xs max-w-2xl italic">
                    Pitch: "{app.pitch}"
                  </p>

                  <div className="flex gap-4 text-[10px] text-muted font-mono">
                    <span>Rate: <span className="text-gold font-medium">{app.rate}</span></span>
                    <span>Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex-shrink-0 self-start sm:self-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                    app.status === 'approved'
                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                      : app.status === 'rejected'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                  }`}>
                    {app.status === 'approved' && <CheckCircle2 size={12} className="mr-1.5" />}
                    {app.status === 'rejected' && <X size={12} className="mr-1.5" />}
                    {app.status === 'pending' && <Hourglass size={12} className="mr-1.5 animate-pulse" />}
                    {app.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Apply Modal */}
      {isApplyModalOpen && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-card rounded-2xl w-full max-w-lg border border-border shadow-2xl relative overflow-hidden">
            <button
              onClick={closeApplyModal}
              className="absolute top-4 right-4 text-muted hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <form onSubmit={handleApplySubmit} className="p-6 md:p-8 space-y-6">
              <div className="text-center">
                <span className="text-xs text-primary font-bold uppercase tracking-wider px-2 py-0.5 bg-primary/10 rounded-full border border-primary/25">
                  {selectedCampaign.brandName} Campaign
                </span>
                <h3 className="font-display text-2xl font-bold text-white mt-3 mb-2">
                  Submit Application
                </h3>
                <p className="text-muted text-xs max-w-sm mx-auto">
                  Brief: "{selectedCampaign.notes || 'Deliverables and terms to be negotiated.'}"
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Pitch Statement (Why are you a fit?)
                  </label>
                  <textarea
                    rows={4}
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                    placeholder="Write a brief message convincing the brand partner why they should select you..."
                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary transition-colors placeholder-muted"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Requested Rate / Commercials (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      placeholder="E.g. ₹5,000 per Reel, or 'Negotiable'"
                      className="w-full bg-bg border border-border rounded-xl pl-9 pr-4 py-3 text-white text-sm focus:outline-none focus:border-primary transition-colors placeholder-muted"
                    />
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={closeApplyModal}
                  className="flex-1 py-3 px-4 rounded-xl border border-border text-white text-sm font-semibold hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn-primary py-3 px-4 rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Send Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreCampaigns;
