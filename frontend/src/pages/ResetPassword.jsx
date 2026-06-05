import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');
  const token = searchParams.get('token');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async ({ newPassword }) => {
    try {
      setError('');
      await api.post('/auth/reset-password', { token, newPassword });
      setComplete(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to reset password');
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-md mx-auto bg-bg-card rounded-2xl p-8 border border-border">
          <h1 className="font-display text-3xl font-bold text-white mb-6">Choose a New Password</h1>
          {!token ? (
            <p className="text-red-400">This reset link is invalid.</p>
          ) : complete ? (
            <div>
              <p className="text-green-400 mb-6">Your password has been updated.</p>
              <Link to="/login" className="btn-primary block text-center py-3">Sign In</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <input
                type="password"
                autoComplete="new-password"
                placeholder="New password"
                {...register('newPassword', {
                  required: 'Password is required',
                  minLength: { value: 8, message: 'Use at least 8 characters' },
                  pattern: {
                    value: /^(?=.*[A-Za-z])(?=.*\d).+$/,
                    message: 'Include at least one letter and one number'
                  }
                })}
                className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white"
              />
              {errors.newPassword && <p className="text-red-500 text-sm">{errors.newPassword.message}</p>}
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Confirm password"
                {...register('confirmPassword', {
                  required: 'Confirm your password',
                  validate: (value) => value === watch('newPassword') || 'Passwords do not match'
                })}
                className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white"
              />
              {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>}
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button disabled={isSubmitting} className="w-full btn-primary py-3 disabled:opacity-50">
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPassword;
