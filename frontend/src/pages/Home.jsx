import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Users, TrendingUp, DollarSign, Network, Star, Award, Zap, Heart, CheckCircle, Play, Instagram } from 'lucide-react';
import CreatorCard from '../components/CreatorCard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GoldenParticles from '../components/GoldenParticles';
import FadeIn from '../components/FadeIn';
import AnimatedCounter from '../components/AnimatedCounter';
import VideoBackground from '../components/VideoBackground';
import TestimonialsCarousel from '../components/TestimonialsCarousel';
import BrandLogos from '../components/BrandLogos';
import TiltCard from '../components/TiltCard';
import ChatWidget from '../components/ChatWidget';
import logo from '../assets/logo.png';
import api from '../utils/api';

const DEFAULT_CREATORS = [
  {
    id: 'default-1',
    name: 'Harsh Patel',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
    category: 'creator',
    city: 'Mumbai',
    instagram: 'explorer_harshpatel',
    followerCount: '43K',
    isVerified: true,
    isFeatured: true,
    bio: 'Travel & Lifestyle Creator | Mumbai',
    tier: 'Elite'
  },
  {
    id: 'default-2',
    name: 'Rahul Mehta',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    category: 'creator',
    city: 'Surat',
    instagram: 'rahulmehta',
    followerCount: '75K+',
    isVerified: true,
    isFeatured: true,
    bio: 'Tech Reviewer | Content Creator',
    tier: 'Elite'
  },
  {
    id: 'default-3',
    name: 'Priya Sharma',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    category: 'influencer',
    city: 'Ahmedabad',
    instagram: 'priyasharma',
    followerCount: '50K+',
    isVerified: true,
    isFeatured: true,
    bio: 'Lifestyle & Fashion Creator | Ahmedabad',
    tier: 'Elite'
  }
];

