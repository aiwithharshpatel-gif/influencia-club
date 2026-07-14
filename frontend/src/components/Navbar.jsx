import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import logo from '../assets/logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/creators', label: 'Creators' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/brands', label: 'Brands' },
    { path: '/contact', label: 'Contact' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`fixed left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled ? 'top-4 px-4' : 'top-6 px-6'
    }`}>
      <nav className={`mx-auto max-w-7xl rounded-2xl border transition-all duration-500 ${
        isScrolled 
          ? 'bg-black/90 backdrop-blur-xl border-gold/30 shadow-gold-sm py-2' 
          : 'bg-black/40 backdrop-blur-md border-gold/10 py-3'
      }`}>
        <div className="px-6 md:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gold/15 blur-xl rounded-full group-hover:bg-gold/30 transition-all"></div>
              <img src={logo} alt="IC" className="relative h-10 md:h-11 w-auto transition-transform duration-300 group-hover:scale-105" />
            </div>
            <span className="font-display text-lg font-bold tracking-widest text-white group-hover:text-gold transition-colors hidden sm:block">
              INFLUENZIA CLUB
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-all duration-300 tracking-wider relative py-1 ${
                  isActive(link.path)
                    ? 'text-gold'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold-gradient rounded-full"></span>
                )}
              </Link>
            ))}
            <div className="flex items-center space-x-4 border-l border-white/10 pl-6 ml-4">
              <Link
                to="/login"
                className="px-5 py-2 rounded-full border border-gold/40 text-gold hover:bg-gold-gradient hover:text-black hover:border-transparent transition-all text-xs font-bold uppercase tracking-wider"
              >
                Sign In
              </Link>
              <Link
                to="/join"
                className="btn-primary text-xs px-6 py-2.5 rounded-full uppercase tracking-wider font-bold"
              >
                Join Now
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gold p-2 hover:bg-gold/10 rounded-xl transition-colors"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden mt-2 bg-black/95 backdrop-blur-lg rounded-xl border border-gold/25 mx-2 overflow-hidden transition-all duration-300">
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive(link.path)
                      ? 'bg-gold/10 text-gold border border-gold/20'
                      : 'text-white/80 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 space-y-3 border-t border-white/10">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-lg text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition-all text-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/brand-login"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-lg text-sm font-medium text-gold/80 hover:bg-white/5 hover:text-gold transition-all text-center border border-gold/20"
                >
                  Brand Portal
                </Link>
                <Link
                  to="/join"
                  onClick={() => setIsOpen(false)}
                  className="block btn-primary text-center py-3 rounded-lg"
                >
                  Join Now
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
};

export default Navbar;
