import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const InstagramCallback = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('connecting'); // 'connecting' | 'redirecting' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    let code = searchParams.get('code');
    if (code) {
      code = code.replace(/#_$/, '').trim();
    }
    const username = searchParams.get('username') || searchParams.get('handle') || '';
    const errorParam = searchParams.get('error') || searchParams.get('error_reason');

    if (errorParam && !code) {
      if (isMounted) {
        setStatus('error');
        setErrorMessage('Instagram authorization was cancelled or denied.');
      }
      return;
    }

    if (!code) {
      if (isMounted) {
        setStatus('error');
        setErrorMessage('No authorization code was returned from Instagram.');
      }
      return;
    }

    const messagePayload = { type: 'instagram-oauth-success', code, username };

    // 1. Notify listeners (for popup scenario)
    try {
      localStorage.setItem('instagram_oauth_result', JSON.stringify({
        type: 'instagram-oauth-success',
        code: code,
        username: username,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error('LocalStorage write failed:', e);
    }

    try {
      const bc = new BroadcastChannel('instagram_oauth');
      bc.postMessage(messagePayload);
      bc.close();
    } catch (e) {
      console.error('BroadcastChannel failed:', e);
    }

    const hasOpener = Boolean(window.opener && window.opener !== window && !window.opener.closed);

    if (hasOpener) {
      try {
        window.opener.postMessage(messagePayload, '*');
      } catch (e) {
        console.error('postMessage failed:', e);
      }
      setTimeout(() => {
        try {
          window.close();
        } catch (e) {}
      }, 300);
    }

    // 2. Direct Auth Handler for mobile / full page redirect / non-closing popup
    const handleDirectAuth = async () => {
      try {
        const res = await api.post('/auth/instagram/authenticate', { code, username });
        if (!isMounted) return;

        if (res.data.success && res.data.existingUser) {
          const token = res.data.token || res.data.accessToken;
          if (token) localStorage.setItem('token', token);
          if (res.data.creator) {
            localStorage.setItem('user', JSON.stringify(res.data.creator));
            localStorage.setItem('role', 'creator');
          }
          setStatus('redirecting');
          toast.success('Instagram verified! Logging in...');
          window.location.href = '/dashboard';
        } else if (res.data.registrationRequired) {
          setStatus('redirecting');
          try {
            localStorage.setItem('temp_ig_profile', JSON.stringify({
              igProfile: {
                username: res.data.igProfile.username,
                fullName: res.data.igProfile.fullName,
                profilePicUrl: res.data.igProfile.profilePicUrl,
                followersCount: res.data.igProfile.followersCount,
                code: res.data.igProfile.accessToken || code
              },
              timestamp: Date.now()
            }));
          } catch (e) {}

          toast.success('Instagram connected! Redirecting to complete setup...');
          const resolvedHandle = res.data.igProfile?.username || username || '';
          window.location.href = `/join?handle=${encodeURIComponent(resolvedHandle)}`;
        } else {
          setStatus('error');
          setErrorMessage(res.data.message || 'Instagram connection failed.');
        }
      } catch (err) {
        console.error('Direct Instagram authentication error:', err);
        if (!isMounted) return;
        // If window is a popup that was already handled by parent window, ignore
        if (hasOpener) return;
        setStatus('error');
        setErrorMessage(err.response?.data?.message || 'Failed to authenticate with Instagram. Please try again.');
      }
    };

    let timer;
    if (hasOpener) {
      // Give popup 800ms to close; if window is still open, proceed with direct auth
      timer = setTimeout(() => {
        if (!window.closed && isMounted) {
          handleDirectAuth();
        }
      }, 800);
    } else {
      handleDirectAuth();
    }

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-4">
      {status === 'connecting' && (
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-14 h-14 border-4 border-[#e1306c] border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="text-lg font-bold">Connecting with Instagram...</h3>
          <p className="text-xs text-gray-400">Verifying your account details securely with Meta.</p>
        </div>
      )}

      {status === 'redirecting' && (
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={28} />
          </div>
          <h3 className="text-lg font-bold">Instagram Connected!</h3>
          <p className="text-xs text-gray-400">Redirecting you back to Influenzia Club...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 text-center max-w-md w-full shadow-2xl space-y-5">
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Connection Issue</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{errorMessage}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to="/join"
              className="flex-1 px-4 py-2.5 bg-[#e1306c] hover:bg-[#c13584] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1"
            >
              <span>Go to Sign Up</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/login"
              className="flex-1 px-4 py-2.5 bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center"
            >
              <span>Go to Login</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstagramCallback;


