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
    
    const messagePayload = code 
      ? { type: 'instagram-oauth-success', code: code, username: '' } 
      : { type: 'instagram-oauth-cancel' };

    // 1. Send via BroadcastChannel (same-origin fallback)
    try {
      const bc = new BroadcastChannel('instagram_oauth');
      bc.postMessage(messagePayload);
      bc.close();
    } catch (e) {
      console.error('BroadcastChannel failed:', e);
    }

    // 2. Send via window.opener.postMessage (classic fallback)
    if (window.opener) {
      try {
        window.opener.postMessage(messagePayload, '*');
      } catch (e) {
        console.error('postMessage failed:', e);
      }
    }

    // 3. Close the popup
    setTimeout(() => {
      window.close();
    }, 500);
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