const Home = () => {
  const [instagramHandle, setInstagramHandle] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [creatorsList, setCreatorsList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const response = await api.get('/creators');
        if (response.data.success && response.data.creators.length > 0) {
          setCreatorsList(response.data.creators);
        }
      } catch (error) {
        console.error('Failed to fetch creators from directory:', error);
      }
    };
    fetchCreators();
  }, []);

  // Merge directory creators with high-fidelity fallbacks
  const activeFeaturedCreators = creatorsList.length >= 3 
    ? creatorsList.slice(0, 3) 
    : [
        ...creatorsList,
        ...DEFAULT_CREATORS.slice(creatorsList.length)
      ];

  const handleEarlyAccessSubmit = (e) => {
    e.preventDefault();
    if (!instagramHandle.trim()) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    const cleanHandle = instagramHandle.replace('@', '').trim();
    navigate(`/join?handle=${encodeURIComponent(cleanHandle)}`);
  };
  const categories = [
    { name: 'Influencers', icon: '📱', description: 'Social media stars' },
    { name: 'Actors', icon: '🎬', description: 'Film & TV talent' },
    { name: 'Models', icon: '📸', description: 'Fashion & runway' },
    { name: 'Content Creators', icon: '🎥', description: 'Video creators' },
    { name: 'Public Figures', icon: '🎤', description: 'Thought leaders' },
  ];

  const features = [
    {
      icon: TrendingUp,
      title: 'Growth Opportunities',
      description: 'Get discovered by top brands and grow your influence exponentially.'
    },
    {
      icon: DollarSign,
      title: 'Brand Collaborations',
      description: 'Earn from authentic partnerships with brands that match your vibe.'
    },
    {
      icon: Network,
      title: 'Networking',
      description: 'Connect with fellow creators and build lasting professional relationships.'
    },
    {
      icon: Award,
      title: 'Monetization',
      description: 'Turn your passion into profit with our Refer & Earn program.'
    },
  ];

  const stats = [
    { value: 500, suffix: '+', label: 'Elite Creators' },
    { value: 50, suffix: '+', label: 'Luxury Brands' },
    { value: 2, suffix: 'Cr+', label: 'Earnings Generated', prefix: '₹' },
    { value: 95, suffix: '%', label: 'Success Rate' },
  ];

  const benefits = [
    'Exclusive brand partnerships',
    'Priority campaign access',
    'Dedicated account manager',
    'Premium analytics dashboard',
    'Early payment options',
    'VIP event invitations',
  ];

  return (
    <div className="min-h-screen bg-bg relative overflow-x-hidden">
      <GoldenParticles />
      <Navbar />

      {/* Hero Section - Enhanced with Video Background */}
      <section className="relative pt-32 pb-20 overflow-hidden min-h-screen flex items-center">
        {/* Video Background */}
        <VideoBackground />
        
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent"></div>
        
        {/* Animated background circles */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gold/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gold/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <FadeIn>
            {/* Logo with enhanced glow */}
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gold/30 blur-3xl rounded-full group-hover:bg-gold/50 transition-all duration-700"></div>
                <img src={logo} alt="Influenzia Club" className="relative h-32 w-auto drop-shadow-2xl transform group-hover:scale-105 transition-transform duration-500" />
              </div>
            </div>

            {/* Main headline */}
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="gradient-text drop-shadow-lg">Influence.</span>
              <br />
              <span className="gradient-text drop-shadow-lg">Inspire.</span>
              <br />
              <span className="gradient-text drop-shadow-lg">Ignite.</span>
            </h1>

            {/* Subtitle with better typography */}
            <p className="text-lg md:text-xl text-muted max-w-3xl mx-auto mb-8 leading-relaxed tracking-wide">
              India's most <span className="text-gold font-semibold border-b border-gold/30">exclusive influencer community</span>. 
              <br className="hidden md:block" />
              Connect with luxury brands. Create legendary campaigns.
            </p>

            {/* HashFame style Instagram Handle input bar in Gold & Black */}
            <div className="max-w-xl mx-auto mb-10 px-4">
              <form onSubmit={handleEarlyAccessSubmit} className="relative z-10">
                <div className={`dark-card relative rounded-full p-1.5 bg-gradient-to-r from-gold/50 via-gold to-gold/50 shadow-[0_0_25px_rgba(212,175,55,0.25)] transition-all duration-300 ${isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
                  <div className="bg-[#0A0A0A] rounded-full flex items-center justify-between pl-5 pr-1.5 py-1.5 border border-gold/30">
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0 mr-2">
                      <Instagram className="text-gold flex-shrink-0" size={22} />
                      <span className="text-gold/90 font-semibold text-sm sm:text-base hidden sm:inline select-none">
                        instagram.com/
                      </span>
                      <span className="text-gold/90 font-semibold text-sm sm:text-base inline sm:hidden select-none">
                        @
                      </span>
                      <input
                        type="text"
                        placeholder="your_handle"
                        value={instagramHandle}
                        onChange={(e) => setInstagramHandle(e.target.value)}
                        className="bg-transparent border-none outline-none text-white text-sm sm:text-base font-medium placeholder-white/40 w-full focus:ring-0 p-0"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-gold-gradient hover:scale-105 active:scale-95 text-black px-5 sm:px-7 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all duration-200 flex-shrink-0 shadow-lg shadow-gold/20"
                    >
                      Get Invite
                    </button>
                  </div>
                </div>
              </form>
              <p className="text-xs text-muted mt-3 tracking-wide text-center">
                ✦ Invite-only platform. Enter your handle to request an invitation.
              </p>
            </div>

            {/* Sub CTAs */}
            <div className="flex justify-center items-center space-x-6 mb-12 relative z-10">
              <Link to="/login" className="text-white/80 hover:text-gold transition-colors text-xs font-semibold tracking-wider uppercase border-b border-white/5 hover:border-gold/30 pb-0.5">
                Brand Portal
              </Link>
              <span className="text-white/10">|</span>
              <Link to="/creators" className="text-white/80 hover:text-gold transition-colors text-xs font-semibold tracking-wider uppercase border-b border-white/5 hover:border-gold/30 pb-0.5">
                Explore Creators
              </Link>
            </div>

            {/* Creator Floating Showcase - HashFame style mock-up preview */}
            <div className="relative max-w-lg mx-auto mb-24 h-[340px] hidden md:block select-none">
              {/* Central Phone Mockup Background Glow */}
              <div className="absolute inset-0 bg-gold/5 blur-3xl rounded-full"></div>
              
              {/* Stacked Cards */}
              {activeFeaturedCreators[0] && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-[300px] bg-gradient-to-b from-[#141414] to-black border border-gold/30 rounded-[28px] p-3.5 shadow-gold-glow/5 z-20 flex flex-col justify-between transition-all duration-300">
                  <div className="aspect-square rounded-xl overflow-hidden bg-white/5 relative">
                    <img 
                      src={activeFeaturedCreators[0].photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeFeaturedCreators[0].name)}&background=111&color=D4AF37&size=400`} 
                      alt={activeFeaturedCreators[0].name} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute top-2 right-2 bg-gold-gradient text-black text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {activeFeaturedCreators[0].tier || 'Elite'}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3 text-left">
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-wide">{activeFeaturedCreators[0].name}</h4>
                      <p className="text-[10px] text-gold/80">@{activeFeaturedCreators[0].instagram}</p>
                    </div>
                    <span className="bg-gold/15 text-gold border border-gold/25 px-2 py-0.5 rounded-full text-[9px] font-bold">
                      {activeFeaturedCreators[0].followerCount}
                    </span>
                  </div>
                </div>
              )}

              {activeFeaturedCreators[1] && (
                <div className="absolute left-[calc(50%-190px)] top-1/2 -translate-y-1/2 w-52 h-[260px] bg-gradient-to-b from-[#0a0a0a] to-black border border-white/5 rounded-[24px] p-3 opacity-40 z-10 -rotate-[8deg] transition-all duration-500 hover:rotate-0 hover:opacity-100 hover:z-30 flex flex-col justify-between">
                  <div className="aspect-square rounded-lg overflow-hidden bg-white/5">
                    <img 
                      src={activeFeaturedCreators[1].photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeFeaturedCreators[1].name)}&background=111&color=D4AF37&size=400`} 
                      alt={activeFeaturedCreators[1].name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2 text-left">
                    <div>
                      <h4 className="text-[11px] font-semibold text-white tracking-wide">{activeFeaturedCreators[1].name}</h4>
                      <p className="text-[9px] text-muted">@{activeFeaturedCreators[1].instagram}</p>
                    </div>
                    <span className="bg-white/5 text-white/80 border border-white/10 px-2 py-0.5 rounded-full text-[8px]">
                      {activeFeaturedCreators[1].followerCount}
                    </span>
                  </div>
                </div>
              )}

              {activeFeaturedCreators[2] && (
                <div className="absolute left-[calc(50%+10px)] top-1/2 -translate-y-1/2 w-52 h-[260px] bg-gradient-to-b from-[#0a0a0a] to-black border border-white/5 rounded-[24px] p-3 opacity-40 z-10 rotate-[8deg] transition-all duration-500 hover:rotate-0 hover:opacity-100 hover:z-30 flex flex-col justify-between">
                  <div className="aspect-square rounded-lg overflow-hidden bg-white/5">
                    <img 
                      src={activeFeaturedCreators[2].photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeFeaturedCreators[2].name)}&background=111&color=D4AF37&size=400`} 
                      alt={activeFeaturedCreators[2].name} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2 text-left">
                    <div>
                      <h4 className="text-[11px] font-semibold text-white tracking-wide">{activeFeaturedCreators[2].name}</h4>
                      <p className="text-[9px] text-muted">@{activeFeaturedCreators[2].instagram}</p>
                    </div>
                    <span className="bg-white/5 text-white/80 border border-white/10 px-2 py-0.5 rounded-full text-[8px]">
                      {activeFeaturedCreators[2].followerCount}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </FadeIn>

          {/* Enhanced Stats with Animation */}
          <FadeIn delay={300}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="luxury-card rounded-2xl p-6 group hover:border-gold/50 transition-all duration-500 hover:-translate-y-2">
                  <div className="text-4xl md:text-5xl font-display font-bold gradient-text mb-2">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                  </div>
                  <div className="text-muted text-xs uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Categories Section - Enhanced */}
      <section className="py-24 bg-bg-cardLight relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/3 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
                <span className="gradient-text">Find Your</span> Category
              </h2>
              <p className="text-muted text-lg">Join a community that matches your talent</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {categories.map((category, index) => (
              <FadeIn key={category.name} delay={index * 100}>
                <TiltCard>
                  <div className="luxury-card rounded-2xl p-8 text-center group hover:border-gold/50 transition-all duration-500 hover:-translate-y-3 hover:shadow-gold-glow">
                    <div className="text-6xl mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">
                      {category.icon}
                    </div>
                    <h3 className="font-display text-xl font-bold text-white mb-3 tracking-wide">
                      {category.name}
                    </h3>
                    <p className="text-muted text-sm leading-relaxed">
                      {category.description}
                    </p>
                  </div>
                </TiltCard>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/5 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
                <span className="gradient-text">Why Choose</span> Influenzia Club?
              </h2>
              <p className="text-muted text-lg max-w-2xl mx-auto leading-relaxed">
                We're not just a platform. We're your gateway to the luxury lifestyle industry.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FadeIn key={index} delay={index * 150}>
                <div className="luxury-card rounded-2xl p-8 group hover:border-gold/50 transition-all duration-500 hover:-translate-y-3 hover:shadow-gold-glow h-full">
                  <div className="bg-gold/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-gold/20 transition-all duration-500">
                    <feature.icon className="w-8 h-8 text-gold" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-white mb-4 tracking-wide">
                    {feature.title}
                  </h3>
                  <p className="text-muted leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Benefits Section - NEW */}
      <section className="py-24 bg-bg-cardLight relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-gold/5"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <div>
                <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
                  <span className="gradient-text">VIP</span> Benefits
                </h2>
                <p className="text-muted text-lg mb-8 leading-relaxed">
                  Unlock exclusive perks designed for elite creators. Join the inner circle and experience the difference.
                </p>
                
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <FadeIn key={index} delay={index * 50}>
                      <div className="flex items-center space-x-4 group">
                        <CheckCircle className="text-gold w-6 h-6 group-hover:scale-125 transition-transform" />
                        <span className="text-white group-hover:text-gold transition-colors">{benefit}</span>
                      </div>
                    </FadeIn>
                  ))}
                </div>

                <Link to="/join" className="btn-primary inline-flex items-center mt-8 group">
                  Get VIP Access
                  <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" size={20} />
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={300}>
              <div className="luxury-card rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl"></div>
                
                <div className="relative">
                  <div className="text-center mb-8">
                    <div className="text-gold text-sm uppercase tracking-widest mb-2">Limited Time</div>
                    <h3 className="font-display text-3xl font-bold gradient-text">Founding Member Offer</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-center py-4 border-b border-gold/20">
                      <span className="text-muted">Regular Price</span>
                      <span className="text-muted line-through">₹9,999</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-gold/20">
                      <span className="text-white font-semibold">Founding Member Price</span>
                      <span className="text-gold font-bold text-2xl">₹4,999</span>
                    </div>
                    <div className="text-center text-muted text-sm">
                      Save 50% - Limited spots available!
                    </div>
                  </div>

                  <Link to="/join" className="btn-primary w-full mt-6 py-4 text-lg">
                    Claim Your Spot Now
                  </Link>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Featured Creators - Enhanced */}
      <section className="py-24 bg-bg-cardLight relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/3 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
                <span className="gradient-text">Featured</span> Talent
              </h2>
              <p className="text-muted text-lg">Meet our top creators making waves</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeFeaturedCreators.map((creator, index) => (
              <FadeIn key={creator.id} delay={index * 150}>
                <CreatorCard creator={creator} />
              </FadeIn>
            ))}
          </div>

          <FadeIn>
            <div className="text-center mt-12">
              <Link to="/creators" className="btn-outline inline-flex items-center group px-8 py-4">
                View All Creators
                <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" size={20} />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Brand Logos Section */}
      <BrandLogos />

      {/* Testimonials Carousel */}
      <TestimonialsCarousel />

      {/* CTA Section - Enhanced */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gold/10"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <FadeIn>
            <h2 className="font-display text-4xl md:text-6xl font-bold mb-6 gradient-text drop-shadow-lg">
              Ready to Join the Inner Circle?
            </h2>
            <p className="text-lg text-muted mb-10 max-w-2xl mx-auto leading-relaxed">
              Be part of India's most exclusive influencer community. Limited spots available for founding members.
            </p>
            <Link to="/join" className="btn-primary text-xl px-10 py-5 group relative overflow-hidden">
              <span className="relative z-10">Start Your Journey</span>
              <div className="absolute inset-0 bg-white/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Chat Widget */}
      <ChatWidget />

      <Footer />
    </div>
  );
};

export default Home;
