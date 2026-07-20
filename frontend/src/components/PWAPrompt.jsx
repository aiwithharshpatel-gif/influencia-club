import { useState, useEffect } from 'react';
import { Share, Plus, X, Smartphone, Download } from 'lucide-react';

const PWAPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState('android');
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // 1. Detect if running in standalone mode (already installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true;

    if (isStandalone) {
      return; // Already running as an app
    }

    // 2. Check if dismissed recently
    const isDismissed = localStorage.getItem('pwa_prompt_dismissed') === 'true';
    if (isDismissed) {
      return;
    }

    // 3. Detect Platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    setPlatform(isIOS ? 'ios' : 'android');

    // 4. Detect mobile/tablet screen sizes (width < 1024px)
    const handleResize = () => {
      const isMobileOrTablet = window.innerWidth < 1024;
      if (isMobileOrTablet) {
        // Allow a small delay on page load before showing the prompt for better UX
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      } else {
        setShowPrompt(false);
      }
    };

    // Listen for the native beforeinstallprompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      // Store the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show prompt if on mobile/tablet
      if (window.innerWidth < 1024) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the native install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
      setShowPrompt(false);
    }
    
    // Clear deferred prompt
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    // Hide the prompt and set dismiss flag in localStorage
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[9999] max-w-md mx-auto md:left-auto md:right-6 animate-fade-in-up">
      <div className="luxury-card rounded-2xl p-4 pr-12 relative overflow-hidden bg-black/90 border border-gold/40 shadow-[0_10px_30px_rgba(212,175,55,0.15)] backdrop-blur-md">
        {/* Subtle background glow */}
        <div className="absolute -top-10 -left-10 w-24 h-24 bg-gold/10 rounded-full blur-2xl"></div>
        
        {/* Dismiss Button */}
        <button 
          onClick={handleDismiss} 
          className="absolute top-3 right-3 text-muted hover:text-gold transition-colors duration-200"
          aria-label="Dismiss app install banner"
        >
          <X size={18} />
        </button>

        <div className="flex items-center space-x-3.5">
          {/* App Logo/Icon Container */}
          <div className="flex-shrink-0 w-11 h-11 bg-gold/10 rounded-xl border border-gold/30 flex items-center justify-center text-gold">
            <Smartphone size={22} className="animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-white font-bold text-sm leading-snug">Install Influenzia Club</h4>
            <p className="text-muted text-[11px] leading-relaxed mt-0.5">
              {platform === 'ios' ? (
                <span className="flex items-center flex-wrap gap-1">
                  Tap <Share size={12} className="text-gold inline mx-0.5" /> Share then <Plus size={12} className="text-gold inline mx-0.5" /> <strong>Add to Home Screen</strong>
                </span>
              ) : (
                'Add to home screen for a premium mobile-app experience!'
              )}
            </p>
          </div>

          {/* Action Button for Android (Chrome beforeinstallprompt) */}
          {platform === 'android' && deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="bg-gold-gradient hover:opacity-95 text-black text-xs font-bold px-3 py-1.5 rounded-full flex items-center space-x-1 uppercase tracking-wider transition-all duration-300"
            >
              <Download size={12} />
              <span>Install</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PWAPrompt;
