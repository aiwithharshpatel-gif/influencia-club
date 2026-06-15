import { useState, useEffect } from 'react';
import { FileText, Sparkles, Filter, CheckCircle2, X, AlertTriangle, Plus, HelpCircle, Calendar, MessageSquare, Briefcase, UserPlus } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AdminInquiries = () => {
  const [inquiries, setInquiries] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [updatingInquiry, setUpdatingInquiry] = useState(false);
  const [campaignModalInquiry, setCampaignModalInquiry] = useState(null);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignStartDate, setCampaignStartDate] = useState('');
  const [campaignEndDate, setCampaignEndDate] = useState('');
  const [campaignNotes, setCampaignNotes] = useState('');
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  useEffect(() => {
    fetchInquiries();
  }, [page, status]);

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        status: status || undefined
      };
      const response = await api.get('/admin/inquiries', { params });
      if (response.data.success) {
        setInquiries(response.data.data.inquiries);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching admin inquiries:', error);
      toast.error('Failed to load brand inquiries');
    } finally {
      setLoading(false);
    }
  };

  const fetchCreators = async () => {
    try {
      // Fetch active/approved creators for assignments
      const response = await api.get('/admin/creators', { params: { limit: 100 } });
      if (response.data.success) {
        setCreators(response.data.data.creators);
      }
    } catch (error) {
      console.error('Error fetching creators for assignment:', error);
    }
  };

  const handleUpdateInquiry = async (inquiryId, updates) => {
    try {
      setUpdatingInquiry(true);
      const response = await api.put(`/admin/inquiries/${inquiryId}`, updates);
      if (response.data.success) {
        toast.success('Inquiry updated successfully');
        setInquiries(inquiries.map(inq => inq.id === inquiryId ? { ...inq, ...response.data.inquiry } : inq));
        if (selectedInquiry?.id === inquiryId) {
          setSelectedInquiry({ ...selectedInquiry, ...response.data.inquiry });
        }
      }
    } catch (error) {
      console.error('Error updating inquiry:', error);
      toast.error(error.response?.data?.message || 'Failed to update inquiry');
    } finally {
      setUpdatingInquiry(false);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!campaignModalInquiry) return;
    if (!campaignTitle || !campaignStartDate || !campaignEndDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setCreatingCampaign(true);
      const response = await api.post('/admin/campaigns', {
        brandInquiryId: campaignModalInquiry.id,
        title: campaignTitle,
        startDate: campaignStartDate,
        endDate: campaignEndDate,
        notes: campaignNotes
      });

      if (response.data.success) {
        toast.success('Campaign created successfully');
        // Auto update status to in_progress if it was new
        if (campaignModalInquiry.status === 'new') {
          await handleUpdateInquiry(campaignModalInquiry.id, { status: 'in_progress' });
        }
        closeCampaignModal();
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error(error.response?.data?.message || 'Failed to create campaign');
    } finally {
      setCreatingCampaign(false);
    }
  };

  const openCampaignModal = (inquiry) => {
    setCampaignModalInquiry(inquiry);
    setCampaignTitle(`${inquiry.brandName} Campaign`);
    setCampaignStartDate('');
    setCampaignEndDate('');
    setCampaignNotes('');
  };

  const closeCampaignModal = () => {
    setCampaignModalInquiry(null);
    setCampaignTitle('');
    setCampaignStartDate('');
    setCampaignEndDate('');
    setCampaignNotes('');
  };

  const parseCategories = (categoriesJson) => {
    try {
      if (typeof categoriesJson === 'string') {
        return JSON.parse(categoriesJson);
      }
      if (Array.isArray(categoriesJson)) {
        return categoriesJson;
      }
      return [];
    } catch (e) {
      return [];
    }
  };

  return (
    <div className="space-y-8 pb-10 text-left">
      {/* Header title */}
      <div>
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-2">
          Brand Inquiries <Sparkles size={24} className="text-gold" />
        </h1>
        <p className="text-muted text-sm mt-1">
          Review inbound campaign requests, assign package tiers, match creators, and track collab lifecycles.
        </p>
      </div>

      {/* Filters bar */}
      <div className="bg-bg-card rounded-2xl p-6 border border-border/85 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-primary" />
          <span className="text-white text-xs font-semibold uppercase tracking-wider">Status Filter</span>
        </div>
        <div className="flex gap-2">
          {['', 'new', 'in_progress', 'completed', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                status === s 
                  ? 'bg-primary text-black border-primary' 
                  : 'bg-[#18181b] text-muted border-border hover:text-white'
              }`}
            >
              {s === '' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Inquiry List (col-span-2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-bg-card rounded-2xl border border-border/85 p-6 shadow-lg">
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                <span className="text-muted text-xs">Loading inquiries...</span>
              </div>
            ) : inquiries.length === 0 ? (
              <div className="py-16 text-center text-muted">
                No inquiries found matching the status filter.
              </div>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inq) => {
                  const assigned = creators.find(c => c.id === inq.assignedTo) || inq.assignedCreator;
                  return (
                    <div
                      key={inq.id}
                      onClick={() => setSelectedInquiry(inq)}
                      className={`p-5 rounded-xl border transition-all cursor-pointer text-left ${
                        selectedInquiry?.id === inq.id
                          ? 'bg-white/5 border-gold shadow-gold-sm'
                          : 'bg-[#161618] border-border/60 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-display font-bold text-white text-base">{inq.brandName}</h3>
                          <p className="text-muted text-[11px] mt-0.5">Submitted: {new Date(inq.createdAt).toLocaleString()}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          inq.status === 'new'
                            ? 'bg-blue-400/10 text-blue-400 border border-blue-400/20'
                            : inq.status === 'in_progress'
                            ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                            : inq.status === 'completed'
                            ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                            : 'bg-red-400/10 text-red-400 border border-red-400/20'
                        }`}>
                          {inq.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 text-xs text-[#a1a1aa]">
                        <div>
                          <span className="text-[10px] text-muted uppercase tracking-wider block font-medium">Budget Range</span>
                          <span className="text-white font-semibold mt-0.5 block">{inq.budgetRange}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted uppercase tracking-wider block font-medium">Package Tier</span>
                          <span className="text-white font-semibold capitalize mt-0.5 block">
                            {inq.packageType || <span className="text-muted italic font-normal text-[11px]">Unassigned</span>}
                          </span>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                          <span className="text-[10px] text-muted uppercase tracking-wider block font-medium">Assigned Creator</span>
                          <span className="text-white font-semibold mt-0.5 block truncate">
                            {assigned?.name ? assigned.name : <span className="text-muted italic font-normal text-[11px]">Unassigned</span>}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/30 flex flex-wrap gap-1">
                        {parseCategories(inq.categories).map((cat, i) => (
                          <span key={i} className="px-2 py-0.5 bg-white/5 border border-border/50 text-muted rounded text-[10px] capitalize">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border/30 pt-6 mt-6">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="px-4 py-2 bg-white/5 border border-border hover:bg-white/10 rounded-xl text-xs text-white font-semibold disabled:opacity-40 transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-muted">Page {page} of {totalPages}</span>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                      className="px-4 py-2 bg-white/5 border border-border hover:bg-white/10 rounded-xl text-xs text-white font-semibold disabled:opacity-40 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Panel / Inquiry Details (col-span-1) */}
        <div className="space-y-6">
          <div className="bg-bg-card rounded-2xl border border-border/85 p-6 shadow-lg text-left">
            <h3 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Briefcase size={18} className="text-primary" />
              <span>Inquiry Details</span>
            </h3>

            {!selectedInquiry ? (
              <div className="py-12 text-center text-muted text-xs border border-dashed border-border/50 rounded-xl">
                Select a brand inquiry from the directory to configure assignment details and collaboration status.
              </div>
            ) : (
              <div className="space-y-6 text-xs text-[#a1a1aa]">
                <div>
                  <h4 className="text-sm font-bold text-white font-display mb-1">{selectedInquiry.brandName}</h4>
                  <div className="space-y-1">
                    <p><span className="text-muted">Email:</span> <a href={`mailto:${selectedInquiry.email}`} className="text-gold hover:underline">{selectedInquiry.email}</a></p>
                    <p><span className="text-muted">Mobile:</span> {selectedInquiry.mobile}</p>
                    <p><span className="text-muted">Budget:</span> {selectedInquiry.budgetRange}</p>
                  </div>
                </div>

                <div className="bg-[#18181b] border border-border/60 rounded-xl p-3.5 space-y-2">
                  <span className="text-[10px] text-muted uppercase tracking-wider block font-bold">Brand Message</span>
                  <p className="text-white leading-relaxed whitespace-pre-wrap">{selectedInquiry.message}</p>
                </div>

                {/* Dropdowns to manage inquiry details */}
                <div className="space-y-4">
                  {/* Status Dropdown */}
                  <div>
                    <label htmlFor="inq_status_select" className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5">
                      Collaboration Status
                    </label>
                    <select
                      id="inq_status_select"
                      value={selectedInquiry.status}
                      disabled={updatingInquiry}
                      onChange={(e) => handleUpdateInquiry(selectedInquiry.id, { status: e.target.value })}
                      className="w-full bg-black border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold disabled:opacity-50"
                    >
                      <option value="new">New / Received</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected / Closed</option>
                    </select>
                  </div>

                  {/* Package Type Dropdown */}
                  <div>
                    <label htmlFor="inq_package_select" className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5">
                      Package Tier
                    </label>
                    <select
                      id="inq_package_select"
                      value={selectedInquiry.packageType || ''}
                      disabled={updatingInquiry}
                      onChange={(e) => handleUpdateInquiry(selectedInquiry.id, { packageType: e.target.value || null })}
                      className="w-full bg-black border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold disabled:opacity-50"
                    >
                      <option value="">Unassigned</option>
                      <option value="basic">Basic (Club Access)</option>
                      <option value="growth">Growth (Custom Matching)</option>
                      <option value="premium">Premium (Dedicated Campaign)</option>
                    </select>
                  </div>

                  {/* Assigned Creator Select */}
                  <div>
                    <label htmlFor="inq_creator_select" className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5">
                      Assigned Creator Match
                    </label>
                    <select
                      id="inq_creator_select"
                      value={selectedInquiry.assignedTo || ''}
                      disabled={updatingInquiry}
                      onChange={(e) => handleUpdateInquiry(selectedInquiry.id, { assignedTo: e.target.value || null })}
                      className="w-full bg-black border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold disabled:opacity-50"
                    >
                      <option value="">Not Assigned</option>
                      {creators.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (@{c.instagram})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Campaign Action Button */}
                <div className="pt-2 border-t border-border/30">
                  <button
                    onClick={() => openCampaignModal(selectedInquiry)}
                    className="w-full bg-primary hover:bg-primary-soft text-black py-2.5 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(212,175,55,0.1)] flex items-center justify-center gap-1.5 text-xs"
                  >
                    <Plus size={14} className="stroke-[2.5]" />
                    <span>Create Campaign Workspace</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Builder Modal */}
      {campaignModalInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden">
            <button 
              onClick={closeCampaignModal}
              className="absolute top-4 right-4 text-muted hover:text-white"
            >
              <X size={18} />
            </button>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-left">
              <div className="text-center pb-2 border-b border-border/30">
                <Calendar size={28} className="text-gold mx-auto mb-2" />
                <h3 className="text-white text-base font-bold">Launch Campaign Workspace</h3>
                <p className="text-xs text-muted mt-0.5">Initialize a milestone tracking workflow for {campaignModalInquiry.brandName}</p>
              </div>

              <div>
                <label htmlFor="campaign_title" className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  id="campaign_title"
                  required
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  className="w-full bg-black border border-border rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-gold"
                  placeholder="E.g., Summer Launch Collab"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="campaign_start" className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    id="campaign_start"
                    required
                    value={campaignStartDate}
                    onChange={(e) => setCampaignStartDate(e.target.value)}
                    className="w-full bg-black border border-border rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label htmlFor="campaign_end" className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    id="campaign_end"
                    required
                    value={campaignEndDate}
                    onChange={(e) => setCampaignEndDate(e.target.value)}
                    className="w-full bg-black border border-border rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="campaign_notes" className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Internal Notes & Deliverables (Optional)
                </label>
                <textarea
                  id="campaign_notes"
                  rows="3"
                  value={campaignNotes}
                  onChange={(e) => setCampaignNotes(e.target.value)}
                  className="w-full bg-black border border-border rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-gold resize-none"
                  placeholder="Outline client expectations, milestones budget details, and scope..."
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeCampaignModal}
                  className="flex-1 py-2.5 bg-white/5 border border-border text-white rounded-xl text-xs font-semibold hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCampaign}
                  className="flex-1 py-2.5 bg-primary text-black rounded-xl text-xs font-bold hover:bg-primary-soft transition-colors"
                >
                  {creatingCampaign ? 'Launching...' : 'Initialize Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInquiries;
