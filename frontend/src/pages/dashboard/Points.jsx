import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Gift, Instagram, Ticket, Briefcase, CheckCircle } from 'lucide-react';
import api from '../../utils/api';

const Points = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    fetchPoints();
  }, []);

  const fetchPoints = async () => {
    try {
      const response = await api.get('/dashboard/points');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching points:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData) => {
    try {
      setSubmitting(true);
      setSuccess(false);

      const response = await api.post('/dashboard/redeem', formData);
      if (response.data.success) {
        setSuccess(true);
        fetchPoints();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Redemption failed');
    } finally {
      setSubmitting(false);
    }
  };

  const redemptionOptions = [
    {
      type: 'featured',
      icon: Gift,
      title: 'Featured Creator',
      cost: 200,
      description: 'Get featured on homepage for 1 month'
    },
    {
      type: 'ig_promo',
      icon: Instagram,
      title: 'Instagram Promotion',
      cost: 150,
      description: 'Promotion post on our Instagram'
    },
    {
      type: 'event_entry',
      icon: Ticket,
      title: 'Event Priority Entry',
      cost: 100,
      description: 'Priority access to creator events'
    },
    {
      type: 'collab_priority',
      icon: Briefcase,
      title: 'Brand Collab Priority',
      cost: 300,
      description: 'Priority matching for brand deals'
    },
  ];

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
        Points & Rewards
      </h1>

      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg mb-6 flex items-center">
          <CheckCircle size={20} className="mr-2" />
          Redemption request submitted!
        </div>
      )}

      {/* Balance */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl p-8 mb-8">
        <div className="text-white/80 text-sm mb-2">Current Balance</div>
        <div className="text-5xl font-display font-bold text-white mb-4">
          {data?.balance || 0} <span className="text-2xl">pts</span>
        </div>
        <p className="text-white/60 text-sm">
          Redeem points for exclusive rewards and opportunities
        </p>
      </div>

      {/* Redemption Options */}
      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        {redemptionOptions.map((option) => {
          const Icon = option.icon;
          const canAfford = (data?.balance || 0) >= option.cost;
          
          return (
            <div
              key={option.type}
              className={`bg-bg-card rounded-xl p-6 border ${
                canAfford ? 'border-border' : 'border-border opacity-50'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-purple-glow/20 rounded-lg flex items-center justify-center">
                  <Icon size={24} className="text-primary" />
                </div>
                <div className="text-2xl font-display font-bold text-gold">
                  {option.cost} pts
                </div>
              </div>
              <h3 className="font-display text-xl font-semibold text-white mb-2">
                {option.title}
              </h3>
              <p className="text-muted text-sm mb-4">
                {option.description}
              </p>
              <button
                onClick={() => handleSubmit((formData) => {
                  onSubmit({ rewardType: option.type, pointsCost: option.cost });
                })()}
                disabled={!canAfford || submitting}
                className="w-full btn-outline text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {canAfford ? 'Redeem Now' : 'Need More Points'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Points History */}
      <div className="bg-bg-card rounded-xl p-6 border border-border">
        <h2 className="font-display text-xl font-bold text-white mb-4">
          Points History
        </h2>

        {data?.history?.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <p>No points transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.history?.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-bg rounded-lg"
              >
                <div>
                  <div className="font-medium text-white capitalize">
                    {transaction.reason.replace('_', ' ')}
                  </div>
                  <div className="text-sm text-muted">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                    {transaction.note && ` • ${transaction.note}`}
                  </div>
                </div>
                <div className={`text-lg font-bold ${
                  transaction.type === 'earn' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {transaction.type === 'earn' ? '+' : ''}{transaction.points} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Points;
