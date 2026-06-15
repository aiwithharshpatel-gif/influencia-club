import { useState, useEffect } from 'react';
import { Award, Gift, Instagram, Ticket, Briefcase, CheckCircle, Trophy, TrendingUp, Sparkles, Clock, Crown, ArrowUpRight, Lock, RefreshCw } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Points = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Payout states
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' or 'payout'
  const [payouts, setPayouts] = useState([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [checkingPayout, setCheckingPayout] = useState({});

  const checkStatus = async (payoutId) => {
    setCheckingPayout(prev => ({ ...prev, [payoutId]: true }));
    const toastId = toast.loading('Checking live status...');
    try {
      const response = await api.get(`/payments/payout/${payoutId}/status`);
      if (response.data.success) {
        const updatedStatus = response.data.payout.status;
        toast.success(`Payout status: ${updatedStatus.toUpperCase()}`, { id: toastId });
        
        setPayouts(prev =>
          prev.map(p => p.id === payoutId ? { ...p, status: updatedStatus } : p)
        );
        
        if (updatedStatus === 'completed' || updatedStatus === 'failed') {
          fetchMarketplaceData();
        }
      } else {
        toast.error('Failed to retrieve status update', { id: toastId });
      }
    } catch (error) {
      console.error('Error checking payout status:', error);
      toast.error('Error fetching status', { id: toastId });
    } finally {
      setCheckingPayout(prev => ({ ...prev, [payoutId]: false }));
    }
  };

  useEffect(() => {
    fetchMarketplaceData();
    fetchPayouts();
  }, []);

  const fetchMarketplaceData = async () => {
    try {
      const response = await api.get('/rewards/marketplace');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching marketplace data:', error);
      setErrorMsg('Failed to load marketplace data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayouts = async () => {
    try {
      setLoadingPayouts(true);
      const response = await api.get('/payments/payouts');
      if (response.data.success) {
        setPayouts(response.data.payouts);
      }
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoadingPayouts(false);
    }
  };

  const handlePayoutRequest = async (e) => {
    e.preventDefault();

    const amt = Number(payoutAmount);
    if (!amt || amt < 100) {
      setErrorMsg('Minimum payout is 100 points');
      return;
    }

    if (amt > creator?.pointsBalance) {
      setErrorMsg('Insufficient points balance');
      return;
    }

    const upiPattern = /^[\w.-]+@[\w.-]+$/;
    if (!upiPattern.test(upiId)) {
      setErrorMsg('Please enter a valid UPI ID (e.g., username@bank)');
      return;
    }

    try {
      setPayoutSubmitting(true);
      setErrorMsg('');
      setSuccess(false);

      const response = await api.post('/payments/payout', {
        amount: amt,
        upiId
      });

      if (response.data.success) {
        setSuccessMsg(response.data.message || 'Payout request submitted successfully!');
        setSuccess(true);
        setPayoutAmount('');
        setUpiId('');
        
        await fetchMarketplaceData();
        await fetchPayouts();
        
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Payout request failed. Please try again.');
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const handleRedeem = async (rewardType) => {
    try {
      setSubmitting(true);
      setErrorMsg('');
      setSuccess(false);

      const response = await api.post('/rewards/redeem', { rewardType });
      if (response.data.success) {
        setSuccessMsg(response.data.message || 'Redemption request submitted successfully!');
        setSuccess(true);
        await fetchMarketplaceData();
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Redemption failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500" />
        <p className="text-muted text-sm font-medium animate-pulse">Loading Points Marketplace...</p>
      </div>
    );
  }

  const { creator, progression, leaderboard, redemptions, catalog } = data || {};

  // Icons mapper for catalog rewards
  const getRewardIcon = (type) => {
    switch (type) {
      case 'featured': return Gift;
      case 'ig_promo': return Instagram;
      case 'collab_priority': return Briefcase;
      case 'event_entry': return Ticket;
      default: return Award;
    }
  };

  // Tier styling mapper
  const getTierStyles = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'platinum':
        return {
          bg: 'bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 border-indigo-500/30',
          text: 'text-indigo-400',
          badge: 'bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 font-bold',
          glow: 'shadow-[0_0_25px_-5px_rgba(99,102,241,0.3)]',
          barColor: 'from-indigo-500 to-cyan-400'
        };
      case 'gold':
        return {
          bg: 'bg-gradient-to-br from-amber-950/80 via-slate-900 to-yellow-950/40 border-amber-500/30',
          text: 'text-amber-400',
          badge: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold',
          glow: 'shadow-[0_0_25px_-5px_rgba(245,158,11,0.3)]',
          barColor: 'from-amber-500 to-yellow-400'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-slate-700/50',
          text: 'text-slate-400',
          badge: 'bg-gradient-to-r from-slate-400 to-slate-200 text-slate-950 font-semibold',
          glow: '',
          barColor: 'from-slate-400 to-slate-300'
        };
    }
  };

  const currentTierStyles = getTierStyles(creator?.tier);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Points Marketplace <Sparkles className="text-yellow-400 animate-pulse" size={28} />
          </h1>
          <p className="text-muted mt-1">
            Redeem rewards, view your tier progress, and check where you stand on the leaderboard.
          </p>
        </div>
      </div>

      {/* Alert Notifications */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-5 py-4 rounded-xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle size={22} className="flex-shrink-0" />
          <span className="font-medium text-sm">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-5 py-4 rounded-xl flex items-center gap-3 animate-fadeIn">
          <Lock size={22} className="flex-shrink-0" />
          <span className="font-medium text-sm">{errorMsg}</span>
        </div>
      )}

      {/* Top Section: Tier Progress & Stats */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tier Card */}
        <div className={`lg:col-span-2 rounded-2xl border p-8 flex flex-col justify-between transition-all duration-300 ${currentTierStyles.bg} ${currentTierStyles.glow}`}>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-muted font-bold">Current Tier</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-4 py-1 rounded-full text-xs uppercase ${currentTierStyles.badge}`}>
                  {creator?.tier}
                </span>
                {creator?.tier === 'platinum' && <Crown className="text-yellow-400 fill-yellow-400 animate-bounce" size={20} />}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase tracking-wider text-muted font-bold">Available Balance</span>
              <div className="text-4xl font-display font-black text-white mt-1 flex items-baseline justify-end gap-1">
                {creator?.pointsBalance} <span className="text-lg font-bold text-muted">pts</span>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted font-medium">
                Lifetime Points: <strong className="text-white">{progression?.lifetimePoints} pts</strong>
              </span>
              {progression?.nextTier !== 'max' ? (
                <span className="text-white/80 font-semibold flex items-center gap-1">
                  Next Tier: <span className="text-purple-400 uppercase font-extrabold">{progression?.nextTier}</span> ({progression?.pointsNeeded} pts needed)
                </span>
              ) : (
                <span className="text-yellow-400 font-bold flex items-center gap-1">
                  <Crown size={16} /> Maximum Tier Reached
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-white/5">
              <div
                className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${currentTierStyles.barColor} transition-all duration-1000 ease-out`}
                style={{ width: `${progression?.progressPercent}%` }}
              />
            </div>

            {progression?.nextTier !== 'max' && (
              <div className="flex justify-between text-xs text-muted">
                <span>{progression?.currentTierMin} pts</span>
                <span>{progression?.nextTierMin} pts</span>
              </div>
            )}
          </div>
        </div>

        {/* Highlight Stats Info */}
        <div className="bg-bg-card border border-border rounded-2xl p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-primary">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Gamified Milestones</h3>
                <p className="text-xs text-muted">Tiers are locked to your lifetime earnings.</p>
              </div>
            </div>
            <div className="border-t border-border/50 my-2" />
            <p className="text-sm text-muted leading-relaxed">
              Your tier is calculated based on lifetime earned points (<span className="text-white font-semibold">type: earn</span>).
              Redeeming points for rewards will decrease your <span className="text-white">Available Balance</span>, but your <span className="text-white">Tier Progress</span> will remain untouched.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-border/30 rounded-xl p-3 text-xs text-center text-muted flex items-center justify-center gap-2 mt-4">
            <Award size={14} className="text-primary" />
            <span>Silver: &lt; 200 | Gold: 200+ | Platinum: 500+</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 border-b border-border/40 pb-3" id="points-tab-navigation">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`font-display font-bold text-lg pb-1 border-b-2 transition-all ${
            activeTab === 'catalog'
              ? 'text-primary border-primary'
              : 'text-muted border-transparent hover:text-white'
          }`}
          id="tab-rewards-catalog"
        >
          Rewards Catalog
        </button>
        <button
          onClick={() => setActiveTab('payout')}
          className={`font-display font-bold text-lg pb-1 border-b-2 transition-all ${
            activeTab === 'payout'
              ? 'text-primary border-primary'
              : 'text-muted border-transparent hover:text-white'
          }`}
          id="tab-upi-payout"
        >
          UPI Payout Center
        </button>
      </div>

      {/* Main Grid: Catalog/Payout and Leaderboard */}
      <div className="grid lg:grid-cols-3 gap-8">
        {activeTab === 'catalog' ? (
          /* Rewards Catalog */
          <div className="lg:col-span-2 space-y-6">
            <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
              <Gift className="text-primary" /> Available Rewards
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {catalog?.map((item) => {
                const Icon = getRewardIcon(item.type);
                const canAfford = (creator?.pointsBalance || 0) >= item.cost;

                return (
                  <div
                    key={item.id}
                    className={`group relative bg-bg-card rounded-2xl p-6 border transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 ${
                      canAfford
                        ? 'border-border hover:border-purple-500/50 hover:shadow-[0_8px_30px_rgb(126,34,206,0.1)]'
                        : 'border-border/50 opacity-70 hover:opacity-100 hover:border-border'
                    }`}
                  >
                    <div>
                      {/* Item Badge & Cost */}
                      <div className="flex items-start justify-between gap-2 mb-4">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider bg-slate-900 text-purple-400 border border-purple-500/20">
                          {item.badge}
                        </span>
                        <div className="text-right">
                          <span className="text-xs text-muted block">Cost</span>
                          <span className="text-xl font-display font-black text-gold">
                            {item.cost} <span className="text-xs font-semibold">pts</span>
                          </span>
                        </div>
                      </div>

                      {/* Reward Details */}
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-glow/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                          <Icon size={22} />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-display font-bold text-white text-lg leading-tight group-hover:text-primary transition-colors duration-300">
                            {item.title}
                          </h3>
                          <p className="text-muted text-xs leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Redeem Button */}
                    <div className="mt-6">
                      <button
                        onClick={() => handleRedeem(item.type)}
                        disabled={!canAfford || submitting}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                          canAfford
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/20 cursor-pointer'
                            : 'bg-slate-900 border border-border text-muted cursor-not-allowed'
                        }`}
                      >
                        {canAfford ? (
                          <>Redeem Reward <ArrowUpRight size={14} /></>
                        ) : (
                          <>Need {item.cost - (creator?.pointsBalance || 0)} More Points</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* UPI Payout Center */
          <div className="lg:col-span-2 space-y-6">
            <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="text-primary" /> UPI Payout Center
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Payout Request Form */}
              <div className="bg-bg-card rounded-2xl p-6 border border-border flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-bold text-white text-lg mb-2">
                    Withdraw Earnings
                  </h3>
                  <p className="text-muted text-xs leading-relaxed mb-4">
                    Convert your cashable points directly to your bank account via UPI. 1 point = ₹1.
                  </p>

                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 mb-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted block uppercase font-bold tracking-wider">Cashable Balance</span>
                      <span className="text-2xl font-display font-black text-white" id="cashable-balance-display">
                        ₹{creator?.pointsBalance || 0}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted block uppercase font-bold">Min. Payout</span>
                      <span className="text-sm font-semibold text-primary">100 pts</span>
                    </div>
                  </div>

                  <form onSubmit={handlePayoutRequest} className="space-y-3">
                    <div>
                      <label className="block text-xs text-muted mb-1.5 font-medium">
                        Withdrawal Amount (Points)
                      </label>
                      <input
                        type="number"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        placeholder="Min 100"
                        className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted/50 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-colors"
                        min="100"
                        max={creator?.pointsBalance}
                        id="payout-amount-input"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-muted mb-1.5 font-medium">
                        UPI ID
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="username@bank"
                        className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-muted/50 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-colors"
                        id="payout-upi-input"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={payoutSubmitting || !creator?.pointsBalance || creator?.pointsBalance < 100}
                      className="w-full mt-2 bg-primary hover:bg-primary-soft text-black font-bold py-2.5 px-4 rounded-xl text-xs transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      id="submit-payout-btn"
                    >
                      {payoutSubmitting ? 'Processing Payout...' : 'Request UPI Payout'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Payout History */}
              <div className="bg-bg-card rounded-2xl p-6 border border-border flex flex-col h-full">
                <h3 className="font-display font-bold text-white text-lg mb-4">
                  Payout History
                </h3>

                {loadingPayouts ? (
                  <div className="flex-1 flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : payouts.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-muted">
                    <Clock size={32} className="mb-2" />
                    <p className="text-xs">No payout requests found.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto max-h-72 space-y-3 pr-1" id="payout-history-list">
                    {payouts.map((payout) => {
                      let statusBadge = 'bg-slate-900 text-muted';
                      if (payout.status === 'pending') statusBadge = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                      if (payout.status === 'processing') statusBadge = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
                      if (payout.status === 'completed') statusBadge = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                      if (payout.status === 'failed') statusBadge = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';

                      return (
                        <div
                          key={payout.id}
                          className="p-3 bg-slate-950/40 border border-border/40 rounded-xl hover:border-border/80 transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-white text-xs">
                              UPI: {payout.upiId}
                            </div>
                            <div className="text-[10px] text-muted mt-1">
                              {new Date(payout.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <div className="font-bold text-white text-sm">
                              ₹{Number(payout.amount).toLocaleString('en-IN')}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-block px-2 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider ${statusBadge}`}>
                                {payout.status}
                              </span>
                              {(payout.status === 'pending' || payout.status === 'processing') && (
                                <button
                                  type="button"
                                  onClick={() => checkStatus(payout.id)}
                                  disabled={checkingPayout[payout.id]}
                                  className="p-1 rounded bg-bg border border-border text-[9px] text-muted hover:text-white hover:border-primary/50 transition-colors flex items-center justify-center disabled:opacity-50"
                                  title="Check Live status"
                                >
                                  <RefreshCw size={10} className={checkingPayout[payout.id] ? 'animate-spin' : ''} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Section */}
        <div className="space-y-6">
          <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="text-yellow-400" /> Creator Leaderboard
          </h2>

          <div className="bg-bg-card border border-border rounded-2xl overflow-hidden p-6 space-y-4">
            <div className="text-xs text-muted font-bold uppercase tracking-wider mb-2">Top 5 Influenzia Creators</div>

            <div className="space-y-3">
              {leaderboard?.map((member, index) => {
                const rank = index + 1;
                const isTop = rank === 1;
                const memberStyles = getTierStyles(member.tier);

                return (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ${
                      member.id === creator?.id
                        ? 'bg-purple-950/20 border-purple-500/40 shadow-[0_0_15px_rgba(147,51,234,0.05)]'
                        : 'bg-slate-950/40 border-border/40 hover:border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank Indicator */}
                      <div className="w-6 flex items-center justify-center font-black">
                        {isTop ? (
                          <Crown className="text-yellow-400 fill-yellow-400 animate-pulse" size={18} />
                        ) : (
                          <span className="text-sm text-muted">#{rank}</span>
                        )}
                      </div>

                      {/* Profile Photo or Initials */}
                      <div className="relative">
                        {member.photoUrl ? (
                          <img
                            src={member.photoUrl}
                            alt={member.name}
                            className="w-9 h-9 rounded-full object-cover border border-white/10"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase border border-white/5">
                            {member.name.substring(0, 2)}
                          </div>
                        )}
                        <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] uppercase text-slate-950 font-black ${memberStyles.barColor === 'from-indigo-500 to-cyan-400' ? 'bg-indigo-400' : memberStyles.barColor === 'from-amber-500 to-yellow-400' ? 'bg-amber-400' : 'bg-slate-400'}`}>
                          {member.tier?.substring(0, 1)}
                        </span>
                      </div>

                      {/* Name & Tier */}
                      <div>
                        <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                          {member.name}
                          {member.id === creator?.id && (
                            <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.2 rounded font-bold uppercase">
                              You
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted capitalize uppercase font-semibold">
                          {member.tier} Tier
                        </span>
                      </div>
                    </div>

                    {/* Points Balance */}
                    <div className="text-right font-display font-extrabold text-white text-sm">
                      {member.pointsBalance} <span className="text-[10px] font-bold text-muted">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: History Logs */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Points History log */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-4">
          <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <Clock className="text-purple-400" size={20} /> Points History
          </h3>

          <div className="border-t border-border/50 pt-2" />

          {data?.history?.length === 0 ? (
            <div className="text-center py-12 text-muted text-sm">
              <p>No points transactions yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {data?.history?.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-border/40 rounded-xl hover:border-border/80 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-white text-sm capitalize">
                      {transaction.reason.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[11px] text-muted flex items-center gap-1">
                      <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                      {transaction.note && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-xs">{transaction.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={`text-sm font-black font-display ${
                    transaction.type === 'earn' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {transaction.type === 'earn' ? '+' : ''}{transaction.points} pts
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Redemption Requests status log */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 space-y-4">
          <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <Gift className="text-purple-400" size={20} /> Redemption Requests
          </h3>

          <div className="border-t border-border/50 pt-2" />

          {redemptions?.length === 0 ? (
            <div className="text-center py-12 text-muted text-sm">
              <p>No redemption requests submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {redemptions?.map((request) => {
                const isPending = request.status === 'pending';
                const isApproved = request.status === 'approved';
                const isRejected = request.status === 'rejected';

                let statusBadge = 'bg-slate-900 text-muted';
                if (isPending) statusBadge = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                if (isApproved) statusBadge = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                if (isRejected) statusBadge = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';

                return (
                  <div
                    key={request.id}
                    className="p-3.5 bg-slate-950/40 border border-border/40 rounded-xl hover:border-border/80 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-white text-sm capitalize">
                        {request.rewardType.replace(/_/g, ' ')}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${statusBadge}`}>
                        {request.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted">
                      <div>
                        Cost: <strong className="text-white">{request.pointsCost} pts</strong> • {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                      {request.adminNote && (
                        <div className="text-right italic max-w-[50%] truncate">
                          &ldquo;{request.adminNote}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Points;
