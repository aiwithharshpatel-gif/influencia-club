import { useState, useEffect } from 'react';
import { Briefcase, CheckCircle, Clock, XCircle, ArrowRight, Check, X, MessageSquare, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Collaborations = () => {
  const [collabs, setCollabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchCollabs();
  }, []);

  const fetchCollabs = async () => {
    try {
      const response = await api.get('/dashboard/collabs');
      if (response.data.success) {
        setCollabs(response.data.collabs);
      }
    } catch (error) {
      console.error('Error fetching collaborations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptCollab = async (collabId) => {
    try {
      setProcessingId(collabId);
      const res = await api.put(`/dashboard/collabs/${collabId}/accept`);
      if (res.data.success) {
        toast.success('Collaboration accepted! Milestones workspace is now open.');
        setCollabs(prev => prev.map(c => c.id === collabId ? { ...c, status: 'confirmed' } : c));
      }
    } catch (err) {
      console.error('Error accepting collab:', err);
      if (err.response?.status === 404) {
        setCollabs(prev => prev.filter(c => c.id !== collabId));
        toast.error('This collaboration offer is no longer available or was removed');
      } else {
        toast.error(err.response?.data?.message || 'Failed to accept collaboration');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineCollab = async (collabId) => {
    if (!window.confirm('Are you sure you want to decline this collaboration offer?')) return;
    try {
      setProcessingId(collabId);
      const res = await api.put(`/dashboard/collabs/${collabId}/decline`);
      if (res.data.success) {
        toast.success('Collaboration declined');
        setCollabs(prev => prev.map(c => c.id === collabId ? { ...c, status: 'declined' } : c));
      }
    } catch (err) {
      console.error('Error declining collab:', err);
      if (err.response?.status === 404) {
        setCollabs(prev => prev.filter(c => c.id !== collabId));
        toast.info('Collaboration offer was already removed');
      } else {
        toast.error(err.response?.data?.message || 'Failed to decline collaboration');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'invited':
        return <Clock size={20} className="text-yellow-400" />;
      case 'confirmed':
        return <CheckCircle size={20} className="text-emerald-400" />;
      case 'completed':
        return <CheckCircle size={20} className="text-primary" />;
      case 'declined':
        return <XCircle size={20} className="text-red-400" />;
      default:
        return <Clock size={20} className="text-muted" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      invited: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
      confirmed: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      completed: 'bg-primary/20 text-primary border border-primary/30',
      declined: 'bg-red-500/20 text-red-400 border border-red-500/30'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${styles[status] || 'bg-muted/20 text-muted'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="text-left space-y-6 pb-12">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">
          Brand Collaborations
        </h1>
        <p className="text-muted text-sm mt-1">
          Review collaboration offers, manage milestone deliverables, and communicate with brand partners.
        </p>
      </div>

      {collabs.length === 0 ? (
        <div className="bg-bg-card rounded-2xl p-12 border border-border text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase size={36} className="text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">
            No Collaborations Yet
          </h2>
          <p className="text-muted max-w-md mx-auto mb-6">
            Brand collaboration requests assigned by the admin or matched via our brand network will appear right here.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/dashboard/profile" className="btn-primary text-sm px-6 py-2.5">
              Enhance Profile & Portfolio
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {collabs.map((collab) => (
            <div
              key={collab.id}
              className="bg-bg-card rounded-2xl p-6 border border-border shadow-lg transition-all hover:border-border/80 space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/15 rounded-xl flex items-center justify-center border border-primary/20 flex-shrink-0">
                    <Briefcase size={22} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-white">
                      {collab.campaign?.brandInquiry?.brandName || 'Brand Partner'}
                    </h3>
                    <p className="text-muted text-xs mt-0.5">
                      {collab.campaign?.title || 'Influencer Campaign'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 self-start">
                  {getStatusIcon(collab.status)}
                  {getStatusBadge(collab.status)}
                </div>
              </div>

              {collab.deliverables && (
                <div className="bg-bg/80 border border-border/60 rounded-xl p-4">
                  <div className="text-xs font-semibold text-white uppercase tracking-wider mb-1.5">Deliverables Brief</div>
                  <p className="text-muted text-sm leading-relaxed whitespace-pre-wrap">{collab.deliverables}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-border/40 text-xs text-muted">
                <div className="flex flex-wrap items-center gap-4">
                  <span>
                    Package Tier: <strong className="text-white capitalize">{collab.campaign?.brandInquiry?.packageType || 'Custom'}</strong>
                  </span>
                  <span>
                    Assigned: <strong className="text-white">{new Date(collab.createdAt).toLocaleDateString()}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {collab.status === 'invited' && (
                    <>
                      <button
                        onClick={() => handleAcceptCollab(collab.id)}
                        disabled={processingId === collab.id}
                        className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs"
                      >
                        <Check size={14} />
                        <span>Accept Offer</span>
                      </button>
                      <button
                        onClick={() => handleDeclineCollab(collab.id)}
                        disabled={processingId === collab.id}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs"
                      >
                        <X size={14} />
                        <span>Decline</span>
                      </button>
                    </>
                  )}

                  {collab.status === 'confirmed' && (
                    <Link
                      to={`/dashboard/milestones/${collab.id}`}
                      className="bg-primary hover:bg-primary-soft text-black px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs shadow-[0_0_15px_rgba(212,175,55,0.1)]"
                    >
                      <span>Open Milestones Workspace</span>
                      <ArrowRight size={14} />
                    </Link>
                  )}

                  <Link
                    to="/dashboard/messages"
                    className="p-2 rounded-xl text-muted hover:text-white bg-bg border border-border hover:border-primary/40 transition-colors"
                    title="Chat with Brand"
                  >
                    <MessageSquare size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Collaborations;

