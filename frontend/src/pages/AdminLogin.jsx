import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { adminLogin, user, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Set Page SEO Metadata
    document.title = 'Admin Portal Access - Influenzia Club';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Secure login access point for system administrators of Influenzia Club next-gen influencer platform.');
    }

    // Redirect if already logged in as admin
    if (user && role === 'admin') {
      navigate('/admin/dashboard');
    }
  }, [user, role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all credentials');
      return;
    }

    try {
      setLoading(true);
      const res = await adminLogin(email, password);
      if (res.success) {
        toast.success('Admin authentication successful! Access granted.');
        navigate('/admin/dashboard');
      } else {
        toast.error(res.message || 'Invalid administrator credentials');
      }
    } catch (err) {
      toast.error('An error occurred during authentication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow animations */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-tr from-[#D4AF37]/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-96 h-96 bg-gradient-to-br from-yellow-600/5 to-transparent rounded-full blur-[120px] pointer-events-none" />

      {/* Main Login Card */}
      <div 
        id="admin_login_container"
        className="w-full max-w-md bg-[#0c0c0c]/80 border border-[#D4AF37]/20 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10"
      >
        {/* Header logo & title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#F4D06F] via-[#D4AF37] to-[#B8860B] p-[1.5px] mx-auto mb-4 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
            <div className="w-full h-full bg-[#0c0c0c] rounded-[14px] flex items-center justify-center">
              <ShieldAlert size={28} className="text-[#D4AF37] stroke-[1.8]" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-wide text-white flex items-center justify-center gap-1.5">
            Admin Portal <Sparkles size={16} className="text-[#D4AF37] animate-pulse" />
          </h1>
          <p className="text-xs text-[#888888] mt-1.5">
            Influenzia Club Administrator Authentication Gateway
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1 text-left">
            <label htmlFor="admin_email" className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/80">
              Admin Username (Email)
            </label>
            <div className="relative">
              <input
                type="email"
                id="admin_email"
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 bg-black/60 border border-[#D4AF37]/10 focus:border-[#D4AF37] rounded-xl text-sm outline-none transition-all placeholder-zinc-700"
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label htmlFor="admin_password" className="block text-xs font-semibold uppercase tracking-wider text-[#D4AF37]/80">
              Security Password
            </label>
            <div className="relative">
              <input
                type="password"
                id="admin_password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 bg-black/60 border border-[#D4AF37]/10 focus:border-[#D4AF37] rounded-xl text-sm outline-none transition-all placeholder-zinc-700"
              />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            id="admin_login_submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#F4D06F] via-[#D4AF37] to-[#B8860B] hover:shadow-[0_0_20px_rgba(212,175,55,0.25)] text-black font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>Authorizing Security...</span>
              </>
            ) : (
              <>
                <span>Access Console</span>
                <ArrowRight size={14} className="stroke-[2.5]" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer copyright */}
      <div className="absolute bottom-6 left-0 right-0 text-center text-[10px] text-zinc-600 tracking-wider">
        SECURE CONNECTED INTERFACE • ZCAD NEXORAA PVT. LTD. COPYRIGHT © 2026
      </div>
    </div>
  );
};

export default AdminLogin;
