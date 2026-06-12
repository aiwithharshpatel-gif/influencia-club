import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Key } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

const BrandLogin = () => {
  const navigate = useNavigate();
  const { brandLogin, brandVerifyOTP } = useAuth();
  const [step, setStep] = useState(1); // 1 = Email, 2 = OTP
  const [email, setEmail] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const handleSendOTP = async (data) => {
    try {
      const response = await brandLogin(data.email);
      if (response.success) {
        toast.success('Login verification code sent to your email!');
        setEmail(data.email);
        setStep(2);
      } else {
        toast.error(response.message || 'Failed to send verification code');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email verification failed. Please ensure you have a campaign inquiry.');
    }
  };

  const handleVerifyOTP = async (data) => {
    try {
      const response = await brandVerifyOTP(email, data.otp);
      if (response.success) {
        toast.success('Login successful!');
        navigate('/brand/dashboard');
      } else {
        toast.error(response.message || 'Invalid verification code');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-between">
      <Navbar />
      
      <section className="pt-32 pb-20 flex-grow flex items-center justify-center">
        <div className="max-w-md w-full px-4">
          <div className="bg-bg-card rounded-2xl p-8 border border-border shadow-2xl relative overflow-hidden">
            {/* Glowing Accent */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-glow rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                {step === 1 ? (
                  <Mail size={32} className="text-white animate-pulse" />
                ) : (
                  <Key size={32} className="text-white" />
                )}
              </div>
              <h1 className="font-display text-3xl font-bold text-white mb-2">
                Brand Portal
              </h1>
              <p className="text-muted text-sm">
                {step === 1 
                  ? 'Enter your registered business email to access your campaign dashboard' 
                  : `Enter the 6-digit login code sent to ${email}`}
              </p>
            </div>

            {step === 1 ? (
              <form onSubmit={handleSubmit(handleSendOTP)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">
                    Business Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      {...register('email', { 
                        required: 'Business email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className="w-full bg-bg border border-border rounded-lg pl-4 pr-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                      placeholder="brand@company.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary py-4 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <span>{isSubmitting ? 'Requesting Code...' : 'Get Login Code'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit(handleVerifyOTP)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    {...register('otp', { 
                      required: 'Verification code is required',
                      pattern: {
                        value: /^\d{6}$/,
                        message: 'Verification code must be 6 digits'
                      }
                    })}
                    className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white text-center text-2xl font-bold tracking-widest focus:outline-none focus:border-primary transition-colors"
                    placeholder="000000"
                  />
                  {errors.otp && (
                    <p className="text-red-500 text-sm mt-1 text-center">{errors.otp.message}</p>
                  )}
                </div>

                <div className="flex justify-between items-center text-sm">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-muted hover:text-white transition-colors"
                  >
                    Change Email
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary py-4 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <span>{isSubmitting ? 'Verifying...' : 'Verify & Log In'}</span>
                </button>
              </form>
            )}

            <div className="text-center text-muted text-sm mt-6 pt-6 border-t border-border/50">
              Not a client yet?{' '}
              <Link to="/brands" className="text-primary hover:text-primary-soft font-medium transition-colors">
                Start a Campaign
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BrandLogin;
