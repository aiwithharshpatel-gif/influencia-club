import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Gift, DollarSign, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Join = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyOTP } = useAuth();
  const [step, setStep] = useState('form'); // form, otp, success
  const [email, setEmail] = useState('');
  const [userMobile, setUserMobile] = useState('');
  const [referralCodeFromUrl] = useState(searchParams.get('ref') || '');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      referralCode: referralCodeFromUrl
    }
  });

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
      const payload = { ...data, password: data.mobile };
      const response = await api.post('/auth/register', payload);
      if (response.data.success) {
        setEmail(data.email);
        setUserMobile(data.mobile);
        setStep('otp');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed. Please try again.');
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
                  🎁 Refer & Earn
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
            </div>

            {/* Right Column - Registration Form */}
            <div className="bg-bg-card rounded-2xl p-8 border border-border">
              {step === 'form' && (
                <>
                  <h2 className="font-display text-3xl font-bold text-white mb-6">
                    Create Your Account
                  </h2>
                  
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
                        className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
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
                      className="w-full btn-primary py-4 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Sending Code...' : 'Send Verification Code'}
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
        Welcome to Influenzia Club! 🎉
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
        <p className="text-xs text-muted">
          Note: You can change your password in profile settings later.
        </p>
      </div>
    </div>
  );
};

export default Join;
