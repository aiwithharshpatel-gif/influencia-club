import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const InstagramCallback = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Instagram appends #_ to the code param — strip it
    let code = searchParams.get('code');
    if (code) {
      code = code.replace(/#_$/, '').trim();
    }
    
    if (window.opener) {
      if (code) {
        // Send the cleaned authorization code to the parent window
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
      // No opener — user may have navigated here directly or popup was blocked
      // Redirect to login page with the code as a query param so the parent page can pick it up
      if (code) {
        window.location.href = `/login?igcode=${encodeURIComponent(code)}`;
      } else {
        document.body.innerHTML = '<div style="color:white;text-align:center;margin-top:100px;font-family:sans-serif;">Instagram connection failed. Please close this window and try again.</div>';
      }
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

