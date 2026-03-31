import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

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
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-display text-2xl font-bold text-white">
              Influen<span className="gold-text italic">zia</span> Club
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-gold'
                    : 'text-white hover:text-primary-soft'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/join"
              className="btn-primary text-sm"
            >
              Join Now
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white p-2"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-bg-card border-t border-border">
          <div className="px-4 py-2 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive(link.path)
                    ? 'bg-glass text-gold'
                    : 'text-white hover:bg-glass'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/join"
              onClick={() => setIsOpen(false)}
              className="block btn-primary text-center mt-4"
            >
              Join Now
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
