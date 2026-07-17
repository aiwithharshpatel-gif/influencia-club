import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const InstagramCallback = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    
    if (window.opener) {
      if (code) {
        // Send the authorization code to the parent window
        window.opener.postMessage(
          {
            type: 'instagram-oauth-success',
            code: code,
            username: '' // In real OAuth, username will be resolved by the backend
          },
          window.location.origin
        );
      } else {
        window.opener.postMessage({ type: 'instagram-oauth-cancel' }, window.location.origin);
      }
      window.close();
    } else {
      document.body.innerHTML = '<div style="color:white;text-align:center;margin-top:100px;font-family:sans-serif;">Instagram connection successful! Closing...</div>';
      setTimeout(() => window.close(), 1500);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="text-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-[#e1306c] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold tracking-wide">Connecting with Instagram...</p>
      </div>
    </div>
  );
};

export default InstagramCallback;
