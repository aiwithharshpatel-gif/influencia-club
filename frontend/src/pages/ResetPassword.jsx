import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import api from '../utils/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const password = watch('password', '');

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Invalid or missing password reset token.');
      return;
    }

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword: data.password
      });

      if (response.data.success) {
        setIsSuccess(true);
        toast.success('Password updated successfully!');
        setTimeout(() => {
          navigate('/login');
        }, 2500);
      } else {
        toast.error(response.data.message || 'Failed to reset password');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset link is invalid or expired.');
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

            {!token ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
                  <AlertTriangle size={28} />
                </div>
                <h2 className="font-display text-2xl font-bold text-white">Invalid Reset Link</h2>
                <p className="text-muted text-xs leading-relaxed max-w-xs mx-auto">
                  This password reset link is invalid or has expired. Please request a new link from the forgot password page.
                </p>
                <div className="pt-2">
                  <Link
                    to="/forgot-password"
                    className="btn-primary inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-xs font-bold shadow-lg shadow-gold/20"
                  >
                    <span>Request New Link</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ) : isSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="font-display text-2xl font-bold text-white">Password Updated!</h2>
                <p className="text-muted text-xs leading-relaxed max-w-xs mx-auto">
                  Your password has been reset successfully. Redirecting you to the login page...
                </p>
                <div className="pt-2">
                  <Link
                    to="/login"
                    className="btn-primary inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-xs font-bold shadow-lg shadow-gold/20"
                  >
                    <span>Proceed to Login</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-tr from-gold/20 via-primary/20 to-gold/10 border border-gold/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gold/10">
                    <ShieldCheck size={28} className="text-gold" />
                  </div>
                  <h1 className="font-display text-3xl font-bold text-white mb-2">
                    Reset Password
                  </h1>
                  <p className="text-muted text-sm leading-relaxed">
                    Create a strong, unique password with at least 8 characters.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
                        <Lock size={18} />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-10 py-3 bg-bg-cardLight border ${
                          errors.password ? 'border-red-500' : 'border-border'
                        } rounded-xl text-white placeholder-muted/60 focus:outline-none focus:border-gold transition-colors text-sm`}
                        {...register('password', {
                          required: 'Password is required',
                          minLength: {
                            value: 8,
                            message: 'Password must be at least 8 characters long'
                          }
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
                        <Lock size={18} />
                      </span>
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-10 py-3 bg-bg-cardLight border ${
                          errors.confirmPassword ? 'border-red-500' : 'border-border'
                        } rounded-xl text-white placeholder-muted/60 focus:outline-none focus:border-gold transition-colors text-sm`}
                        {...register('confirmPassword', {
                          required: 'Please confirm your new password',
                          validate: (val) => val === password || 'Passwords do not match'
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                      >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-gold/20 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <span>Save New Password</span>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ResetPassword;
