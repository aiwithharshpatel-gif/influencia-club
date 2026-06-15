import { useState, useEffect } from 'react';
import { Award, Sparkles, User, ShieldCheck, Search, PlusCircle, CheckCircle, ArrowRight, CornerDownRight } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AdminPoints = () => {
  const [creators, setCreators] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [points, setPoints] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/creators', { params: { limit: 100 } });
      if (response.data.success) {
        setCreators(response.data.data.creators);
      }
    } catch (error) {
      console.error('Error fetching creators:', error);
      toast.error('Failed to load creators directory');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantPoints = async (e) => {
    e.preventDefault();
    if (!selectedCreator) {
      toast.error('Please select a creator first');
      return;
    }
    const pointsNum = parseInt(points);
    if (isNaN(pointsNum) || pointsNum === 0) {
      toast.error('Please enter a valid non-zero points amount');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/admin/points', {
        creatorId: selectedCreator.id,
        points: pointsNum,
        note: note.trim() || undefined
      });

      if (response.data.success) {
        toast.success(`Successfully granted ${pointsNum} points to ${selectedCreator.name}!`);
        
        // Update local state points balance
        const updatedBalance = response.data.creator.pointsBalance;
        setCreators(creators.map(c => c.id === selectedCreator.id ? { ...c, pointsBalance: updatedBalance } : c));
        setSelectedCreator({ ...selectedCreator, pointsBalance: updatedBalance });
        
        // Reset inputs
        setPoints('');
        setNote('');
      }
    } catch (error) {
      console.error('Error granting points:', error);
      toast.error(error.response?.data?.message || 'Failed to grant points');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCreators = creators.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.instagram.toLowerCase().includes(search.toLowerCase())
  );

  const applyPreset = (amount) => {
    setPoints(amount.toString());
  };

  return (
    <div className="space-y-8 pb-10 text-left">
      {/* Header title */}
      <div>
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-2">
          Points Allocation <Sparkles size={24} className="text-gold" />
        </h1>
        <p className="text-muted text-sm mt-1">
          Award points to creators manually for special campaigns, referrals, milestones, or customer service adjustments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Creator Selection (col-span-2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-bg-card rounded-2xl border border-border/85 p-6 shadow-lg space-y-4">
            <h3 className="font-display text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-border/30">
              <User size={18} className="text-primary" />
              <span>Select Creator</span>
            </h3>

            {/* Search filter */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, email or IG..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-bg border border-border rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-muted focus:outline-none focus:border-gold transition-colors text-xs"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={14} />
            </div>

            {/* Creators list */}
            {loading ? (
              <div className="py-12 text-center text-xs text-muted flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                <span>Loading creators...</span>
              </div>
            ) : filteredCreators.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted">
                No creators found.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredCreators.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCreator(c);
                      // Clear search query on selection to focus on the selected creator
                      setSearch('');
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                      selectedCreator?.id === c.id
                        ? 'bg-primary/5 border-primary'
                        : 'bg-[#18181b] border-border/60 hover:border-white/10'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-white text-xs flex items-center gap-1">
                        {c.name}
                        {c.isVerified && <ShieldCheck size={12} className="text-gold fill-gold/10" />}
                      </div>
                      <div className="text-[10px] text-muted mt-0.5">@{c.instagram} • {c.email}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-white block">{c.pointsBalance} pts</span>
                      <span className="text-[9px] text-gold uppercase tracking-wider font-semibold block">{c.tier}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Panel / Grant Form (col-span-3) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-bg-card rounded-2xl border border-border/85 p-6 shadow-lg text-left">
            <h3 className="font-display text-base font-bold text-white flex items-center gap-2 pb-2 border-b border-border/30 mb-6">
              <PlusCircle size={18} className="text-primary" />
              <span>Configure Grant Transaction</span>
            </h3>

            {!selectedCreator ? (
              <div className="py-20 text-center text-muted text-xs border border-dashed border-border/50 rounded-xl">
                Please select a creator from the directory list on the left to configure point award settings.
              </div>
            ) : (
              <form onSubmit={handleGrantPoints} className="space-y-6">
                {/* Creator card summary */}
                <div className="p-4 bg-[#18181b] border border-border/60 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted uppercase tracking-wider block font-medium">Selected Beneficiary</span>
                    <span className="text-sm font-bold text-white block mt-0.5">{selectedCreator.name}</span>
                    <span className="text-xs text-muted block">@{selectedCreator.instagram}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted uppercase tracking-wider block font-medium">Current Balance</span>
                    <span className="text-sm font-black text-gold block mt-0.5">{selectedCreator.pointsBalance} pts</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Points Input */}
                  <div className="space-y-2">
                    <label htmlFor="points_amount" className="block text-[10px] font-semibold text-muted uppercase tracking-wider">
                      Points Amount *
                    </label>
                    <input
                      type="number"
                      id="points_amount"
                      required
                      value={points}
                      onChange={(e) => setPoints(e.target.value)}
                      className="w-full bg-black border border-border rounded-xl px-4 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-gold"
                      placeholder="E.g., 100 or -50"
                    />

                    {/* Presets */}
                    <div className="flex gap-1.5 pt-1">
                      {[50, 100, 250, 500].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => applyPreset(val)}
                          className="px-2.5 py-1 bg-white/5 border border-border/60 hover:bg-white/10 hover:border-gold text-muted hover:text-white rounded text-[10px] font-semibold transition-all"
                        >
                          +{val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transaction Preview */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-semibold text-muted uppercase tracking-wider">
                      Transaction Preview
                    </span>
                    <div className="h-[76px] bg-[#161618]/60 border border-border/40 rounded-xl p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-muted block">Current Balance:</span>
                        <span className="text-white font-semibold">{selectedCreator.pointsBalance} pts</span>
                      </div>
                      <ArrowRight size={16} className="text-muted shrink-0 mx-2" />
                      <div className="text-right">
                        <span className="text-muted block">Expected Balance:</span>
                        <span className={`font-bold text-sm ${parseInt(points) >= 0 || !points ? 'text-emerald-400' : 'text-red-400'}`}>
                          {selectedCreator.pointsBalance + (parseInt(points) || 0)} pts
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reason Notes */}
                <div className="space-y-2">
                  <label htmlFor="points_reason" className="block text-[10px] font-semibold text-muted uppercase tracking-wider">
                    Transaction Reason & Note *
                  </label>
                  <textarea
                    id="points_reason"
                    required
                    rows="3"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-black border border-border rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-gold resize-none"
                    placeholder="Specify why you are granting points (e.g. Campaign completion bonus, referral adjustments, onboarding bounty)..."
                  />
                </div>

                <div className="pt-2 border-t border-border/30">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-primary-soft text-black py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(212,175,55,0.1)] flex items-center justify-center gap-1.5 text-sm"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />
                        <span>Granting Points...</span>
                      </>
                    ) : (
                      <>
                        <Award size={16} />
                        <span>Credit Points Balance</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPoints;
