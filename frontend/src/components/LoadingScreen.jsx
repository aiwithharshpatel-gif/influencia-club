import { useState, useEffect } from 'react';

const LoadingScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Minimum loading time for smooth experience
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setIsLoading(false), 1000);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div className={`fixed inset-0 z-[100] bg-black flex items-center justify-center transition-opacity duration-1000 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-black to-gold/5"></div>
      
      {/* Animated logo container */}
      <div className="relative z-10 text-center">
        {/* Pulsing glow effect */}
        <div className="absolute inset-0 bg-gold/20 blur-3xl rounded-full animate-pulse"></div>
        
        {/* Logo */}
        <div className="relative mb-6 animate-bounce" style={{ animationDuration: '2s' }}>
          <div className="w-24 h-24 md:w-32 md:h-32 mx-auto relative">
            {/* Rotating border */}
            <div className="absolute inset-0 border-2 border-gold/50 rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
            <div className="absolute inset-2 border border-gold/30 rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
            
            {/* IC Letters */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-5xl md:text-6xl font-bold gradient-text">IC</span>
            </div>
          </div>
        </div>

        {/* Brand name */}
        <h1 className="font-display text-2xl md:text-3xl font-bold gradient-text mb-4 tracking-widest">
          INFLUENZIA CLUB
        </h1>

        {/* Loading bar */}
        <div className="w-48 md:w-64 h-1 bg-gold/20 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-gold-gradient animate-pulse" style={{ 
            animation: 'loading 2s ease-in-out infinite',
            width: '100%'
          }}></div>
        </div>

        {/* Loading text */}
        <p className="text-muted text-sm mt-4 uppercase tracking-widest animate-pulse">
          Loading Experience
        </p>

        {/* Sparkles */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 text-gold text-2xl animate-ping">✦</div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-8 text-gold text-xl animate-ping" style={{ animationDelay: '0.5s' }}>✦</div>
      </div>

      <style>{`
        @keyframes loading {
          0% { width: 0%; opacity: 0.5; }
          50% { width: 100%; opacity: 1; }
          100% { width: 100%; opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
