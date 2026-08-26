import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { KeyRound, Mail, ArrowLeft, CheckCircle2, Send, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import api from '../utils/api';

const ForgotPassword = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/auth/forgot-password', { email: data.email });
      if (response.data.success) {
        setSubmittedEmail(data.email);
        setSubmitted(true);
        toast.success('Password reset instructions sent!');
      } else {
        toast.error(response.data.message || 'Failed to send reset link');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
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

            {!submitted ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-tr from-gold/20 via-primary/20 to-gold/10 border border-gold/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gold/10">
                    <KeyRound size={28} className="text-gold animate-pulse" />
                  </div>
                  <h1 className="font-display text-3xl font-bold text-white mb-2">
                    Forgot Password?
                  </h1>
                  <p className="text-muted text-sm leading-relaxed">
                    Enter the email address associated with your Influenzia Club account and we will send you a password reset link.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-2">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
                        <Mail size={18} />
                      </span>
                      <input
                        type="email"
                        placeholder="your@email.com"
                        className={`w-full pl-10 pr-4 py-3 bg-bg-cardLight border ${
                          errors.email ? 'border-red-500' : 'border-border'
                        } rounded-xl text-white placeholder-muted/60 focus:outline-none focus:border-gold transition-colors text-sm`}
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>
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
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <Send size={16} />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4 space-y-5">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold text-white mb-2">
                    Check Your Inbox
                  </h3>
                  <p className="text-muted text-xs leading-relaxed max-w-xs mx-auto">
                    We sent a password reset link to <strong className="text-white">{submittedEmail}</strong>. Please check your inbox and spam folder.
                  </p>
                </div>
                <div className="p-3 bg-gold/5 border border-gold/20 rounded-xl text-[11px] text-muted flex items-start space-x-2 text-left">
                  <Sparkles size={16} className="text-gold shrink-0 mt-0.5" />
                  <span>The reset link will expire in 60 minutes for security purposes.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-gold hover:underline font-medium block mx-auto"
                >
                  Didn't receive it? Try another email
                </button>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-border/60 text-center">
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 text-sm text-muted hover:text-gold transition-colors"
              >
                <ArrowLeft size={16} />
                <span>Back to Login</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ForgotPassword;
