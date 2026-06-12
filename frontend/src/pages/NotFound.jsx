import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar />
      
      <section className="flex-grow flex items-center justify-center pt-20 pb-12">
        <div className="text-center px-4 max-w-lg">
          {/* Glowing background accent */}
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-gold/15 blur-[80px] rounded-full" />
            <h1 className="font-display text-[120px] sm:text-[160px] font-bold gradient-text leading-none relative">
              404
            </h1>
          </div>
          
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-muted text-sm sm:text-base mb-8 max-w-sm mx-auto">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/"
              className="btn-primary flex items-center space-x-2 px-6 py-3"
            >
              <Home size={18} />
              <span>Go Home</span>
            </Link>
            <button
              onClick={() => window.history.back()}
              className="btn-outline flex items-center space-x-2 px-6 py-3"
            >
              <ArrowLeft size={18} />
              <span>Go Back</span>
            </button>
          </div>

          {/* Decorative sparkles */}
          <div className="mt-12 flex items-center justify-center gap-2 text-gold/40">
            <span className="text-lg animate-ping" style={{ animationDuration: '3s' }}>✦</span>
            <span className="text-sm animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}>✦</span>
            <span className="text-lg animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1s' }}>✦</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default NotFound;
