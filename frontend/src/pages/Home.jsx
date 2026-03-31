import { Link } from 'react-router-dom';
import { ArrowRight, Users, TrendingUp, DollarSign, Network, Star, Award, Zap, Heart } from 'lucide-react';
import CreatorCard from '../components/CreatorCard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

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

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-bg to-bg" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center glass rounded-full px-4 py-2 mb-8">
            <Star size={16} className="text-gold mr-2" />
            <span className="text-sm text-white">India's Next-Gen Creator Community</span>
          </div>

          {/* Title */}
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6">
            Influence.<br />
            <span className="gold-text italic">Inspire.</span><br />
            Ignite.
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted max-w-3xl mx-auto mb-12">
            India's Next-Gen Influencer Platform connecting creators with brands
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/join" className="btn-primary text-lg px-8 py-4">
              Join the Club
            </Link>
            <Link to="/creators" className="btn-outline text-lg px-8 py-4">
              Explore Creators
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {[
              { value: '500+', label: 'Creators' },
              { value: '80+', label: 'Brand Deals' },
              { value: '12+', label: 'Cities' },
              { value: '₹2Cr+', label: 'Deals Facilitated' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="font-display text-3xl md:text-4xl font-bold text-gold mb-2">
                  {stat.value}
                </div>
                <div className="text-muted text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ArrowRight size={24} className="text-muted rotate-90" />
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="font-display text-4xl font-bold text-white mb-6">
              Welcome to the <span className="gradient-text">Club</span>
            </h2>
            <p className="text-muted text-lg mb-8">
              Influenzia Club is India's curated influencer-brand marketplace. 
              A community-first platform where creators get discovered by brands, 
              earn from collaborations, and grow together.
            </p>
            <p className="text-muted">
              Powered by <span className="text-primary font-semibold">ZCAD Nexoraa Pvt. Ltd.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-4xl font-bold text-white text-center mb-12">
            Creator <span className="gold-text">Categories</span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map((category, index) => (
              <div
                key={index}
                className="card-hover bg-bg-card rounded-xl p-6 text-center border border-border"
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="font-display text-lg font-semibold text-white mb-1">
                  {category.name}
                </h3>
                <p className="text-muted text-sm">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-4xl font-bold text-white text-center mb-4">
            Why Choose <span className="gradient-text">Us?</span>
          </h2>
          <p className="text-muted text-center mb-12 max-w-2xl mx-auto">
            We're not just a marketplace — we're a community dedicated to your success
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card-hover bg-bg-card rounded-xl p-6 border border-border"
              >
                <div className="w-12 h-12 bg-purple-glow rounded-lg flex items-center justify-center mb-4">
                  <feature.icon size={24} className="text-white" />
                </div>
                <h3 className="font-display text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Creators Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="font-display text-4xl font-bold text-white">
              Featured <span className="gold-text">Creators</span>
            </h2>
            <Link to="/creators" className="text-primary hover:text-primary-soft font-medium flex items-center">
              See All Creators <ArrowRight size={18} className="ml-2" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCreators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-purple-glow rounded-3xl p-12">
            <h2 className="font-display text-4xl font-bold text-white mb-4">
              Join the Club Today.
            </h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Be part of India's fastest-growing creator community. Start your journey now.
            </p>
            <Link to="/join" className="inline-block bg-white text-primary font-semibold px-8 py-4 rounded-lg hover:bg-white/90 transition-colors">
              Register Now
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
