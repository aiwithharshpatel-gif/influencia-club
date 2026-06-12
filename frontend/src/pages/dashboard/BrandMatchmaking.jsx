import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, CheckCircle2, Star, MailOpen, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import SkeletonCard from '../../components/SkeletonCard';

const BrandMatchmaking = () => {
  const { id } = useParams();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invitingId, setInvitingId] = useState(null);

  useEffect(() => {
    fetchMatches();
  }, [id]);

  const fetchMatches = async () => {
    try {
      const response = await api.get(`/brand/inquiries/${id}/matches`);
      if (response.data.success) {
        setMatches(response.data.matches);
      }
    } catch (error) {
      console.error('Error fetching creator matches:', error);
      toast.error('Failed to load matchmaking suggestions');
    } finally {
      setLoading(false);
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
        // Update local state to reflect invitation
        setMatches(prev => 
          prev.map(m => m.id === creatorId ? { ...m, inviteStatus: 'invited' } : m)
        );
      } else {
        toast.error(response.message || 'Invitation failed');
      }
    } catch (error) {
      console.error('Error inviting creator:', error);
      toast.error(error.response?.data?.message || 'Failed to send invite');
    } finally {
      setInvitingId(null);
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
    <div>
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link to="/brand/dashboard" className="w-10 h-10 bg-bg-card border border-border rounded-lg flex items-center justify-center text-muted hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <span className="text-xs text-primary font-bold uppercase tracking-wider flex items-center">
            <Sparkles size={12} className="mr-1 text-primary animate-pulse" />
            AI Matchmaker
          </span>
          <h1 className="font-display text-2xl font-bold text-white">
            Creator Recommendations
          </h1>
        </div>
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
              {/* Score Badge */}
              <div className="absolute top-4 right-4 bg-primary/20 border border-primary/40 text-primary px-3 py-1 rounded-full text-xs font-bold font-display flex items-center">
                <Sparkles size={12} className="mr-1.5 animate-pulse" />
                {creator.matchPercentage} Match
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
  );
};

export default BrandMatchmaking;
