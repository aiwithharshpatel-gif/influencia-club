import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';

const ForgotPassword = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async ({ email }) => {
    try {
      setError('');
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send reset link');
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-md mx-auto bg-bg-card rounded-2xl p-8 border border-border">
          <h1 className="font-display text-3xl font-bold text-white mb-3">Reset Password</h1>
          <p className="text-muted mb-6">Enter your account email to receive a secure reset link.</p>
          {message ? (
            <div className="bg-green-500/10 border border-green-500/40 text-green-400 rounded-lg p-4">
              {message}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register('email', { required: 'Email is required' })}
                className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white"
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button disabled={isSubmitting} className="w-full btn-primary py-3 disabled:opacity-50">
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}
          <Link to="/login" className="block text-center text-primary mt-6">Back to sign in</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
