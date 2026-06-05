import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin, isAuthenticated, role } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  if (isAuthenticated && role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const onSubmit = async ({ email, password }) => {
    try {
      await adminLogin(email, password);
      navigate('/admin');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Admin sign in failed');
    }
  };

  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-bg-card border border-border rounded-2xl p-8">
        <h1 className="font-display text-3xl font-bold text-white mb-2">Admin Sign In</h1>
        <p className="text-muted mb-6">Authorized Influenzia Club staff only.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input
            type="email"
            autoComplete="email"
            placeholder="admin@influenziaclub.com"
            {...register('email', { required: 'Email is required' })}
            className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white"
          />
          {errors.email && <p className="text-red-400 text-sm">{errors.email.message}</p>}
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            {...register('password', { required: 'Password is required' })}
            className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white"
          />
          {errors.password && <p className="text-red-400 text-sm">{errors.password.message}</p>}
          <button disabled={isSubmitting} className="w-full btn-primary py-3 disabled:opacity-50">
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  );
};

export default AdminLogin;
