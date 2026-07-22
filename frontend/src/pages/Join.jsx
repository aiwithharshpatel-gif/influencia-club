import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Gift, DollarSign, Users, TrendingUp, CheckCircle, Trophy, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const formatFollowers = (count) => {
  if (!count) return '0';
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 100000) {
    return (count / 100000).toFixed(1).replace(/\.0$/, '') + 'L';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return count.toString();
};

const Join = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyOTP } = useAuth();
  const [step, setStep] = useState('form'); // form, otp, success
  const [email, setEmail] = useState('');
  const [userMobile, setUserMobile] = useState('');
  const [referralCodeFromUrl] = useState(searchParams.get('ref') || '');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.get('/creators/leaderboard');
        if (response.data.success) {
          setLeaderboard(response.data.leaderboard);
        }
      } catch (err) {
        console.error('Waitlist leaderboard error:', err);
      } finally {
        setLoadingLeaderboard(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const handleFromUrl = searchParams.get('handle') || '';
  const [igProfile, setIgProfile] = useState(null);
  const [igConnecting, setIgConnecting] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      referralCode: referralCodeFromUrl,
      instagram: handleFromUrl
    }
  });

  const handleInstagramConnect = async () => {
    try {
      setIgConnecting(true);
      const res = await api.get('/auth/instagram/auth-url');
      const authUrl = res.data.url;

      const width = 520;
      const height = 680;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      window.open(
        authUrl,
        'Instagram OAuth Connect',
        `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to initiate Instagram connection');
    } finally {
      setIgConnecting(false);
    }
  };

  useEffect(() => {
    const handleOAuthMessage = async (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'instagram-oauth-success') {
        const { code, username } = event.data;
        try {
          setIgConnecting(true);
          const res = await api.post('/auth/instagram/authenticate', { code, username });
          if (res.data.success && res.data.existingUser) {
            toast.success('Account exists! Logged in successfully.');
            window.location.href = '/dashboard';
          } else if (res.data.registrationRequired) {
            toast.success('Instagram profile synced! Complete registration.');
            setIgProfile({
              username: res.data.igProfile.username,
              fullName: res.data.igProfile.fullName,
              profilePicUrl: res.data.igProfile.profilePicUrl,
              followersCount: res.data.igProfile.followersCount,
              code: res.data.igProfile.accessToken || code
            });
            setValue('instagram', res.data.igProfile.username);
            setValue('name', res.data.igProfile.fullName);
          }
        } catch (err) {
          console.error(err);
          toast.error(err.response?.data?.message || 'Instagram connection failed');
        } finally {
          setIgConnecting(false);
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [setValue]);

  useEffect(() => {
    const handleUrlPreFill = async () => {
      if (handleFromUrl) {
        try {
          setIgConnecting(true);
          const codeFromUrl = searchParams.get('code') || 'mock_access_token_123';
          const res = await api.post('/auth/instagram/authenticate', { code: codeFromUrl, username: handleFromUrl });
          if (res.data.success && res.data.existingUser) {
            toast.success('Account exists! Logged in successfully.');
            window.location.href = '/dashboard';
          } else if (res.data.registrationRequired) {
            setIgProfile({
              username: res.data.igProfile.username,
              fullName: res.data.igProfile.fullName,
              profilePicUrl: res.data.igProfile.profilePicUrl,
              followersCount: res.data.igProfile.followersCount,
              code: res.data.igProfile.accessToken || codeFromUrl
            });
            setValue('instagram', res.data.igProfile.username);
            setValue('name', res.data.igProfile.fullName);
          }
        } catch (err) {
          console.error('Error pre-filling Instagram details from URL:', err);
        } finally {
          setIgConnecting(false);
        }
      }
    };
    handleUrlPreFill();
  }, [handleFromUrl, searchParams, setValue]);

  const benefits = [
    {
      icon: Gift,
      title: 'Personal Branding',
      description: 'Build your unique identity in the creator economy'
    },
    {
      icon: DollarSign,
      title: 'Paid Collaborations',
      description: 'Earn from authentic brand partnerships'
    },
    {
      icon: Users,
      title: 'Community Growth',
      description: 'Network with fellow creators and industry experts'
    },
    {
      icon: TrendingUp,
      title: 'Refer & Earn',
      description: 'Earn points for every friend you refer'
    },
  ];

  const onSubmit = async (data) => {
    try {
      if (igProfile) {
        const payload = {
          ...data,
          instagram: igProfile.username,
          code: igProfile.code
        };
        const response = await api.post('/auth/instagram/register-complete', payload);
        if (response.data.success) {
          toast.success('Registration successful! Welcome to Influenzia Club');
          window.location.href = '/dashboard';
        }
      } else {
        const payload = { ...data, password: data.mobile };
        const response = await api.post('/auth/register', payload);
        if (response.data.success) {
          toast.success('Verification code sent to your email!');
          setEmail(data.email);
          setUserMobile(data.mobile);
          setStep('otp');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      
      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left Column - Benefits */}
            <div>
              <h1 className="font-display text-5xl font-bold text-white mb-6">
                Become a Part of <span className="gradient-text">Influenzia Club</span>
              </h1>
              <p className="text-muted text-lg mb-12">
                Join India's fastest-growing creator community and unlock exclusive opportunities
              </p>

              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-purple-glow rounded-lg flex items-center justify-center flex-shrink-0">
                      <benefit.icon size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-semibold text-white mb-1">
                        {benefit.title}
                      </h3>
                      <p className="text-muted">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Refer & Earn Section */}
              <div className="mt-12 bg-glass rounded-xl p-6 border border-border">
                <h3 className="font-display text-2xl font-bold text-white mb-4">
                  Refer & Earn
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-bg-card rounded-lg p-4 text-center">
                    <div className="text-gold font-bold text-2xl mb-1">+10 pts</div>
                    <div className="text-muted text-sm">Signup Bonus</div>
                  </div>
                  <div className="bg-bg-card rounded-lg p-4 text-center">
                    <div className="text-gold font-bold text-2xl mb-1">+50 pts</div>
                    <div className="text-muted text-sm">Per Referral</div>
                  </div>
                  <div className="bg-bg-card rounded-lg p-4 text-center col-span-2">
                    <div className="text-gold font-bold text-2xl mb-1">+100 pts</div>
                    <div className="text-muted text-sm">Every 5th Referral Bonus</div>
                  </div>
                </div>
              </div>

              {/* Waitlist Leaderboard */}
              <div className="mt-12 bg-glass rounded-xl p-6 border border-border space-y-4 shadow-lg shadow-gold-glow/5">
                <h3 className="font-display text-2xl font-bold text-white flex items-center gap-2">
                  <Trophy className="text-yellow-400" size={24} /> Waitlist Leaderboard
                </h3>
                <p className="text-xs text-muted">Top referring creators earning early premium access</p>
                
                {loadingLeaderboard ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-muted text-xs">
                    No refer rankings yet. Be the first to refer!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((member) => {
                      const isTop = member.rank === 1;
                      let rankBadge = 'text-muted';
                      if (isTop) rankBadge = 'text-yellow-400';
                      if (member.rank === 2) rankBadge = 'text-slate-300';
                      if (member.rank === 3) rankBadge = 'text-amber-600';

                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 bg-slate-950/40 border border-border/40 rounded-xl hover:border-border/80 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {/* Rank */}
                            <div className="w-6 flex items-center justify-center font-black">
                              {isTop ? (
                                <Crown className="text-yellow-400 fill-yellow-400 animate-pulse" size={16} />
                              ) : (
                                <span className={`text-xs ${rankBadge}`}>#{member.rank}</span>
                              )}
                            </div>

                            {/* Initials or photo */}
                            {member.photoUrl ? (
                              <img
                                src={member.photoUrl}
                                alt={member.name}
                                className="w-8 h-8 rounded-full object-cover border border-white/10"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs uppercase border border-white/5">
                                {member.name.substring(0, 2)}
                              </div>
                            )}

                            {/* Creator details */}
                            <div>
                              <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                                {member.name}
                                {member.isVerified && (
                                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex items-center justify-center text-[7px] text-white font-bold" title="Verified Creator">✓</span>
                                )}
                              </div>
                              <span className="text-[9px] text-muted uppercase font-bold tracking-wider">
                                {member.category.replace(/_/g, ' ')} · {member.city}
                              </span>
                            </div>
                          </div>

                          {/* Refers */}
                          <div className="text-right font-display font-black text-white text-xs">
                            {member.referralsCount} <span className="text-[9px] font-bold text-muted">refers</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Registration Form */}
            <div className="bg-bg-card rounded-2xl p-8 border border-border">
              {step === 'form' && (
                <>
                  <h2 className="font-display text-3xl font-bold text-white mb-6">
                    Create Your Account
                  </h2>

                  {!igProfile ? (
                    <button
                      type="button"
                      onClick={handleInstagramConnect}
                      disabled={igConnecting}
                      className="w-full mb-6 bg-gradient-to-r from-[#e1306c] to-[#c13584] text-white py-4 rounded-lg font-bold flex items-center justify-center space-x-2 shadow-lg shadow-pink-500/10 hover:opacity-95 transition-all outline-none"
                    >
                      <div className="w-5 h-5 flex items-center justify-center rounded bg-white/20">
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                        </svg>
                      </div>
                      <span>{igConnecting ? 'Connecting...' : 'Continue with Instagram'}</span>
                    </button>
                  ) : (
                    <div className="mb-6 p-4 bg-gradient-to-r from-purple-glow/30 to-gold-glow/5 border border-gold/20 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={igProfile.profilePicUrl}
                          alt={igProfile.username}
                          className="w-12 h-12 rounded-full border border-gold/40 object-cover"
                        />
                        <div>
                          <h4 className="text-white font-bold text-sm">@{igProfile.username}</h4>
                          <p className="text-gold text-xs font-semibold">{formatFollowers(igProfile.followersCount)} followers synced</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIgProfile(null)}
                        className="text-xs text-muted hover:text-red-400 font-medium underline"
                      >
                        Change Account
                      </button>
                    </div>
                  )}

                  {igProfile && (
                    <div className="flex items-start space-x-2 bg-[#d4af37]/5 border border-[#d4af37]/10 p-3 rounded-xl mb-6">
                      <p className="text-[10px] text-[#a1a1aa] leading-relaxed">
                        ✨ **Instagram Connected!** Your profile photo, handle, and followers count will be fully synced. Complete the remaining fields to finalize.
                      </p>
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        {...register('name', { required: 'Name is required' })}
                        className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                        placeholder="Enter your full name"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        {...register('email', { 
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                        placeholder="your@email.com"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        {...register('mobile', { 
                          required: 'Mobile number is required',
                          pattern: {
                            value: /^[6-9]\d{9}$/,
                            message: 'Enter a valid 10-digit Indian mobile number'
                          }
                        })}
                        className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                        placeholder="9876543210"
                      />
                      {errors.mobile && (
                        <p className="text-red-500 text-sm mt-1">{errors.mobile.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">
                        Instagram Handle *
                      </label>
                      <input
                        type="text"
                        {...register('instagram', { 
                          required: 'Instagram handle is required',
                          pattern: {
                            value: /^[a-zA-Z0-9_.]+$/,
                            message: 'Invalid Instagram handle'
                          }
                        })}
                        readOnly={!!igProfile}
                        className={`w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary ${igProfile ? 'opacity-70 cursor-default bg-slate-950/40 select-none' : ''}`}
                        placeholder="@username"
                      />
                      {errors.instagram && (
                        <p className="text-red-500 text-sm mt-1">{errors.instagram.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-muted mb-2">
                          Category *
                        </label>
                        <select
                          {...register('category', { required: 'Category is required' })}
                          className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                        >
                          <option value="">Select</option>
                          <option value="influencer">Influencer</option>
                          <option value="actor">Actor</option>
                          <option value="model">Model</option>
                          <option value="creator">Content Creator</option>
                          <option value="public_figure">Public Figure</option>
                        </select>
                        {errors.category && (
                          <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-muted mb-2">
                          City *
                        </label>
                        <select
                          {...register('city', { required: 'City is required' })}
                          className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                        >
                          <option value="">Select</option>
                          <option value="Ahmedabad">Ahmedabad</option>
                          <option value="Surat">Surat</option>
                          <option value="Vadodara">Vadodara</option>
                          <option value="Rajkot">Rajkot</option>
                          <option value="Other">Other</option>
                        </select>
                        {errors.city && (
                          <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">
                        Referral Code (Optional)
                      </label>
                      <input
                        type="text"
                        {...register('referralCode')}
                        className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                        placeholder="Enter referral code"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full btn-primary py-4 disabled:opacity-50 font-bold"
                    >
                      {isSubmitting 
                        ? (igProfile ? 'Creating Account...' : 'Sending Code...') 
                        : (igProfile ? 'Complete Registration ✨' : 'Send Verification Code')}
                    </button>

                    <p className="text-center text-muted text-sm mt-6">
                      Already have an account?{' '}
                      <Link to="/login" className="text-primary hover:text-primary-soft font-medium">
                        Sign In
                      </Link>
                    </p>
                  </form>
                </>
              )}

              {step === 'otp' && (
                <OTPVerification 
                  email={email} 
                  verifyOTP={verifyOTP}
                  onSuccess={() => setStep('success')} 
                  onBack={() => setStep('form')} 
                />
              )}

              {step === 'success' && (
                <SuccessMessage mobile={userMobile} />
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const OTPVerification = ({ email, verifyOTP, onSuccess, onBack }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await verifyOTP(email, otp);
      if (response.success) {
        toast.success('Registration successful!');
        onSuccess();
      } else {
        setError(response.message || 'Invalid OTP');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="font-display text-3xl font-bold text-white mb-6">
        Verify Your Email
      </h2>
      
      <p className="text-muted mb-6">
        We've sent a 6-digit code to <span className="text-white">{email}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted mb-2">
            Enter 6-digit OTP
          </label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white text-center text-2xl tracking-widest focus:outline-none focus:border-primary"
            placeholder="000000"
          />
          {error && (
            <p className="text-red-500 text-sm mt-1">{error}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full btn-primary py-4 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-muted text-sm hover:text-white"
        >
          Back to Registration
        </button>
      </form>
    </div>
  );
};

const SuccessMessage = ({ mobile }) => {
  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={40} className="text-green-500" />
      </div>
      <h2 className="font-display text-3xl font-bold text-white mb-4">
        Welcome to Influenzia Club!
      </h2>
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 mb-8">
        <p className="text-white font-medium mb-2">Registration Successful!</p>
        <p className="text-muted text-sm leading-relaxed">
          Your default password is your registered mobile number:
          <br />
          <span className="text-primary font-bold text-lg">{mobile}</span>
        </p>
      </div>
      <p className="text-muted mb-8">
        You are now logged in. Access your dashboard to complete your profile.
      </p>
      <div className="space-y-4">
        <a href="/dashboard" className="w-full btn-primary block text-center py-4">
          Go to Dashboard
        </a>
        <a href="/login" className="w-full btn-outline block text-center py-4">
          Login to your Account
        </a>
        <p className="text-xs text-muted">
          Note: You can change your password in profile settings later.
        </p>
      </div>
    </div>
  );
};

export default Join;
