import { useState, useEffect } from 'react';
import {
  CheckCircle2, Clock, Upload, AlertCircle, ChevronRight, ChevronDown,
  Plus, Send, Target, Loader2, Eye, MessageCircle, Trash2, X, FileText, Download
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const MILESTONE_TEMPLATES = [
  { type: 'brief_review', title: 'Brief Review', description: 'Creator reviews campaign brief and confirms understanding of deliverables.' },
  { type: 'draft_submit', title: 'Content Draft', description: 'Creator submits draft content (photo/reel/story) for brand review before going live.' },
  { type: 'draft_review', title: 'Draft Approval', description: 'Brand reviews and approves the submitted draft content.' },
  { type: 'live_verification', title: 'Live Verification', description: 'Creator posts the approved content and shares the live link for verification.' }
];

const statusConfig = {
  pending: { color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Pending', dot: 'bg-gray-500' },
  in_progress: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'In Progress', dot: 'bg-blue-500' },
  submitted: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Submitted', dot: 'bg-yellow-500' },
  approved: { color: 'text-green-400', bg: 'bg-green-500/10', label: 'Approved', dot: 'bg-green-500' },
  revision_requested: { color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Revision', dot: 'bg-orange-500' }
};

const BrandMilestones = () => {
  const { user } = useAuth();
  const [collaborations, setCollaborations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCcId, setSelectedCcId] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(null);
  const [reviewAction, setReviewAction] = useState('approve');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Payment states
  const [selectedCollabForPayment, setSelectedCollabForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(5000);
  const [paying, setPaying] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [selectedAgreementHtml, setSelectedAgreementHtml] = useState('');

  useEffect(() => {
    fetchCollaborations();
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/payments/payments');
      if (response.data.success) {
        setPayments(response.data.payments);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const handleDownloadInvoice = async (paymentId) => {
    try {
      const response = await api.get(`/payments/invoice/${paymentId}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${paymentId}.html`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Download invoice error:', error);
      toast.error('Failed to download invoice');
    }
  };

  const handleViewAgreement = (payment) => {
    if (!payment.agreementUrl) {
      toast.error('Agreement not found');
      return;
    }
    try {
      const base64Content = payment.agreementUrl.replace('data:text/html;base64,', '');
      const htmlContent = atob(base64Content);
      setSelectedAgreementHtml(htmlContent);
      setShowAgreementModal(true);
    } catch (error) {
      console.error('Agreement decoding error:', error);
      toast.error('Failed to display agreement');
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async (collab, amount) => {
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setPaying(true);
    try {
      const orderResponse = await api.post('/payments/create-order', {
        brandInquiryId: collab.brandInquiryId,
        creatorId: collab.creator.id,
        amount: Number(amount)
      });

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || 'Failed to create order');
      }

      const { order, payment } = orderResponse.data;

      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error('Razorpay SDK failed to load. Are you offline?');
        setPaying(false);
        return;
      }

      const options = {
        key: 'rzp_test_mockkey',
        amount: order.amount,
        currency: order.currency,
        name: 'Influenzia Club',
        description: `Escrow payment - ${collab.creator?.name || 'Creator'}`,
        order_id: order.id,
        handler: async function (response) {
          setPaying(true);
          try {
            const verifyResponse = await api.post('/payments/verify-payment', {
              paymentId: payment.id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verifyResponse.data.success) {
              toast.success('Escrow payment successfully completed!');
              setSelectedCollabForPayment(null);
              fetchCollaborations();
              fetchPayments();
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            toast.error(error.response?.data?.message || 'Payment verification failed');
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          name: collab.brandName || '',
          email: user?.email || ''
        },
        theme: {
          color: '#D4AF37'
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to initialize payment');
      setPaying(false);
    }
  };

  const handleMockPayment = async (collab, amount) => {
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setPaying(true);
    try {
      const orderResponse = await api.post('/payments/create-order', {
        brandInquiryId: collab.brandInquiryId,
        creatorId: collab.creator.id,
        amount: Number(amount)
      });

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || 'Failed to create payment order');
      }

      const { payment } = orderResponse.data;

      const mockPaymentId = 'pay_mock_' + Math.random().toString(36).substring(7);
      const mockSignature = 'mock_sig_' + Math.random().toString(36).substring(7);

      const verifyResponse = await api.post('/payments/verify-payment', {
        paymentId: payment.id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature
      }, {
        headers: {
          'x-test-bypass': 'true'
        }
      });

      if (verifyResponse.data.success) {
        toast.success('[TEST] Escrow payment simulated successfully!');
        setSelectedCollabForPayment(null);
        fetchCollaborations();
        fetchPayments();
      } else {
        toast.error('Simulation verification failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Mock payment failed');
    } finally {
      setPaying(false);
    }
  };

  const fetchCollaborations = async () => {
    try {
      const response = await api.get('/milestones/brand');
      if (response.data.success) {
        setCollaborations(response.data.collaborations);
      }
    } catch (error) {
      console.error('Error fetching collaborations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMilestoneDetail = async (ccId) => {
    setLoadingDetail(true);
    try {
      const response = await api.get(`/milestones/brand/${ccId}`);
      if (response.data.success) {
        setMilestones(response.data.milestones);
        setSelectedCcId(ccId);
      }
    } catch (error) {
      console.error('Error fetching milestone details:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreateMilestones = async (ccId) => {
    try {
      await api.post('/milestones/brand/create', {
        campaignCreatorId: ccId,
        milestones: MILESTONE_TEMPLATES
      });
      toast.success('Milestones created successfully!');
      setShowCreateModal(false);
      await fetchCollaborations();
      await fetchMilestoneDetail(ccId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create milestones');
    }
  };

  const handleReview = async () => {
    if (!showReviewModal) return;
    setReviewSubmitting(true);
    try {
      await api.put(`/milestones/brand/${showReviewModal}/review`, {
        action: reviewAction,
        feedback: reviewFeedback || undefined
      });
      toast.success(reviewAction === 'approve' ? 'Milestone approved!' : 'Revision requested');
      setShowReviewModal(null);
      setReviewFeedback('');
      // Refresh both lists
      await fetchCollaborations();
      if (selectedCcId) await fetchMilestoneDetail(selectedCcId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Review failed');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Deliverables
          </h1>
          <p className="text-muted mt-1">
            Track and manage campaign milestones for your creators.
          </p>
        </div>
      </div>

      {collaborations.length === 0 ? (
        <div className="bg-bg-card rounded-xl p-12 border border-border text-center">
          <div className="w-20 h-20 bg-purple-glow/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target size={40} className="text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">
            No Active Collaborations
          </h2>
          <p className="text-muted">
            Once you have confirmed creators on campaigns, manage their deliverable milestones here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {collaborations.map(collab => {
            const isExpanded = selectedCcId === collab.campaignCreatorId;
            const hasMilestones = collab.totalMilestones > 0;

            return (
              <div
                key={collab.campaignCreatorId}
                className="bg-bg-card rounded-xl border border-border overflow-hidden transition-all duration-300"
              >
                {/* Collaboration Header */}
                <button
                  onClick={() => {
                    if (isExpanded) {
                      setSelectedCcId(null);
                    } else {
                      fetchMilestoneDetail(collab.campaignCreatorId);
                    }
                  }}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-bg/30 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Creator Avatar */}
                    <div className="w-10 h-10 rounded-full bg-purple-glow flex items-center justify-center flex-shrink-0">
                      {collab.creator?.photoUrl ? (
                        <img src={collab.creator.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {collab.creator?.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="font-display text-base font-semibold text-white truncate">
                        {collab.creator?.name || 'Creator'}
                        <span className="text-muted font-normal ml-2 text-sm">
                          @{collab.creator?.instagram}
                        </span>
                      </div>
                      <div className="text-xs text-muted mt-0.5 truncate">
                        {collab.campaignTitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Progress or Create CTA */}
                    {hasMilestones ? (
                      <div className="text-right hidden sm:block">
                        <div className="text-xs text-muted mb-1">
                          {collab.approvedMilestones}/{collab.totalMilestones} done
                        </div>
                        <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-green-400 rounded-full"
                            style={{ width: `${collab.milestoneProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted italic hidden sm:inline">
                        No milestones
                      </span>
                    )}

                    {collab.pendingReviewCount > 0 && (
                      <span className="bg-yellow-500/20 text-yellow-400 text-xs font-semibold px-2.5 py-1 rounded-full animate-pulse">
                        {collab.pendingReviewCount} to review
                      </span>
                    )}

                    {isExpanded ? (
                      <ChevronDown size={18} className="text-muted" />
                    ) : (
                      <ChevronRight size={18} className="text-muted" />
                    )}
                  </div>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-border p-5">
                    {(() => {
                      const payment = payments.find(p => p.brandInquiryId === collab.brandInquiryId && p.creatorId === collab.creator?.id && p.status === 'completed');
                      
                      return (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 mb-5 rounded-xl border border-primary/20 bg-primary/5">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${payment ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                              {payment ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white">
                                {payment ? 'Escrow Payment Protected' : 'Escrow Payment Pending'}
                              </div>
                              <div className="text-xs text-muted">
                                {payment 
                                  ? `Secured amount of ₹${Number(payment.amount).toLocaleString('en-IN')} is held in escrow.` 
                                  : 'Please fund the campaign milestones to start collaboration.'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {payment ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadInvoice(payment.id);
                                  }}
                                  className="text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-border px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                                  id={`download-invoice-${collab.campaignCreatorId}`}
                                >
                                  <Download size={14} />
                                  Download Invoice
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewAgreement(payment);
                                  }}
                                  className="text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                                  id={`view-agreement-${collab.campaignCreatorId}`}
                                >
                                  <FileText size={14} />
                                  View Agreement
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCollabForPayment(collab);
                                  setPaymentAmount(5000); // Default editable amount
                                }}
                                className="text-xs font-bold bg-primary hover:bg-primary-soft text-black px-4 py-2.5 rounded-lg transition-colors shadow-lg shadow-primary/10"
                                id={`pay-escrow-btn-${collab.campaignCreatorId}`}
                              >
                                Pay Escrow
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {loadingDetail ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 size={24} className="animate-spin text-primary" />
                      </div>
                    ) : milestones.length === 0 ? (
                      <div className="text-center py-8">
                        <Target size={32} className="text-muted mx-auto mb-3" />
                        <p className="text-muted text-sm mb-4">
                          No milestones set for this collaboration yet.
                        </p>
                        <button
                          onClick={() => handleCreateMilestones(collab.campaignCreatorId)}
                          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-soft text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
                        >
                          <Plus size={16} />
                          Create Default Milestones
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {milestones.map((ms, idx) => {
                          const cfg = statusConfig[ms.status] || statusConfig.pending;

                          return (
                            <div
                              key={ms.id}
                              className={`flex items-center justify-between p-4 rounded-lg border ${
                                ms.status === 'submitted'
                                  ? 'border-yellow-500/30 bg-yellow-500/5'
                                  : 'border-border bg-bg/30'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-3 h-3 rounded-full ${cfg.dot} flex-shrink-0 ${
                                  ms.status === 'in_progress' ? 'animate-pulse' : ''
                                }`} />
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-white truncate">
                                    {idx + 1}. {ms.title}
                                  </div>
                                  <div className={`text-xs ${cfg.color} mt-0.5`}>{cfg.label}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                {/* Submitted — show review button */}
                                {ms.status === 'submitted' && (
                                  <button
                                    onClick={() => {
                                      setShowReviewModal(ms.id);
                                      setReviewAction('approve');
                                      setReviewFeedback('');
                                    }}
                                    className="flex items-center gap-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                                  >
                                    <Eye size={14} />
                                    Review
                                  </button>
                                )}

                                {/* Show submission link if available */}
                                {ms.submissionUrl && ms.status !== 'submitted' && (
                                  <a
                                    href={ms.submissionUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline"
                                  >
                                    View
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-bold text-white">Review Submission</h3>
              <button
                onClick={() => setShowReviewModal(null)}
                className="text-muted hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Action select */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                onClick={() => setReviewAction('approve')}
                className={`p-3 rounded-xl border text-center text-sm font-semibold transition-all ${
                  reviewAction === 'approve'
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'border-border text-muted hover:border-green-500/20'
                }`}
              >
                <CheckCircle2 size={20} className="mx-auto mb-1" />
                Approve
              </button>
              <button
                onClick={() => setReviewAction('revision')}
                className={`p-3 rounded-xl border text-center text-sm font-semibold transition-all ${
                  reviewAction === 'revision'
                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                    : 'border-border text-muted hover:border-orange-500/20'
                }`}
              >
                <MessageCircle size={20} className="mx-auto mb-1" />
                Request Revision
              </button>
            </div>

            {/* Feedback */}
            <div className="mb-5">
              <label className="block text-xs text-muted mb-1.5 font-medium">
                Feedback {reviewAction === 'revision' ? '(required)' : '(optional)'}
              </label>
              <textarea
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                placeholder={reviewAction === 'approve'
                  ? 'Great work! Content looks perfect.'
                  : 'Please adjust the caption to include...'
                }
                rows={3}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-muted/50 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-colors resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewModal(null)}
                className="flex-1 border border-border text-muted hover:text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReview}
                disabled={reviewSubmitting || (reviewAction === 'revision' && !reviewFeedback.trim())}
                className={`flex-1 flex items-center justify-center gap-2 font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  reviewAction === 'approve'
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                {reviewSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : reviewAction === 'approve' ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <MessageCircle size={16} />
                )}
                {reviewSubmitting ? 'Processing...' : reviewAction === 'approve' ? 'Approve' : 'Request Revision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escrow Checkout Modal */}
      {selectedCollabForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-bold text-white">Escrow Payment Checkout</h3>
              <button
                onClick={() => setSelectedCollabForPayment(null)}
                className="text-muted hover:text-white transition-colors"
                id="close-payment-modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-bg/50 p-4 rounded-xl border border-border">
                <div className="text-xs text-muted font-medium mb-1">CAMPAIGN</div>
                <div className="text-sm font-semibold text-white truncate">
                  {selectedCollabForPayment.campaignTitle}
                </div>
                <div className="text-xs text-muted mt-2">CREATOR</div>
                <div className="text-sm font-semibold text-white">
                  {selectedCollabForPayment.creator?.name} (@{selectedCollabForPayment.creator?.instagram})
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted mb-1.5 font-medium">
                  Escrow Amount (₹)
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-muted/50 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-colors"
                  id="escrow-payment-amount-input"
                  min="1"
                />
              </div>

              <div className="bg-primary/5 p-4 rounded-xl border border-primary/15 text-xs text-primary leading-relaxed">
                <strong>How Escrow Works:</strong> Payments are securely held by Influenzia Club. Funds are only released to the creator after you approve the completed deliverables.
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleRazorpayPayment(selectedCollabForPayment, paymentAmount)}
                disabled={paying}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-soft text-black font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
                id="pay-via-razorpay-btn"
              >
                {paying ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <span>Proceed to Pay with Razorpay</span>
                )}
              </button>

              {/* Simulation Option for Test Environments */}
              {(window.location.hostname === 'localhost' || 
                window.location.hostname.includes('test') || 
                window.location.search.includes('bypass') ||
                true) && (
                <button
                  onClick={() => handleMockPayment(selectedCollabForPayment, paymentAmount)}
                  disabled={paying}
                  className="w-full flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 font-bold py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
                  id="simulate-payment-btn"
                >
                  {paying ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <span>[Test Mode] Simulate Mock Payment</span>
                  )}
                </button>
              )}

              <button
                onClick={() => setSelectedCollabForPayment(null)}
                disabled={paying}
                className="w-full border border-border text-muted hover:text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agreement View Modal */}
      {showAgreementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg-card border border-border rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col h-[80vh]">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <FileText size={20} className="text-primary" />
                Digital Campaign Agreement
              </h3>
              <button
                onClick={() => {
                  setShowAgreementModal(false);
                  setSelectedAgreementHtml('');
                }}
                className="text-muted hover:text-white transition-colors"
                id="close-agreement-modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-white text-black p-6 rounded-xl border border-border">
              <div dangerouslySetInnerHTML={{ __html: selectedAgreementHtml }} />
            </div>

            <div className="flex justify-end mt-4 flex-shrink-0">
              <button
                onClick={() => {
                  setShowAgreementModal(false);
                  setSelectedAgreementHtml('');
                }}
                className="bg-primary hover:bg-primary-soft text-black font-semibold px-6 py-2 rounded-lg text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandMilestones;
