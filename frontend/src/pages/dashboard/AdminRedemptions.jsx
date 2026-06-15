import { useState, useEffect } from 'react';
import { Gift, Sparkles, Filter, CheckCircle2, X, AlertOctagon, RefreshCw, MessageSquare, Clock, Award } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AdminRedemptions = () => {
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');

  // Decision Modal
  const [selectedRedemption, setSelectedRedemption] = useState(null);
  const [actionType, setActionType] = useState(''); // 'approved' or 'rejected'
  const [adminNote, setAdminNote] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchRedemptions();
  }, [status]);

  const fetchRedemptions = async () => {
    try {
      setLoading(true);
      const params = { status: status || 'all' };
      const response = await api.get('/admin/redemptions', { params });
      if (response.data.success) {
        setRedemptions(response.data.redemptions);
      }
    } catch (error) {
      console.error('Error fetching admin redemptions:', error);
      toast.error('Failed to load redemption requests');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenActionModal = (redemption, action) => {
    setSelectedRedemption(redemption);
    setActionType(action);
    setAdminNote('');
  };

  const handleCloseActionModal = () => {
    setSelectedRedemption(null);
    setActionType('');
    setAdminNote('');
  };

  const handleSubmitAction = async (e) => {
    e.preventDefault();
    if (!selectedRedemption || !actionType) return;

    try {
      setProcessingAction(true);
      const response = await api.put(`/admin/redemptions/${selectedRedemption.id}`, {
        status: actionType,
        adminNote: adminNote.trim() || undefined
      });

      if (response.data.success) {
        toast.success(`Redemption request successfully ${actionType}`);
        // Remove or update from local list
        setRedemptions(redemptions.map(r => r.id === selectedRedemption.id ? { ...r, status: actionType, adminNote: adminNote.trim() } : r));
        handleCloseActionModal();
      }
    } catch (error) {
      console.error('Error updating redemption:', error);
      toast.error(error.response?.data?.message || 'Failed to update redemption status');
    } finally {
      setProcessingAction(false);
    }
  };

  const formatRewardType = (type) => {
    switch (type) {
      case 'featured': return 'Featured Profile Badge (1 month)';
      case 'ig_promo': return 'Instagram Page Feature Promo';
      case 'event_entry': return 'Exclusive Influenzia Event Entry';
      case 'collab_priority': return 'Priority Brand Collab Priority Match';
      default: return type.replace('_', ' ');
    }
  };

  return (
    <div className="space-y-8 pb-10 text-left">
      {/* Header title */}
      <div>
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-2">
          Redemption Processor <Sparkles size={24} className="text-gold" />
        </h1>
        <p className="text-muted text-sm mt-1">
          Review, approve, or reject creator points redemption requests. Rejected transactions auto-refund points to creators.
        </p>
      </div>

      {/* Status filter bar */}
      <div className="bg-bg-card rounded-2xl p-6 border border-border/85 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-primary" />
          <span className="text-white text-xs font-semibold uppercase tracking-wider">Status filter</span>
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s === 'all' ? '' : s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                (s === 'all' && status === '') || status === s
                  ? 'bg-primary text-black border-primary'
                  : 'bg-[#18181b] text-muted border-border hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Redemption List */}
      <div className="bg-bg-card rounded-2xl border border-border/85 p-6 shadow-lg overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            <span className="text-muted text-xs">Loading redemption requests...</span>
          </div>
        ) : redemptions.length === 0 ? (
          <div className="py-16 text-center text-muted">
            No redemption requests found matching this status filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#a1a1aa]">
              <thead>
                <tr className="text-white text-xs font-semibold uppercase tracking-wider border-b border-border/50 pb-3">
                  <th className="pb-3">Creator</th>
                  <th className="pb-3">Reward Requested</th>
                  <th className="pb-3 text-center">Cost</th>
                  <th className="pb-3">Requested At</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 text-xs">
                {redemptions.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white text-sm">{r.creator.name}</span>
                        <span className="text-muted text-[10px] mt-0.5">{r.creator.email}</span>
                      </div>
                    </td>
                    <td className="py-4 font-medium text-white">
                      {formatRewardType(r.rewardType)}
                    </td>
                    <td className="py-4 text-center font-bold text-gold">
                      {r.pointsCost} pts
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-muted" />
                        <span>{new Date(r.createdAt).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        r.status === 'pending'
                          ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20'
                          : r.status === 'approved'
                          ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                          : 'bg-red-400/10 text-red-400 border border-red-400/20'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {r.status === 'pending' ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenActionModal(r, 'approved')}
                            className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/25 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenActionModal(r, 'rejected')}
                            className="bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/25 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="text-muted text-[10px] block italic max-w-[150px] truncate ml-auto">
                            {r.adminNote || 'No notes left'}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Decision Note Modal */}
      {selectedRedemption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-sm shadow-2xl p-6 relative overflow-hidden">
            <button
              onClick={handleCloseActionModal}
              className="absolute top-4 right-4 text-muted hover:text-white"
            >
              <X size={18} />
            </button>

            <form onSubmit={handleSubmitAction} className="space-y-4 text-left">
              <div className="text-center pb-2 border-b border-border/30">
                <AlertOctagon size={28} className={actionType === 'approved' ? 'text-emerald-400 mx-auto mb-2' : 'text-red-400 mx-auto mb-2'} />
                <h3 className="text-white text-base font-bold">{actionType === 'approved' ? 'Approve' : 'Reject'} Redemption</h3>
                <p className="text-xs text-muted mt-0.5">
                  Confirm action for {selectedRedemption.creator.name}'s request for {formatRewardType(selectedRedemption.rewardType)}
                </p>
              </div>

              {actionType === 'rejected' && (
                <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl flex gap-2 text-[10px] text-red-400">
                  <Award size={16} className="shrink-0 text-red-400" />
                  <p>Rejecting will automatically refund {selectedRedemption.pointsCost} points to the creator's balance.</p>
                </div>
              )}

              <div>
                <label htmlFor="decision_note" className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5">
                  Administrator Note (Optional)
                </label>
                <textarea
                  id="decision_note"
                  rows="3"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full bg-black border border-border rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-gold resize-none"
                  placeholder={actionType === 'approved' ? 'E.g., Sent coupon code via email' : 'E.g., Insufficient verified deliverables'}
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseActionModal}
                  className="flex-1 py-2 bg-white/5 border border-border text-white rounded-xl text-xs font-semibold hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingAction}
                  className={`flex-1 py-2 text-black rounded-xl text-xs font-bold transition-colors ${
                    actionType === 'approved' ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-red-500 hover:bg-red-400'
                  }`}
                >
                  {processingAction ? 'Processing...' : 'Confirm Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRedemptions;
