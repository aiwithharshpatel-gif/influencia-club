import { useState, useEffect } from 'react';
import { Trophy, Search, Star, Award, Share2, Download, User, MapPin, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedCreatorForCard, setSelectedCreatorForCard] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/creators/leaderboard');
      if (response.data.success) {
        setLeaderboard(response.data.leaderboard);
        if (response.data.leaderboard.length > 0) {
          setSelectedCreatorForCard(response.data.leaderboard[0]);
        }
      }
    } catch (err) {
      console.error('Waitlist leaderboard error:', err);
      toast.error('Failed to load waitlist leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaderboard = leaderboard.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.instagram && item.instagram.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTier = selectedTier === 'all' || item.tier.toLowerCase() === selectedTier.toLowerCase();
    return matchesSearch && matchesTier;
  });

  // Top 3 Podium spots
  const podiumCreators = leaderboard.slice(0, 3);
  const silverSpot = podiumCreators[1]; // Rank 2
  const goldSpot = podiumCreators[0];   // Rank 1
  const bronzeSpot = podiumCreators[2]; // Rank 3

  const remainingCreators = filteredLeaderboard;

  const downloadCertificate = (name, rank, points, code) => {
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
        <!-- Background -->
        <rect width="800" height="600" fill="#0A0A0A"/>
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#BF953F" />
            <stop offset="25%" stop-color="#FCF6BA" />
            <stop offset="50%" stop-color="#B38728" />
            <stop offset="75%" stop-color="#FBF5B7" />
            <stop offset="100%" stop-color="#AA771C" />
          </linearGradient>
        </defs>
        
        <!-- Gold Border -->
        <rect x="25" y="25" width="750" height="550" fill="none" stroke="url(#goldGrad)" stroke-width="4"/>
        <rect x="35" y="35" width="730" height="530" fill="none" stroke="#D4AF37" stroke-width="1" stroke-dasharray="10 5" opacity="0.6"/>
        
        <!-- Corner Decorations -->
        <path d="M 25 50 L 50 25 M 775 50 L 750 25 M 25 550 L 50 575 M 775 550 L 750 575" stroke="url(#goldGrad)" stroke-width="4" />
        
        <!-- Header -->
        <text x="400" y="90" font-family="'Outfit', sans-serif" font-size="22" fill="url(#goldGrad)" font-weight="bold" letter-spacing="6" text-anchor="middle">INFLUENZIA CLUB</text>
        <text x="400" y="115" font-family="'DM Sans', sans-serif" font-size="11" fill="#888888" letter-spacing="3" text-anchor="middle">OFFICIAL INFLUENCER WAITLIST</text>
        
        <!-- Seal/Trophy Icon -->
        <circle cx="400" cy="180" r="35" fill="#141414" stroke="url(#goldGrad)" stroke-width="2"/>
        <path d="M390,165 L410,165 L410,175 C410,185 405,190 400,190 C395,190 390,185 390,175 Z" fill="url(#goldGrad)"/>
        <path d="M397,190 L403,190 L403,197 L397,197 Z" fill="url(#goldGrad)"/>
        <path d="M392,197 L408,197 L408,200 L392,200 Z" fill="url(#goldGrad)"/>
        <path d="M386,168 C383,168 382,175 385,178 C388,180 390,180 390,175" fill="none" stroke="url(#goldGrad)" stroke-width="1.5"/>
        <path d="M414,168 C417,168 418,175 415,178 C412,180 410,180 410,175" fill="none" stroke="url(#goldGrad)" stroke-width="1.5"/>

        <!-- Main Content -->
        <text x="400" y="260" font-family="'Outfit', sans-serif" font-size="16" fill="#A0A0A0" text-anchor="middle">This is to certify that the creator</text>
        <text x="400" y="315" font-family="'Outfit', sans-serif" font-size="34" fill="#FFFFFF" font-weight="bold" text-anchor="middle">${name}</text>
        <line x1="220" y1="335" x2="580" y2="335" stroke="url(#goldGrad)" stroke-width="2"/>
        
        <!-- Rank Details -->
        <text x="400" y="375" font-family="'Outfit', sans-serif" font-size="15" fill="#A0A0A0" text-anchor="middle">has secured a verified waitlist position of</text>
        <text x="400" y="435" font-family="'Outfit', sans-serif" font-size="52" fill="url(#goldGrad)" font-weight="800" text-anchor="middle">RANK #${rank}</text>
        
        <!-- Score Card stats -->
        <rect x="200" y="475" width="400" height="50" rx="8" fill="#111111" stroke="#222222" stroke-width="1"/>
        <text x="300" y="505" font-family="'DM Sans', sans-serif" font-size="14" fill="#888888" text-anchor="middle">Points Balance: <tspan fill="#FFFFFF" font-weight="bold">${points}</tspan></text>
        <text x="500" y="505" font-family="'DM Sans', sans-serif" font-size="14" fill="#888888" text-anchor="middle">Invite Code: <tspan fill="#FFFFFF" font-weight="bold">${code}</tspan></text>
        
        <!-- Bottom Signature -->
        <text x="400" y="560" font-family="'DM Sans', sans-serif" font-size="10" fill="#555555" text-anchor="middle">Influenzia Club Waitlist Certification System • 2026 ZCAD Nexoraa</text>
      </svg>
    `;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `influenzia_certificate_${name.replace(/\s+/g, '_')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Rank certificate downloaded!');
  };

  const copyShareLink = (code) => {
    const link = `https://influenziaclub.com/join?ref=${code}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />

      {/* Header Banner */}
      <section className="relative py-20 overflow-hidden border-b border-border/40 bg-gradient-to-b from-neutral-900 to-black">
        <div className="absolute inset-0 bg-gold/5 blur-3xl rounded-full -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px]"></div>
        <div className="relative max-w-7xl mx-auto px-4 text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gold/15 text-gold border border-gold/30 rounded-full text-xs font-bold uppercase tracking-wider">
            <Trophy size={14} className="text-gold animate-bounce" /> Waitlist Leaderboard
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white">
            India's Top Creators
          </h1>
          <p className="text-muted text-sm md:text-base max-w-2xl mx-auto">
            Real-time standings of our founding waitlisted creators. Earn points via referrals and climb the ranks for premium benefits.
          </p>
        </div>
      </section>

      {/* Podium Spotlights */}
      {!loading && leaderboard.length >= 3 && (
        <section className="py-12 bg-black">
          <div className="max-w-4xl mx-auto px-4">
            <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end pt-10">
              
              {/* Rank 2 (Silver) */}
              {silverSpot && (
                <div className="flex flex-col items-center space-y-3 order-1">
                  <div className="relative group">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-gray-400 to-gray-200 shadow-lg shadow-white/5 relative">
                      {silverSpot.photoUrl ? (
                        <img src={silverSpot.photoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center font-bold text-white text-lg">
                          {silverSpot.name.charAt(0)}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-400 border-2 border-black rounded-full flex items-center justify-center text-[10px] font-bold text-black">
                        2
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="font-display font-bold text-xs sm:text-sm text-white truncate max-w-[90px] sm:max-w-[130px]">{silverSpot.name}</h3>
                    <p className="text-[10px] text-muted">@{silverSpot.instagram || 'creator'}</p>
                    <span className="inline-block mt-1 bg-white/5 text-gray-300 px-2 py-0.5 rounded text-[10px] font-bold border border-white/10">
                      {silverSpot.pointsBalance} pts
                    </span>
                  </div>
                  <div className="w-full bg-neutral-900 border border-white/10 h-20 sm:h-28 rounded-t-xl flex items-center justify-center">
                    <Award size={24} className="text-gray-400" />
                  </div>
                </div>
              )}

              {/* Rank 1 (Gold) */}
              {goldSpot && (
                <div className="flex flex-col items-center space-y-3 order-2">
                  <div className="relative group -translate-y-4">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                      <Trophy className="text-gold animate-bounce" size={24} />
                    </div>
                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full p-1.5 bg-gold-gradient shadow-gold-glow/20 shadow-2xl relative">
                      {goldSpot.photoUrl ? (
                        <img src={goldSpot.photoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center font-bold text-white text-xl">
                          {goldSpot.name.charAt(0)}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gold border-2 border-black rounded-full flex items-center justify-center text-xs font-bold text-black">
                        1
                      </div>
                    </div>
                  </div>
                  <div className="text-center -translate-y-4">
                    <h3 className="font-display font-bold text-sm sm:text-base text-gold truncate max-w-[100px] sm:max-w-[150px]">{goldSpot.name}</h3>
                    <p className="text-[10px] text-muted">@{goldSpot.instagram || 'creator'}</p>
                    <span className="inline-block mt-1 bg-gold/10 text-gold px-2.5 py-0.5 rounded text-[10px] font-bold border border-gold/20">
                      {goldSpot.pointsBalance} pts
                    </span>
                  </div>
                  <div className="w-full bg-gradient-to-b from-neutral-800 to-neutral-900 border border-gold/20 h-28 sm:h-36 rounded-t-xl flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gold/5 rounded-t-xl animate-pulse"></div>
                    <Star size={28} className="text-gold animate-spin-slow" />
                  </div>
                </div>
              )}

              {/* Rank 3 (Bronze) */}
              {bronzeSpot && (
                <div className="flex flex-col items-center space-y-3 order-3">
                  <div className="relative group">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-amber-700 to-amber-500 shadow-lg shadow-white/5 relative">
                      {bronzeSpot.photoUrl ? (
                        <img src={bronzeSpot.photoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center font-bold text-white text-lg">
                          {bronzeSpot.name.charAt(0)}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-600 border-2 border-black rounded-full flex items-center justify-center text-[10px] font-bold text-black">
                        3
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="font-display font-bold text-xs sm:text-sm text-white truncate max-w-[90px] sm:max-w-[130px]">{bronzeSpot.name}</h3>
                    <p className="text-[10px] text-muted">@{bronzeSpot.instagram || 'creator'}</p>
                    <span className="inline-block mt-1 bg-white/5 text-amber-500 px-2 py-0.5 rounded text-[10px] font-bold border border-white/10">
                      {bronzeSpot.pointsBalance} pts
                    </span>
                  </div>
                  <div className="w-full bg-neutral-900 border border-white/10 h-20 sm:h-28 rounded-t-xl flex items-center justify-center">
                    <Award size={22} className="text-amber-600" />
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>
      )}

      {/* Main Grid: List & Certificate Generator */}
      <section className="py-12 flex-1 max-w-7xl w-full mx-auto px-4 grid lg:grid-cols-3 gap-8">
        
        {/* Left/Middle Column: List, Search, Filters */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h2 className="font-display text-xl font-bold text-white flex items-center gap-2">
              Waitlist Standings
            </h2>
            
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search creator name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-border/80 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-gold transition-colors"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            </div>
          </div>

          {/* Tier Filters */}
          <div className="flex flex-wrap gap-2">
            {['all', 'platinum', 'gold', 'silver'].map(tier => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  selectedTier === tier
                    ? 'bg-gold-gradient text-black border-transparent font-extrabold shadow-gold-glow/10'
                    : 'bg-neutral-900 text-muted border-border/80 hover:border-gold/20'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>

          {/* List Loader */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
              <p className="text-muted text-sm">Loading waitlist standings...</p>
            </div>
          ) : remainingCreators.length === 0 ? (
            <div className="bg-neutral-900/50 border border-border/60 rounded-2xl p-12 text-center text-muted">
              No waitlisted creators found matching your criteria.
            </div>
          ) : (
            <div className="bg-neutral-900/40 border border-border/40 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 text-[10px] font-bold uppercase tracking-wider text-muted">
                      <th className="py-4 px-6">Rank</th>
                      <th className="py-4 px-6">Creator</th>
                      <th className="py-4 px-6">Tier</th>
                      <th className="py-4 px-6 text-center">Referrals</th>
                      <th className="py-4 px-6 text-right">Points</th>
                      <th className="py-4 px-6 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remainingCreators.map((item) => (
                      <tr 
                        key={item.id} 
                        onClick={() => setSelectedCreatorForCard(item)}
                        className={`border-b border-border/20 text-sm hover:bg-white/5 transition-colors cursor-pointer ${
                          selectedCreatorForCard?.id === item.id ? 'bg-white/5 border-l-2 border-l-gold' : ''
                        }`}
                      >
                        <td className="py-4 px-6 font-display font-bold">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                            item.rank === 1 ? 'bg-gold/20 text-gold border border-gold/40' :
                            item.rank === 2 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/40' :
                            item.rank === 3 ? 'bg-amber-600/20 text-amber-500 border border-amber-600/40' :
                            'text-muted'
                          }`}>
                            #{item.rank}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            {item.photoUrl ? (
                              <img src={item.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-white font-bold text-xs">
                                {item.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <h4 className="font-semibold text-white flex items-center gap-1">
                                {item.name}
                                {item.isVerified && <CheckCircle2 size={13} className="text-primary fill-black" />}
                              </h4>
                              <p className="text-[10px] text-muted capitalize">@{item.instagram || 'creator'} • {item.city}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            item.tier === 'platinum' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                            item.tier === 'gold' ? 'bg-gold/10 text-gold border border-gold/20' :
                            'bg-gray-400/10 text-gray-400 border border-gray-400/20'
                          }`}>
                            {item.tier}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center font-semibold text-muted">
                          {item.referralsCount}
                        </td>
                        <td className="py-4 px-6 text-right font-display font-bold text-white">
                          {item.pointsBalance}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCreatorForCard(item);
                            }}
                            className="text-xs text-gold hover:underline font-semibold cursor-pointer bg-transparent border-none"
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Premium Certificate Generator Card */}
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-border/80 rounded-2xl p-6 shadow-2xl space-y-6 sticky top-24">
            <div className="flex items-center gap-2 border-b border-border/40 pb-4">
              <Award className="text-gold" size={24} />
              <div>
                <h3 className="font-display text-lg font-bold text-white">Verify Your Standing</h3>
                <p className="text-[10px] text-muted uppercase">Rank Certificate Generator</p>
              </div>
            </div>

            {selectedCreatorForCard ? (
              <div className="space-y-6">
                {/* Visual Card Preview Mockup */}
                <div className="bg-black border border-gold/30 rounded-xl p-5 relative overflow-hidden aspect-[4/3] flex flex-col justify-between shadow-gold-glow/5">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-2xl rounded-full"></div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[8px] font-bold text-gold tracking-widest block uppercase">Influenzia Club</span>
                      <span className="text-[7px] text-muted block uppercase">Verified Waitlist Standing</span>
                    </div>
                    <Sparkles className="text-gold animate-pulse" size={14} />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] text-muted block">This is to certify that</span>
                    <h4 className="font-display font-bold text-white text-base truncate">{selectedCreatorForCard.name}</h4>
                    <div className="h-0.5 bg-gold-gradient w-2/3"></div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[7px] text-muted block">Current Waitlist Position</span>
                      <span className="font-display font-extrabold text-gold text-lg">Rank #{selectedCreatorForCard.rank}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[7px] text-muted block">Points Earned</span>
                      <span className="text-[10px] font-bold text-white">{selectedCreatorForCard.pointsBalance} PTS</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => downloadCertificate(
                      selectedCreatorForCard.name, 
                      selectedCreatorForCard.rank, 
                      selectedCreatorForCard.pointsBalance, 
                      selectedCreatorForCard.referralCode
                    )}
                    className="w-full bg-gold hover:opacity-90 text-black py-3 rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer font-bold uppercase tracking-wider transition-opacity border-none"
                  >
                    <Download size={16} />
                    Download Official SVG
                  </button>

                  <button
                    onClick={() => copyShareLink(selectedCreatorForCard.referralCode)}
                    className="w-full bg-neutral-800 hover:bg-neutral-700 text-white border border-border py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Share2 size={16} />
                    Copy Referral Invite Link
                  </button>
                </div>

                <div className="text-[11px] text-muted leading-relaxed bg-black/40 p-4 rounded-xl border border-border/30">
                  <p className="font-bold text-white mb-1">✦ Premium Waitlist Tier Perks:</p>
                  <ul className="list-disc pl-4 space-y-1.5 font-sans">
                    <li>Rank #1-5: Auto-granted <span className="text-gold font-semibold">Platinum Tier</span> status.</li>
                    <li>Rank #6-15: Auto-granted <span className="text-gold font-semibold">Gold Tier</span> status.</li>
                    <li>Refer friends to earn 50 points per signup and boost your rank certificate!</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted text-xs">
                Select a creator from the standings table to preview and generate their official verified waitlist certificate.
              </div>
            )}
          </div>
        </div>

      </section>

      <Footer />
    </div>
  );
};

export default Leaderboard;
