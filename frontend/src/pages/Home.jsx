import { Link } from 'react-router-dom';
import { ArrowRight, Users, TrendingUp, DollarSign, Network, Star, Award, Zap, Heart, CheckCircle, Play } from 'lucide-react';
import CreatorCard from '../components/CreatorCard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GoldenParticles from '../components/GoldenParticles';
import FadeIn from '../components/FadeIn';
import AnimatedCounter from '../components/AnimatedCounter';
import logo from '../assets/logo.png';

const Home = () => {
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

  const featuredCreators = [
    {
      id: '1',
      name: 'Priya Sharma',
      photoUrl: null,
      category: 'influencer',
      city: 'Ahmedabad',
      instagram: 'priyasharma',
      followerCount: '50K+',
      isVerified: true,
      isFeatured: true,
      bio: 'Lifestyle & Fashion Creator | Ahmedabad'
    },
    {
      id: '2',
      name: 'Rahul Mehta',
      photoUrl: null,
      category: 'creator',
      city: 'Surat',
      instagram: 'rahulmehta',
      followerCount: '75K+',
      isVerified: true,
      isFeatured: true,
      bio: 'Tech Reviewer | Content Creator'
    },
    {
      id: '3',
      name: 'Ananya Patel',
      photoUrl: null,
      category: 'model',
      city: 'Vadodara',
      instagram: 'ananyapatel',
      followerCount: '1.2L+',
      isVerified: true,
      isFeatured: true,
      bio: 'Fashion Model | Brand Ambassador'
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

      {/* Hero Section - Enhanced */}
      <section className="relative pt-32 pb-20 overflow-hidden min-h-screen flex items-center">
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

            {/* CTA Buttons with enhanced styling */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link to="/join" className="btn-primary inline-flex items-center group px-8 py-4 text-lg relative overflow-hidden">
                <span className="relative z-10 flex items-center">
                  Join the Inner Circle
                  <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform duration-300" size={20} />
                </span>
                <div className="absolute inset-0 bg-white/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </Link>
              <Link to="/creators" className="btn-outline inline-flex items-center px-8 py-4 text-lg group">
                <Play className="mr-2 fill-gold text-gold" size={18} />
                Explore Creators
              </Link>
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
            {featuredCreators.map((creator, index) => (
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

      <Footer />
    </div>
  );
};

export default Home;
