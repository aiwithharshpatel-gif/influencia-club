import { Link } from 'react-router-dom';
import { Instagram, Youtube, Linkedin, Twitter, Heart } from 'lucide-react';
import logo from '../assets/logo.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const platformLinks = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Creators', path: '/creators' },
    { label: 'Join', path: '/join' },
  ];

  const brandLinks = [
    { label: 'Brands', path: '/brands' },
    { label: 'Contact', path: '/contact' },
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Terms & Conditions', path: '/terms' },
  ];

  const socialLinks = [
    { icon: Instagram, href: 'https://www.instagram.com/influenzia_club/', label: 'Instagram' },
    { icon: Youtube, href: 'https://youtube.com/@influenziaclub', label: 'YouTube' },
    { icon: Linkedin, href: 'https://linkedin.com/company/influenziaclub', label: 'LinkedIn' },
    { icon: Twitter, href: 'https://twitter.com/influenziaclub', label: 'Twitter' },
  ];

  return (
    <footer className="bg-gradient-to-t from-black via-bg-card to-black border-t border-gold/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Info */}
          <div className="space-y-5">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="IC" className="h-9 w-auto" />
              <span className="font-display text-lg font-bold tracking-widest text-white">
                INFLUENZIA CLUB
              </span>
            </div>
            <p className="text-muted text-sm leading-relaxed max-w-xs">
              India's most exclusive influencer community. Connecting elite creators with luxury brands.
            </p>
            <div className="flex space-x-4 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted hover:text-gold hover:border-gold/40 hover:bg-gold/5 transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-display text-sm font-semibold text-gold tracking-widest uppercase mb-6">
              Platform
            </h3>
            <ul className="space-y-3">
              {platformLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-muted text-sm hover:text-white hover:pl-1 transition-all duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Brand Links */}
          <div>
            <h3 className="font-display text-sm font-semibold text-gold tracking-widest uppercase mb-6">
              For Brands
            </h3>
            <ul className="space-y-3">
              {brandLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-muted text-sm hover:text-white hover:pl-1 transition-all duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-sm font-semibold text-gold tracking-widest uppercase mb-6">
              Contact
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="text-muted hover:text-white transition-colors">hello@influenziaclub.com</li>
              <li className="text-muted">Ahmedabad, Gujarat, India</li>
              <li className="text-gold/80 font-medium flex items-center space-x-1.5 pt-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></span>
                <span>Response within 24 hours</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/5">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-muted text-xs tracking-wide">
              © {currentYear} Influenzia Club. All rights reserved.
            </p>
            <p className="text-muted text-xs tracking-wide flex items-center">
              Powered by{' '}
              <span className="text-gold ml-1 font-semibold hover:text-white transition-colors duration-300">ZCAD Nexoraa Pvt. Ltd.</span>
              <Heart size={12} className="text-gold ml-1 animate-pulse" fill="#D4AF37" />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
