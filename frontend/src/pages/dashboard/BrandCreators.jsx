import { useState, useEffect } from 'react';
import { Search, MapPin, Users, Sparkles, Filter, Mail, CheckCircle2, X, Bell, Eye, Heart, MessageCircle, TrendingUp, Calendar, Hash } from 'lucide-react';
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
  const [useSemantic, setUseSemantic] = useState(false);
  
  // Modals state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [selectedCreatorDetails, setSelectedCreatorDetails] = useState(null);
  const [detailsTab, setDetailsTab] = useState('instagram'); // 'instagram' | 'general'
  
  const [selectedInquiryId, setSelectedInquiryId] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchCreators();
  }, [category, city, useSemantic]);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      const params = {};
      if (category) params.category = category;
      if (city) params.city = city;
      if (search.trim()) params.search = search;
      if (useSemantic) params.useSemantic = true;

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

  const openDetailsModal = (creator) => {
    setSelectedCreatorDetails(creator);
    setIsDetailsModalOpen(true);
    setDetailsTab(creator.instagramProfile ? 'instagram' : 'general');
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedCreatorDetails(null);
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
      <div className="bg-bg-card rounded-2xl p-6 border border-border/85 shadow-lg space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid sm:grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={useSemantic ? "Enter natural language request (e.g. skin routine creators in Ahmedabad)..." : "Search creator name, bio, instagram handle..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-bg border border-border rounded-xl pl-11 pr-24 py-3.5 text-white placeholder-muted focus:outline-none focus:border-gold transition-colors text-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              
              {/* Sparks AI Search toggle button */}
              <button
                type="button"
                onClick={() => setUseSemantic(!useSemantic)}
                className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                  useSemantic
                    ? 'bg-gradient-to-r from-[#d4af37] to-yellow-600 text-black shadow-[0_0_10px_rgba(212,175,55,0.25)]'
                    : 'bg-bg hover:bg-border/30 text-muted hover:text-white border border-border'
                }`}
              >
                <Sparkles size={12} className={useSemantic ? "animate-pulse" : ""} />
                <span>AI Search</span>
              </button>
            </div>
            
            <button
              type="submit"
              className="bg-primary hover:bg-primary-soft text-black px-6 py-3.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(212,175,55,0.1)] shrink-0"
            >
              Search
            </button>
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
        
        {useSemantic && (
          <div className="text-[11px] text-[#fafafa] flex items-center space-x-1.5 bg-gold/5 border border-gold/10 px-3 py-2 rounded-xl">
            <Sparkles size={14} className="text-gold animate-pulse" />
            <span>AI Semantic Search enabled: results are ranked conceptually by content relevance similarity.</span>
          </div>
        )}
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
            Try adjusting your search terms or toggle off AI Search.
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
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-start justify-between">
                      <h3 className="font-display text-base font-semibold text-white truncate flex items-center gap-1">
                        {creator.name}
                        {creator.isVerified && <CheckCircle2 size={14} className="text-gold fill-gold/10" />}
                      </h3>
                      {creator.matchPercentage && (
                        <span className="bg-gold/10 text-gold border border-gold/25 px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 flex items-center">
                          <Sparkles size={9} className="mr-0.5 animate-pulse" />
                          {creator.matchPercentage}
                        </span>
                      )}
                    </div>
                    <p className="text-gold text-xs font-medium truncate">
                      @{creator.instagram}
                    </p>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-muted text-xs line-clamp-3 leading-relaxed text-left">
                  {creator.bio || "No bio description provided."}
                </p>

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-xs">
                  <div className="flex items-center space-x-1.5 text-muted justify-start">
                    <Users size={14} className="text-gold/80" />
                    <span>{creator.followerCount || 'N/A'} followers</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-muted justify-start">
                    <MapPin size={14} className="text-gold/80" />
                    <span className="truncate">{creator.city}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 pt-0 flex gap-2">
                <button
                  onClick={() => openDetailsModal(creator)}
                  className="flex-1 border border-border hover:bg-white/5 text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition-all"
                >
                  <Eye size={13} />
                  <span>View Stats</span>
                </button>
                <button
                  onClick={() => openInviteModal(creator)}
                  className="flex-1 bg-primary hover:bg-primary-soft text-black py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition-all"
                >
                  <Mail size={13} />
                  <span>Invite</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creator Details Stats Modal */}
      {isDetailsModalOpen && selectedCreatorDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
            {/* Close */}
            <button
              onClick={closeDetailsModal}
              className="absolute top-4 right-4 p-1 bg-[#27272a]/50 hover:bg-[#27272a] text-muted hover:text-white rounded-lg transition-colors z-10"
            >
              <X size={18} />
            </button>

            {/* Profile Header */}
            <div className="p-6 bg-gradient-to-b from-[#27272a]/20 to-transparent border-b border-[#27272a]/40 flex items-center space-x-4 text-left">
              {selectedCreatorDetails.photoUrl ? (
                <img
                  src={selectedCreatorDetails.photoUrl}
                  alt={selectedCreatorDetails.name}
                  className="w-16 h-16 rounded-full object-cover border border-[#27272a]"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-purple-glow flex items-center justify-center text-white font-bold text-xl border border-[#27272a]">
                  {selectedCreatorDetails.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-display text-xl font-bold text-white flex items-center gap-1.5">
                  {selectedCreatorDetails.name}
                  {selectedCreatorDetails.isVerified && <CheckCircle2 size={16} className="text-gold" />}
                </h3>
                <p className="text-gold text-sm font-semibold">@{selectedCreatorDetails.instagram}</p>
                <div className="flex items-center space-x-2 mt-1.5 text-xs text-[#a1a1aa]">
                  <span className="capitalize">{selectedCreatorDetails.category}</span>
                  <span>•</span>
                  <span>{selectedCreatorDetails.city}</span>
                </div>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="flex px-6 border-b border-[#27272a]/40 bg-[#09090b]/30">
              <button
                onClick={() => setDetailsTab('instagram')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
                  detailsTab === 'instagram'
                    ? 'border-gold text-gold'
                    : 'border-transparent text-[#a1a1aa] hover:text-white'
                }`}
              >
                <Instagram size={14} />
                <span>Instagram Analytics</span>
              </button>
              <button
                onClick={() => setDetailsTab('general')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
                  detailsTab === 'general'
                    ? 'border-gold text-gold'
                    : 'border-transparent text-[#a1a1aa] hover:text-white'
                }`}
              >
                <Hash size={14} />
                <span>Bio & General</span>
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailsTab === 'instagram' ? (
                selectedCreatorDetails.instagramProfile ? (
                  <div className="space-y-6">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-[#09090b]/40 border border-[#27272a] p-4 rounded-xl flex flex-col items-center justify-center">
                        <span className="text-[#a1a1aa] text-[10px] uppercase font-bold tracking-wider mb-1">Followers</span>
                        <span className="text-white text-base font-bold">
                          {selectedCreatorDetails.instagramProfile.followersCount?.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-[#09090b]/40 border border-[#27272a] p-4 rounded-xl flex flex-col items-center justify-center">
                        <span className="text-[#a1a1aa] text-[10px] uppercase font-bold tracking-wider mb-1">Engagement</span>
                        <span className="text-primary text-base font-bold flex items-center">
                          <TrendingUp size={14} className="mr-0.5 text-[#d4af37]" />
                          {selectedCreatorDetails.instagramProfile.engagementRate}%
                        </span>
                      </div>
                      <div className="bg-[#09090b]/40 border border-[#27272a] p-4 rounded-xl flex flex-col items-center justify-center">
                        <span className="text-[#a1a1aa] text-[10px] uppercase font-bold tracking-wider mb-1">Avg Likes</span>
                        <span className="text-white text-base font-bold flex items-center">
                          <Heart size={14} className="mr-0.5 text-red-500 fill-red-500/20" />
                          {selectedCreatorDetails.instagramProfile.avgLikes?.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-[#09090b]/40 border border-[#27272a] p-4 rounded-xl flex flex-col items-center justify-center">
                        <span className="text-[#a1a1aa] text-[10px] uppercase font-bold tracking-wider mb-1">Avg Comments</span>
                        <span className="text-white text-base font-bold flex items-center">
                          <MessageCircle size={14} className="mr-0.5 text-blue-400" />
                          {selectedCreatorDetails.instagramProfile.avgComments?.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Recent Feed grid */}
                    <div className="space-y-3">
                      <h4 className="text-white text-xs font-semibold uppercase tracking-wider text-left">
                        Recent Feed Posts
                      </h4>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {(() => {
                          let posts = [];
                          try {
                            posts = typeof selectedCreatorDetails.instagramProfile.recentPosts === 'string'
                              ? JSON.parse(selectedCreatorDetails.instagramProfile.recentPosts)
                              : selectedCreatorDetails.instagramProfile.recentPosts;
                          } catch (e) {
                            posts = [];
                          }
                          return posts && posts.length > 0 ? (
                            posts.map((post) => (
                              <a
                                key={post.id}
                                href={post.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative aspect-square border border-[#27272a] rounded-lg overflow-hidden bg-[#09090b]/20"
                              >
                                <img
                                  src={post.mediaUrl}
                                  alt={post.caption || 'Instagram Post'}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-2 text-center">
                                  <p className="text-[8px] text-[#a1a1aa] line-clamp-2 mb-1.5 px-0.5">{post.caption}</p>
                                  <div className="flex items-center space-x-2 text-[10px] font-bold">
                                    <span className="text-red-500 flex items-center">
                                      <Heart size={9} className="mr-0.5 fill-red-500" />
                                      {post.likeCount >= 1000 ? `${(post.likeCount / 1000).toFixed(1)}k` : post.likeCount}
                                    </span>
                                    <span className="text-blue-400 flex items-center">
                                      <MessageCircle size={9} className="mr-0.5 fill-blue-400/20" />
                                      {post.commentsCount}
                                    </span>
                                  </div>
                                </div>
                              </a>
                            ))
                          ) : (
                            <p className="text-[#a1a1aa] text-xs py-4 col-span-full">No recent posts found.</p>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 border border-dashed border-[#27272a] rounded-xl flex flex-col items-center justify-center space-y-2">
                    <Instagram size={36} className="text-[#a1a1aa]" />
                    <h5 className="text-white text-sm font-semibold">Instagram Profile Not Connected</h5>
                    <p className="text-muted text-xs max-w-xs text-center">
                      This creator hasn't linked their Professional Instagram account to Influenzia Club yet.
                    </p>
                  </div>
                )
              ) : (
                <div className="space-y-4 text-left">
                  <div>
                    <h5 className="text-white text-xs font-semibold uppercase tracking-wider mb-1.5">Bio Description</h5>
                    <p className="text-[#a1a1aa] text-sm leading-relaxed bg-[#09090b]/20 border border-[#27272a] p-4 rounded-xl">
                      {selectedCreatorDetails.bio || "No description provided."}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#09090b]/20 border border-[#27272a] p-4 rounded-xl">
                      <span className="text-[#a1a1aa] text-[10px] uppercase font-bold tracking-wider block mb-1">Marketplace Category</span>
                      <span className="text-white text-sm font-semibold capitalize">{selectedCreatorDetails.category}</span>
                    </div>
                    <div className="bg-[#09090b]/20 border border-[#27272a] p-4 rounded-xl">
                      <span className="text-[#a1a1aa] text-[10px] uppercase font-bold tracking-wider block mb-1">Base Location</span>
                      <span className="text-white text-sm font-semibold">{selectedCreatorDetails.city}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#27272a]/40 bg-[#09090b]/20 flex justify-end space-x-3">
              <button
                onClick={closeDetailsModal}
                className="px-5 py-2.5 rounded-xl border border-[#27272a] hover:bg-white/5 text-white text-xs font-semibold transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  closeDetailsModal();
                  openInviteModal(selectedCreatorDetails);
                }}
                className="bg-primary hover:bg-primary-soft text-black px-6 py-2.5 rounded-xl text-xs font-bold transition-all"
              >
                Invite to Campaign
              </button>
            </div>
          </div>
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
