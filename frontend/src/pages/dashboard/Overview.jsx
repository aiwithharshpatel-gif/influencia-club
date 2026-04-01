import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, Award, Eye, ArrowRight, MessageSquare } from 'lucide-react';
import api from '../../utils/api';

const DashboardOverview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const response = await api.get('/dashboard/overview');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching overview:', error);
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

  const stats = [
    {
      icon: Award,
      label: 'Points Balance',
      value: data?.creator?.pointsBalance || 0,
      color: 'text-gold'
    },
    {
      icon: Users,
      label: 'Referrals',
      value: data?.referralCount || 0,
      color: 'text-primary'
    },
    {
      icon: MessageSquare,
      label: 'Active Collabs',
      value: data?.activeCollabs || 0,
      color: 'text-green-400'
    },
    {
      icon: Eye,
      label: 'Profile Completion',
      value: `${data?.profileCompletion || 0}%`,
      color: 'text-purple-400'
    },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-white mb-8">
        Dashboard Overview
      </h1>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-bg-card rounded-xl p-6 border border-border"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-purple-glow/20 rounded-lg flex items-center justify-center`}>
                  <Icon size={24} className={stat.color} />
                </div>
              </div>
              <div className={`text-3xl font-display font-bold ${stat.color} mb-1`}>
                {stat.value}
              </div>
              <div className="text-muted text-sm">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-bg-card rounded-xl p-6 border border-border mb-8">
        <h2 className="font-display text-xl font-bold text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/dashboard/profile"
            className="flex items-center justify-between p-4 bg-bg rounded-lg hover:bg-bg-card transition-colors border border-border"
          >
            <span className="text-white font-medium">Edit Profile</span>
            <ArrowRight size={18} className="text-muted" />
          </Link>
          <Link
            to="/dashboard/referrals"
            className="flex items-center justify-between p-4 bg-bg rounded-lg hover:bg-bg-card transition-colors border border-border"
          >
            <span className="text-white font-medium">Share Referral</span>
            <ArrowRight size={18} className="text-muted" />
          </Link>
          <Link
            to="/dashboard/points"
            className="flex items-center justify-between p-4 bg-bg rounded-lg hover:bg-bg-card transition-colors border border-border"
          >
            <span className="text-white font-medium">Redeem Points</span>
            <ArrowRight size={18} className="text-muted" />
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-bg-card rounded-xl p-6 border border-border">
        <h2 className="font-display text-xl font-bold text-white mb-4">
          Getting Started Tips
        </h2>
        <div className="space-y-3">
          <Tip 
            text="Complete your profile to increase visibility" 
            done={data?.profileCompletion === 100}
            link="/dashboard/profile"
          />
          <Tip 
            text="Share your referral link to earn points" 
            done={data?.referralCount > 0}
            link="/dashboard/referrals"
          />
          <Tip 
            text="Get verified to stand out to brands" 
            done={data?.creator?.isVerified}
          />
          <Tip 
            text="Redeem points for featured creator slots" 
            done={false}
            link="/dashboard/points"
          />
        </div>
      </div>
    </div>
  );
};

const Tip = ({ text, done, link }) => {
  const content = (
    <div className="flex items-center justify-between p-4 bg-bg rounded-lg">
      <div className="flex items-center space-x-3">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
          done ? 'bg-green-500' : 'bg-border'
        }`}>
          {done && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>}
        </div>
        <span className={done ? 'text-muted line-through' : 'text-white'}>{text}</span>
      </div>
      {link && !done && (
        <ArrowRight size={16} className="text-muted" />
      )}
    </div>
  );

  return link ? <Link to={link}>{content}</Link> : content;
};

export default DashboardOverview;
