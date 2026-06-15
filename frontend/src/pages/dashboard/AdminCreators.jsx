import { useState, useEffect } from 'react';
import { Search, Sparkles, Filter, CheckCircle2, X, ShieldAlert, Award, AlertOctagon } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const AdminCreators = () => {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [verified, setVerified] = useState(false);
  const [featured, setFeatured] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modals
  const [editingPointsCreator, setEditingPointsCreator] = useState(null);
  const [newPointsVal, setNewPointsVal] = useState(0);
  const [savingPoints, setSavingPoints] = useState(false);

  useEffect(() => {
    fetchCreators();
  }, [page, status, category, city, verified, featured]);

  const fetchCreators = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        status,
        category,
        city,
        verified: verified ? 'true' : undefined,
        featured: featured ? 'true' : undefined,
        search: search.trim() || undefined
      };

      const response = await api.get('/admin/creators', { params });
      if (response.data.success) {
        setCreators(response.data.data.creators);
        setTotalPages(response.data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching admin creators:', error);
      toast.error('Failed to load creators directory');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCreators();
  };

  const handleUpdateCreatorStatus = async (creatorId, updates) => {
    try {
      const response = await api.put(`/admin/creators/${creatorId}`, updates);
      if (response.data.success) {
        toast.success(response.data.message || 'Creator updated successfully');
        setCreators(creators.map(c => c.id === creatorId ? { ...c, ...response.data.creator } : c));
      }
    } catch (error) {
      console.error('Error updating creator:', error);
      toast.error(error.response?.data?.message || 'Failed to update creator');
    }
  };

  const handleSuspendCreator = async (creatorId) => {
    if (!window.confirm('Are you sure you want to suspend this creator account?')) return;
    try {
      const response = await api.delete(`/admin/creators/${creatorId}`);
      if (response.data.success) {
        toast.success('Creator suspended successfully');
        setCreators(creators.map(c => c.id === creatorId ? { ...c, status: 'suspended' } : c));
      }
    } catch (error) {
      console.error('Error suspending creator:', error);
      toast.error(error.response?.data?.message || 'Failed to suspend creator');
    }
  };

  const openPointsModal = (creator) => {
    setEditingPointsCreator(creator);
    setNewPointsVal(creator.pointsBalance);
  };

  const closePointsModal = () => {
    setEditingPointsCreator(null);
    setNewPointsVal(0);
  };

  const handleSavePoints = async (e) => {
    e.preventDefault();
    if (!editingPointsCreator) return;
    try {
      setSavingPoints(true);
      const response = await api.put(`/admin/creators/${editingPointsCreator.id}`, {
        pointsBalance: parseInt(newPointsVal)
      });
      if (response.data.success) {
        toast.success('Points balance updated successfully');
        setCreators(creators.map(c => c.id === editingPointsCreator.id ? { ...c, pointsBalance: response.data.creator.pointsBalance } : c));
        closePointsModal();
      }
    } catch (error) {
      console.error('Error updating points:', error);
      toast.error('Failed to update points balance');
    } finally {
      setSavingPoints(false);
    }
  };

  return (
    <div className="space-y-8 pb-10 text-left">
      {/* Header title */}
      <div>
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-2">
          Creators Directory <Sparkles size={24} className="text-gold" />
        </h1>
        <p className="text-muted text-sm mt-1">
          Review, approve pending registrations, verify badges, update points balance, and manage suspensions.
        </p>
      </div>

      {/* Filters bar */}
      <div className="bg-bg-card rounded-2xl p-6 border border-border/85 shadow-lg space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <input
              type="text"
              placeholder="Search creator name, email, instagram handle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl pl-11 pr-4 py-3 text-white placeholder-muted focus:outline-none focus:border-gold transition-colors text-sm"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold transition-colors text-sm capitalize"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-primary hover:bg-primary-soft text-black py-3 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(212,175,55,0.1)]"
          >
            Filter Directory
          </button>
        </form>

        <div className="flex flex-wrap gap-4 pt-2 text-xs">
          <div>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="bg-bg border border-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold text-xs capitalize"
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
              onChange={(e) => { setCity(e.target.value); setPage(1); }}
              className="bg-bg border border-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-gold text-xs"
            >
              <option value="">All Cities</option>
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Pune">Pune</option>
            </select>
          </div>

          <label className="flex items-center space-x-2 text-white font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => { setVerified(e.target.checked); setPage(1); }}
              className="rounded bg-bg border-border text-primary focus:ring-primary h-4 w-4"
            />
            <span>Show Only Verified</span>
          </label>

          <label className="flex items-center space-x-2 text-white font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => { setFeatured(e.target.checked); setPage(1); }}
              className="rounded bg-bg border-border text-primary focus:ring-primary h-4 w-4"
            />
            <span>Show Only Featured</span>
          </label>
        </div>
      </div>

      {/* Creators Table List */}
      <div className="bg-bg-card rounded-2xl border border-border/85 p-6 shadow-lg overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            <span className="text-muted text-xs">Loading creators list...</span>
          </div>
        ) : creators.length === 0 ? (
          <div className="py-16 text-center text-muted">
            No creators found matching the current search parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#a1a1aa]">
              <thead>
                <tr className="text-white text-xs font-semibold uppercase tracking-wider border-b border-border/50 pb-3">
                  <th className="pb-3">Creator Name</th>
                  <th className="pb-3">Contact</th>
                  <th className="pb-3">Instagram</th>
                  <th className="pb-3">Location</th>
                  <th className="pb-3 text-center">Points</th>
                  <th className="pb-3 text-center">Flags</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 text-xs">
                {creators.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white text-sm flex items-center gap-1">
                          {c.name}
                          {c.isVerified && <CheckCircle2 size={13} className="text-gold fill-gold/10" />}
                        </span>
                        <span className="text-muted text-[10px] capitalize mt-0.5">{c.category}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span>{c.email}</span>
                        <span className="text-muted text-[10px] mt-0.5">Created: {new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <a
                        href={`https://instagram.com/${c.instagram}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gold font-medium hover:underline"
                      >
                        @{c.instagram}
                      </a>
                    </td>
                    <td className="py-4">{c.city}</td>
                    <td className="py-4 text-center font-bold text-white">
                      <button 
                        onClick={() => openPointsModal(c)}
                        className="px-2 py-1 bg-white/5 border border-border hover:border-gold hover:text-gold rounded-lg transition-colors flex items-center justify-center space-x-1 mx-auto"
                      >
                        <Award size={12} className="text-gold" />
                        <span>{c.pointsBalance}</span>
                      </button>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleUpdateCreatorStatus(c.id, { isVerified: !c.isVerified })}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            c.isVerified 
                              ? 'bg-gold/10 text-gold border-gold/25' 
                              : 'bg-black/40 text-muted border-border hover:text-white'
                          }`}
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => handleUpdateCreatorStatus(c.id, { isFeatured: !c.isFeatured })}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            c.isFeatured 
                              ? 'bg-[#6228d7]/10 text-[#c13584] border-[#6228d7]/20 shadow-[0_0_8px_rgba(98,40,215,0.1)]' 
                              : 'bg-black/40 text-muted border-border hover:text-white'
                          }`}
                        >
                          Feature
                        </button>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {!c.isApproved ? (
                          <button
                            onClick={() => handleUpdateCreatorStatus(c.id, { isApproved: true })}
                            className="bg-primary hover:bg-primary-soft text-black px-2.5 py-1 rounded-lg text-[10px] font-bold"
                          >
                            Approve
                          </button>
                        ) : (
                          <span className="text-emerald-500 text-[10px] font-bold uppercase mr-1">Approved</span>
                        )}
                        {c.status !== 'suspended' ? (
                          <button
                            onClick={() => handleSuspendCreator(c.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateCreatorStatus(c.id, { status: 'active' })}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination navigation controls */}
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

      {/* Quick edit Points modal */}
      {editingPointsCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-sm shadow-2xl p-6 relative overflow-hidden">
            <button 
              onClick={closePointsModal}
              className="absolute top-4 right-4 text-muted hover:text-white"
            >
              <X size={18} />
            </button>

            <form onSubmit={handleSavePoints} className="space-y-5">
              <div className="text-center">
                <AlertOctagon size={28} className="text-gold mx-auto mb-2" />
                <h3 className="text-white text-base font-bold">Update Points Balance</h3>
                <p className="text-xs text-muted mt-1">Adjust points balance for @{editingPointsCreator.instagram}</p>
              </div>

              <div>
                <label htmlFor="points_balance_input" className="block text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5 text-left">
                  Points Balance
                </label>
                <input
                  type="number"
                  id="points_balance_input"
                  min="0"
                  value={newPointsVal}
                  onChange={(e) => setNewPointsVal(e.target.value)}
                  className="w-full bg-black border border-border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={closePointsModal}
                  className="flex-1 py-2 bg-white/5 border border-border text-white rounded-xl text-xs font-semibold hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPoints}
                  className="flex-1 py-2 bg-primary text-black rounded-xl text-xs font-bold hover:bg-primary-soft transition-colors"
                >
                  {savingPoints ? 'Updating...' : 'Save Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCreators;
