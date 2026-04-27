import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import logo from '../assets/logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/creators', label: 'Creators' },
    { path: '/brands', label: 'Brands' },
    { path: '/contact', label: 'Contact' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass bg-bg/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gold/20 blur-xl rounded-full group-hover:bg-gold/40 transition-all"></div>
              <img src={logo} alt="IC" className="relative h-12 w-auto drop-shadow-lg" />
            </div>
            <span className="font-display text-xl font-bold gradient-text tracking-wider hidden sm:block">
              INFLUENZIA CLUB
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-all duration-300 tracking-wide ${
                  isActive(link.path)
                    ? 'text-gold glow-gold'
                    : 'text-white hover:text-gold'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center space-x-4 border-l border-gold/20 pl-8">
              <Link
                to="/login"
                className="text-sm font-medium text-white hover:text-gold transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/join"
                className="btn-primary text-sm"
              >
                Join Now
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gold p-2 hover:bg-gold/10 rounded-lg transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-bg-card/95 backdrop-blur-lg border-t border-gold/20">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.path)
                    ? 'bg-gold/10 text-gold border border-gold/30'
                    : 'text-white hover:bg-gold/5 hover:text-gold'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 space-y-3 border-t border-gold/20">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-medium text-white hover:bg-gold/5 hover:text-gold transition-all text-center"
              >
                Sign In
              </Link>
              <Link
                to="/join"
                onClick={() => setIsOpen(false)}
                className="block btn-primary text-center"
              >
                Join Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
