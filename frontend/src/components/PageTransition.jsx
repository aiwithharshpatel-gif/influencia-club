import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }) => {
  const location = useLocation();
  const [isExiting, setIsExiting] = useState(false);
  const [currentChildren, setCurrentChildren] = useState(children);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (location.pathname !== window.location.pathname) {
      setIsExiting(true);
      
      const timeout = setTimeout(() => {
        setCurrentChildren(children);
        setKey(prev => prev + 1);
        setIsExiting(false);
      }, 300);

      return () => clearTimeout(timeout);
    }
  }, [location, children]);

  return (
    <>
      {/* Page transition overlay */}
      <div 
        className={`fixed inset-0 z-[9999] bg-black pointer-events-none transition-opacity duration-300 ${
          isExiting ? 'opacity-100' : 'opacity-0'
        }`}
      />
      
      {/* Gold line animation */}
      <div 
        className={`fixed top-0 left-0 right-0 h-1 bg-gold-gradient z-[10000] pointer-events-none transition-transform duration-500 ${
          isExiting ? 'scale-x-100' : 'scale-x-0'
        } origin-left`}
      />
      
      {/* Content with fade */}
      <div
        key={key}
        className={`transition-all duration-500 ${
          isExiting ? 'opacity-0 blur-sm scale-95' : 'opacity-100 blur-none scale-100'
        }`}
      >
        {currentChildren}
      </div>

      {/* Loading bar for navigation */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-gold/20 z-[9998] overflow-hidden">
        <div className="h-full bg-gold-gradient animate-loading-bar" />
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 50%; margin-left: 25%; }
          100% { width: 0%; margin-left: 100%; }
        }
        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default PageTransition;
