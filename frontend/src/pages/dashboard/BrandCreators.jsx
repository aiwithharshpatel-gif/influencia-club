import { useState, useEffect } from 'react';
import { Search, MapPin, Users, Sparkles, Filter, Mail, CheckCircle2, X } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import SkeletonCard from '../../components/SkeletonCard';

const BrandCreators = () => {
  const [creators, setCreators] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  
  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [selectedInquiryId, setSelectedInquiryId] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchCreators();
    fetchInquiries();
  }, [category, city]);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      const params = {};
      if (category) params.category = category;
      if (city) params.city = city;
      if (search.trim()) params.search = search;

      const response = await api.get('/brand/creators', { params });
      if (response.data.success) {
        setCreators(response.data.creators);
      }
    } catch (error) {
      console.error('Error fetching marketplace creators:', error);
      toast.error('Failed to load creators directory');
    } finally {
      setLoading(false);
    }
  };

  const fetchInquiries = async () => {
    try {
      const response = await api.get('/brand/inquiries');
      if (response.data.success) {
        setInquiries(response.data.inquiries);
      }
    } catch (error) {
      console.error('Error fetching brand inquiries:', error);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCreators();
  };

  const openInviteModal = (creator) => {
    setSelectedCreator(creator);
    setIsInviteModalOpen(true);
    // Auto-select first inquiry if available
    if (inquiries.length > 0) {
      setSelectedInquiryId(inquiries[0].id);
    }
  };

  const closeInviteModal = () => {
    setIsInviteModalOpen(false);
    setSelectedCreator(null);
    setSelectedInquiryId('');
    setDeliverables('');
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInquiryId) {
      toast.error('Please select a campaign to invite this creator to');
      return;
    }

    try {
      setInviting(true);
      const response = await api.post(`/brand/inquiries/${selectedInquiryId}/invite`, {
        creatorId: selectedCreator.id,
        deliverables: deliverables || 'Deliverables to be negotiated'
      });

      if (response.data.success) {
        toast.success(`Invitation sent successfully to ${selectedCreator.name}!`);
        closeInviteModal();
      } else {
        toast.error(response.data.message || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error inviting creator:', error);
      toast.error(error.response?.data?.message || 'Failed to invite creator');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white flex items-center gap-2">
            Creator Marketplace <Sparkles size={24} className="text-gold" />
          </h1>
          <p className="text-muted text-sm mt-1">
            Discover, filter, and invite elite creators to collaborate on your campaigns.
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-bg-card rounded-2xl p-6 border border-border/85 shadow-lg">
        <form onSubmit={handleSearchSubmit} className="grid sm:grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <input
              type="text"
              placeholder="Search creator name, bio, instagram handle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-muted focus:outline-none focus:border-gold transition-colors text-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          </div>

          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-gold transition-colors text-sm capitalize"
            >
              <option value="">All Categories</option>
              <option value="influencer">influencer</option>
              <option value="actor">actor</option>
              <option value="model">model</option>
              <option value="creator">creator</option>
              <option value="public_figure">public figure</option>
            </select>
          </div>

          <div>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-gold transition-colors text-sm"
            >
              <option value="">All Cities</option>
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Pune">Pune</option>
            </select>
          </div>
        </form>
      </div>

      {/* Creators Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard variant="card" count={6} />
        </div>
      ) : creators.length === 0 ? (
        <div className="bg-bg-card rounded-2xl p-12 border border-border text-center">
          <div className="w-16 h-16 bg-purple-glow/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter size={32} className="text-gold" />
          </div>
          <h3 className="font-display text-xl font-bold text-white mb-2">No Creators Found</h3>
          <p className="text-muted text-sm max-w-md mx-auto">
            Try adjusting your search terms or filters to find creators in the directory.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {creators.map((creator) => (
            <div
              key={creator.id}
              className="bg-bg-card rounded-2xl border border-border/60 overflow-hidden hover:border-gold/30 hover:shadow-[0_0_20px_rgba(212,175,55,0.05)] transition-all flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  {creator.photoUrl ? (
                    <img
                      src={creator.photoUrl}
                      alt={creator.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-gold/20"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-purple-glow flex items-center justify-center text-white font-bold text-lg border-2 border-gold/20">
                      {creator.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-base font-semibold text-white truncate flex items-center gap-1">
                      {creator.name}
                      {creator.isVerified && <CheckCircle2 size={14} className="text-gold fill-gold/10" />}
                    </h3>
                    <p className="text-gold text-xs font-medium truncate">
                      @{creator.instagram}
                    </p>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-muted text-xs line-clamp-3 leading-relaxed">
                  {creator.bio || "No bio description provided."}
                </p>

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-xs">
                  <div className="flex items-center space-x-1.5 text-muted">
                    <Users size={14} className="text-gold/80" />
                    <span>{creator.followerCount || 'N/A'} followers</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-muted">
                    <MapPin size={14} className="text-gold/80" />
                    <span className="truncate">{creator.city}</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="px-6 pb-6 pt-0">
                <button
                  onClick={() => openInviteModal(creator)}
                  className="w-full btn-primary py-2.5 text-xs tracking-wider uppercase font-semibold flex items-center justify-center space-x-2"
                >
                  <Mail size={14} />
                  <span>Invite to Campaign</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && selectedCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-card rounded-2xl w-full max-w-lg border border-border shadow-2xl relative overflow-hidden">
            <button
              onClick={closeInviteModal}
              className="absolute top-4 right-4 text-muted hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <form onSubmit={handleInviteSubmit} className="p-6 md:p-8 space-y-6">
              <div className="text-center">
                <h3 className="font-display text-2xl font-bold text-white mb-2">
                  Invite Creator
                </h3>
                <p className="text-muted text-sm">
                  Send a collaboration request to <span className="text-gold font-medium">@{selectedCreator.instagram}</span>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Select Campaign Brief
                  </label>
                  {inquiries.length === 0 ? (
                    <div className="text-red-400 text-sm py-2">
                      You need to submit a campaign request on the Brands page first before inviting.
                    </div>
                  ) : (
                    <select
                      value={selectedInquiryId}
                      onChange={(e) => setSelectedInquiryId(e.target.value)}
                      className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold transition-colors"
                    >
                      {inquiries.map((inq) => (
                        <option key={inq.id} value={inq.id}>
                          {inq.brandName} - {inq.budgetRange} ({new Date(inq.createdAt).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Deliverables & Notes (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={deliverables}
                    onChange={(e) => setDeliverables(e.target.value)}
                    placeholder="E.g., 2 Instagram Reels, 3 Stories. Deliverables can be discussed during negotiations."
                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold transition-colors placeholder-muted"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={closeInviteModal}
                  className="flex-1 py-3 px-4 rounded-xl border border-border text-white text-sm font-semibold hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting || inquiries.length === 0}
                  className="flex-1 btn-primary py-3 px-4 rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {inviting ? 'Sending Request...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandCreators;
