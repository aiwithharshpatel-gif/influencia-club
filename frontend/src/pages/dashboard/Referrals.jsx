import { useState, useEffect } from 'react';
import { Copy, Share2, TrendingUp, Award, Users, Star } from 'lucide-react';
import api from '../../utils/api';
import ReferralWidget from '../../components/ReferralWidget';

const Referrals = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const response = await api.get('/dashboard/referrals');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
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
      <h1 className="font-display text-3xl font-bold text-white mb-8">
        Refer & Earn
      </h1>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-glow/20 rounded-lg flex items-center justify-center">
              <Users size={24} className="text-primary" />
            </div>
          </div>
          <div className="text-3xl font-display font-bold text-white mb-1">
            {data?.totalReferrals || 0}
          </div>
          <div className="text-muted text-sm">Total Referrals</div>
        </div>

        <div className="bg-bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center">
              <Award size={24} className="text-gold" />
            </div>
          </div>
          <div className="text-3xl font-display font-bold text-gold mb-1">
            {data?.totalPointsEarned || 0}
          </div>
          <div className="text-muted text-sm">Points Earned</div>
        </div>

        <div className="bg-bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp size={24} className="text-green-400" />
            </div>
          </div>
          <div className="text-3xl font-display font-bold text-green-400 mb-1">
            {data?.referrals?.filter(r => r.status === 'confirmed').length || 0}
          </div>
          <div className="text-muted text-sm">Confirmed</div>
        </div>
      </div>

      {/* Referral Widget */}
      {data?.referralCode && (
        <div className="mb-8">
          <ReferralWidget referralCode={data.referralCode} />
        </div>
      )}

      {/* Referral List */}
      <div className="bg-bg-card rounded-xl p-6 border border-border">
        <h2 className="font-display text-xl font-bold text-white mb-4">
          Your Referrals
        </h2>

        {data?.referrals?.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <p>No referrals yet</p>
            <p className="text-sm mt-2">Share your referral link to start earning points!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.referrals?.map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between p-4 bg-bg rounded-lg"
              >
                <div>
                  <div className="font-medium text-white">{referral.referredUser.name}</div>
                  <div className="text-sm text-muted">
                    Joined {new Date(referral.referredUser.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  referral.status === 'confirmed'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {referral.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Referrals;
