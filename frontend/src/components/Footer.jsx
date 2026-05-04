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
    <footer className="bg-bg-card border-t border-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="IC" className="h-10 w-auto" />
              <span className="font-display text-xl font-bold gradient-text">
                INFLUENZIA CLUB
              </span>
            </div>
            <p className="text-muted text-sm leading-relaxed">
              India's most exclusive influencer community. Connecting elite creators with luxury brands.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-gold transition-colors"
                  aria-label={social.label}
                >
                  <social.icon size={20} />
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-display text-lg font-semibold text-gold mb-4">
              Platform
            </h3>
            <ul className="space-y-2">
              {platformLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-muted text-sm hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Brand Links */}
          <div>
            <h3 className="font-display text-lg font-semibold text-gold mb-4">
              For Brands
            </h3>
            <ul className="space-y-2">
              {brandLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-muted text-sm hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-lg font-semibold text-gold mb-4">
              Contact
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="text-muted">hello@influenziaclub.com</li>
              <li className="text-muted">Ahmedabad, Gujarat, India</li>
              <li className="text-gold font-medium">✦ Response within 24 hours</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gold/20">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-muted text-sm">
              © {currentYear} Influenzia Club. All rights reserved.
            </p>
            <p className="text-muted text-sm flex items-center">
              Powered by{' '}
              <span className="text-gold ml-1 font-semibold">ZCAD Nexoraa Pvt. Ltd.</span>
              <Heart size={14} className="text-gold ml-1" fill="#D4AF37" />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
