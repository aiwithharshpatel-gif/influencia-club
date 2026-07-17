import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';
import api from '../utils/api';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const [igConnecting, setIgConnecting] = useState(false);

  const handleInstagramLogin = () => {
    const width = 520;
    const height = 680;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    window.open(
      '/oauth/instagram/mock',
      'Instagram Login Sandbox',
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
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
            toast.success('Login successful!');
            window.location.href = '/dashboard';
          } else if (res.data.registrationRequired) {
            toast.error('No account connected to this Instagram. Redirecting to signup...');
            setTimeout(() => {
              navigate(`/join?handle=${username}&code=${code}`);
            }, 1500);
          }
        } catch (err) {
          console.error(err);
          toast.error(err.response?.data?.message || 'Instagram login failed');
        } finally {
          setIgConnecting(false);
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [navigate]);

  const onSubmit = async (data) => {
    try {
      const response = await login(data.email, data.password);
      if (response.success) {
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        toast.error(response.message || 'Login failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
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
              <button
                type="button"
                onClick={handleInstagramLogin}
                disabled={igConnecting}
                className="w-full mb-6 bg-gradient-to-r from-[#e1306c] to-[#c13584] text-white py-4 rounded-lg font-bold flex items-center justify-center space-x-2 shadow-lg shadow-pink-500/10 hover:opacity-95 transition-all outline-none"
              >
                <div className="w-5 h-5 flex items-center justify-center rounded bg-white/20">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </div>
                <span>{igConnecting ? 'Logging in...' : 'Login with Instagram'}</span>
              </button>

              <div className="flex items-center justify-between mb-4">
                <hr className="w-full border-border/50" />
                <span className="px-3 text-muted text-xs uppercase font-bold tracking-wider whitespace-nowrap bg-bg-card">or Email</span>
                <hr className="w-full border-border/50" />
              </div>

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
                  placeholder="********"
                />
                <p className="text-xs text-primary/60 mt-2 italic">
                  Hint: Your default password is your registered mobile number.
                </p>
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

            <div className="mt-6 pt-6 border-t border-border/50 text-center">
              <p className="text-muted text-sm">
                Are you a Brand Partner?{' '}
                <Link to="/brand-login" className="text-primary hover:text-primary-soft font-medium">
                  Access Brand Portal
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Login;
