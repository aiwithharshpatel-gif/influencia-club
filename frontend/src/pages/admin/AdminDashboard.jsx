import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [data, setData] = useState({
    stats: null,
    creators: [],
    inquiries: [],
    redemptions: []
  });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [stats, creators, inquiries, redemptions] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/creators?limit=100'),
        api.get('/admin/inquiries?limit=100'),
        api.get('/admin/redemptions?status=pending')
      ]);
      setData({
        stats: stats.data.data,
        creators: creators.data.data.creators,
        inquiries: inquiries.data.data.inquiries,
        redemptions: redemptions.data.redemptions
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateCreator = async (id, changes) => {
    try {
      await api.put(`/admin/creators/${id}`, changes);
      toast.success('Creator updated');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update creator');
    }
  };

  const updateInquiry = async (id, status) => {
    try {
      await api.put(`/admin/inquiries/${id}`, { status });
      toast.success('Inquiry updated');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update inquiry');
    }
  };

  const processRedemption = async (id, status) => {
    try {
      await api.put(`/admin/redemptions/${id}`, { status });
      toast.success(`Redemption ${status}`);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to process redemption');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  if (loading) {
    return <div className="min-h-screen bg-bg flex items-center justify-center text-white">Loading...</div>;
  }

  const statCards = [
    ['Creators', data.stats?.totalCreators || 0],
    ['Pending Creators', data.stats?.pendingCreators || 0],
    ['Inquiries', data.stats?.totalInquiries || 0],
    ['New Inquiries', data.stats?.newInquiries || 0],
    ['Active Campaigns', data.stats?.activeCampaigns || 0]
  ];

  return (
    <main className="min-h-screen bg-bg text-white">
      <header className="border-b border-border bg-bg-card">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Influenzia Operations</h1>
            <p className="text-muted text-sm">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="btn-outline px-4 py-2">Logout</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        <section className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map(([label, value]) => (
            <div key={label} className="bg-bg-card border border-border rounded-xl p-5">
              <div className="text-3xl font-bold text-gold">{value}</div>
              <div className="text-muted text-sm mt-1">{label}</div>
            </div>
          ))}
        </section>

        <AdminSection title="Pending Reward Redemptions">
          {data.redemptions.length === 0 ? (
            <EmptyState />
          ) : data.redemptions.map((item) => (
            <div key={item.id} className="admin-row">
              <div>
                <div className="font-semibold">{item.creator.name}</div>
                <div className="text-muted text-sm">
                  {item.rewardType.replaceAll('_', ' ')} · {item.pointsCost} points
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => processRedemption(item.id, 'approved')} className="btn-primary px-3 py-2">
                  Approve
                </button>
                <button onClick={() => processRedemption(item.id, 'rejected')} className="btn-outline px-3 py-2">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </AdminSection>

        <AdminSection title="Brand Inquiries">
          {data.inquiries.length === 0 ? <EmptyState /> : data.inquiries.map((item) => (
            <div key={item.id} className="admin-row">
              <div className="min-w-0">
                <div className="font-semibold">{item.brandName}</div>
                <div className="text-muted text-sm truncate">{item.email} · {item.budgetRange}</div>
              </div>
              <select
                value={item.status}
                onChange={(event) => updateInquiry(item.id, event.target.value)}
                className="bg-bg border border-border rounded-lg px-3 py-2"
              >
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          ))}
        </AdminSection>

        <AdminSection title="Creators">
          {data.creators.length === 0 ? <EmptyState /> : data.creators.map((creator) => (
            <div key={creator.id} className="admin-row">
              <div className="min-w-0">
                <div className="font-semibold">{creator.name}</div>
                <div className="text-muted text-sm truncate">
                  {creator.email} · @{creator.instagram} · {creator.city}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <ToggleButton
                  active={creator.isApproved}
                  label="Approved"
                  onClick={() => updateCreator(creator.id, { isApproved: !creator.isApproved })}
                />
                <ToggleButton
                  active={creator.isVerified}
                  label="Verified"
                  onClick={() => updateCreator(creator.id, { isVerified: !creator.isVerified })}
                />
                <ToggleButton
                  active={creator.isFeatured}
                  label="Featured"
                  onClick={() => updateCreator(creator.id, { isFeatured: !creator.isFeatured })}
                />
                <ToggleButton
                  active={creator.status === 'active'}
                  label={creator.status === 'active' ? 'Active' : 'Suspended'}
                  onClick={() => updateCreator(creator.id, {
                    status: creator.status === 'active' ? 'suspended' : 'active'
                  })}
                />
              </div>
            </div>
          ))}
        </AdminSection>
      </div>
    </main>
  );
};

const AdminSection = ({ title, children }) => (
  <section className="bg-bg-card border border-border rounded-xl p-5">
    <h2 className="font-display text-xl font-bold mb-4">{title}</h2>
    <div className="space-y-3">{children}</div>
  </section>
);

const EmptyState = () => <p className="text-muted py-4">No records found.</p>;

const ToggleButton = ({ active, label, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 rounded-lg border text-sm ${
      active ? 'border-green-500/60 text-green-400' : 'border-border text-muted'
    }`}
  >
    {label}
  </button>
);

export default AdminDashboard;
