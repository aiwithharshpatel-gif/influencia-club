import { useState } from 'react';
import { Camera, ShieldCheck, Info, X } from 'lucide-react';

const InstagramMockOAuth = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuthorize = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your Instagram username to connect');
      return;
    }

    setLoading(true);
    setError('');

    setTimeout(() => {
      // Send message to the window opener (the Profile page)
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'instagram-oauth-success',
            code: `mock_oauth_code_${Math.floor(Math.random() * 900000) + 100000}`,
            username: username.trim().replace(/^@/, '')
          },
          window.location.origin
        );
        window.close();
      } else {
        // Fallback if not opened in a popup
        alert('Instagram mock connection successful! Close this window and refresh your profile.');
        setLoading(false);
      }
    }, 1200);
  };

  const handleCancel = () => {
    if (window.opener) {
      window.opener.postMessage({ type: 'instagram-oauth-cancel' }, window.location.origin);
    }
    window.close();
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex items-center justify-center p-4">
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-[#e1306c]/10 to-[#833ab4]/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#18181b]/70 border border-[#27272a] rounded-3xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#27272a] mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[1.5px]">
              <div className="w-full h-full bg-[#18181b] rounded-[7px] flex items-center justify-center text-white">
                <Camera size={14} className="stroke-[2.5]" />
              </div>
            </div>
            <span className="font-semibold text-sm tracking-wide text-white">Meta Business Suite</span>
          </div>
          <button 
            onClick={handleCancel}
            className="p-1 hover:bg-[#27272a] text-[#a1a1aa] hover:text-white rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white mb-2">Connect to Influenzia Club</h2>
          <p className="text-[#a1a1aa] text-xs px-2">
            Influenzia Club is requesting permission to access your Instagram Professional Account insights and recent media feed.
          </p>
        </div>

        {/* Permissions list */}
        <div className="bg-[#27272a]/30 border border-[#27272a]/50 rounded-2xl p-4 mb-6 space-y-3">
          <h4 className="text-xs font-semibold text-[#fafafa] uppercase tracking-wider mb-2 flex items-center space-x-1">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Requested Permissions</span>
          </h4>
          <ul className="space-y-2.5 text-xs text-[#a1a1aa]">
            <li className="flex items-start space-x-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              <span>Access basic profile info (username, full name, profile picture)</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              <span>Access professional statistics (follower count, media count, engagement rate)</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-emerald-500 font-bold mt-0.5">•</span>
              <span>Access recent posts grid (media URL, permalink, like count, comment count)</span>
            </li>
          </ul>
        </div>

        {/* Input Form */}
        <form onSubmit={handleAuthorize} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-xs font-medium text-[#a1a1aa] mb-1.5 flex items-center space-x-1">
              <span>Instagram Handle</span>
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717a] text-sm">@</span>
              <input
                type="text"
                id="username"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="w-full pl-8 pr-4 py-2.5 bg-[#09090b]/80 border border-[#27272a] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] rounded-xl text-sm outline-none transition-all placeholder-[#52525b]"
              />
            </div>
            {error && <p className="text-red-500 text-xs mt-1 text-left">{error}</p>}
          </div>

          {/* Info Banner */}
          <div className="flex items-start space-x-2 bg-[#d4af37]/5 border border-[#d4af37]/10 p-3 rounded-xl">
            <Info size={16} className="text-[#d4af37] shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#a1a1aa] text-left leading-relaxed">
              This is a secure developer sandbox authorization. Input any professional Instagram handle to generate realistic mock statistics.
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-semibold rounded-xl transition-all outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 bg-gradient-to-r from-[#e1306c] to-[#c13584] hover:opacity-95 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(225,48,108,0.25)] flex items-center justify-center space-x-2 outline-none"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authorizing...</span>
                </>
              ) : (
                <span>Authorize & Connect</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InstagramMockOAuth;
