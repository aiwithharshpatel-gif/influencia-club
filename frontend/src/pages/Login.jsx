import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      setError('');
      const response = await login(data.email, data.password);
      if (response.success) {
        navigate('/dashboard');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      
      <section className="pt-32 pb-20">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-bg-card rounded-2xl p-8 border border-border">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-glow rounded-full flex items-center justify-center mx-auto mb-4">
                <LogIn size={32} className="text-white" />
              </div>
              <h1 className="font-display text-3xl font-bold text-white mb-2">
                Welcome Back
              </h1>
              <p className="text-muted">
                Sign in to access your creator dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  Email
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
                  Password
                </label>
                <input
                  type="password"
                  {...register('password', { required: 'Password is required' })}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-border bg-bg text-primary focus:ring-primary"
                  />
                  <span className="ml-2 text-sm text-muted">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-soft">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary py-4 disabled:opacity-50"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-muted text-sm mt-6">
              Don't have an account?{' '}
              <Link to="/join" className="text-primary hover:text-primary-soft font-medium">
                Join Now
              </Link>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Login;
