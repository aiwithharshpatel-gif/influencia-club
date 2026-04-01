import { Link } from 'react-router-dom';
import { ArrowRight, Users, TrendingUp, DollarSign, Network, Star, Award, Zap, Heart } from 'lucide-react';
import CreatorCard from '../components/CreatorCard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gold/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-gold/10 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gold/20 blur-3xl rounded-full"></div>
              <img src={logo} alt="Influenzia Club" className="relative h-32 w-auto drop-shadow-2xl" />
            </div>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text">Influence.</span>
            <br />
            <span className="gradient-text">Inspire.</span>
            <br />
            <span className="gradient-text">Ignite.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted max-w-3xl mx-auto mb-8 leading-relaxed">
            India's most <span className="text-gold font-semibold">exclusive influencer community</span>. 
            Connect with luxury brands. Create legendary campaigns.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/join" className="btn-primary inline-flex items-center group">
              Join the Inner Circle
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
            </Link>
            <Link to="/creators" className="btn-outline inline-flex items-center">
              Explore Creators
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
            <div className="luxury-card rounded-xl p-6">
              <div className="text-4xl font-display font-bold gradient-text mb-2">500+</div>
              <div className="text-muted text-sm uppercase tracking-wider">Elite Creators</div>
            </div>
            <div className="luxury-card rounded-xl p-6">
              <div className="text-4xl font-display font-bold gradient-text mb-2">50+</div>
              <div className="text-muted text-sm uppercase tracking-wider">Luxury Brands</div>
            </div>
            <div className="luxury-card rounded-xl p-6">
              <div className="text-4xl font-display font-bold gradient-text mb-2">₹2Cr+</div>
              <div className="text-muted text-sm uppercase tracking-wider">Earnings Generated</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-bg-cardLight">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold mb-4">
              <span className="gradient-text">Find Your</span> Category
            </h2>
            <p className="text-muted">Join a community that matches your talent</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {categories.map((category) => (
              <div
                key={category.name}
                className="luxury-card rounded-xl p-6 text-center card-hover group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                  {category.icon}
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-2">
                  {category.name}
                </h3>
                <p className="text-muted text-sm">
                  {category.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/5 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4">
              <span className="gradient-text">Why Choose</span> Influenzia Club?
            </h2>
            <p className="text-muted max-w-2xl mx-auto">
              We're not just a platform. We're your gateway to the luxury lifestyle industry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="luxury-card rounded-xl p-6 card-hover group"
              >
                <feature.icon className="w-12 h-12 text-gold mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-display text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Creators */}
      <section className="py-20 bg-bg-cardLight">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4">
              <span className="gradient-text">Featured</span> Talent
            </h2>
            <p className="text-muted">Meet our top creators making waves</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCreators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/creators" className="btn-outline inline-flex items-center">
              View All Creators
              <ArrowRight className="ml-2" size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gold/10"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 gradient-text">
            Ready to Join the Inner Circle?
          </h2>
          <p className="text-lg text-muted mb-8 max-w-2xl mx-auto">
            Be part of India's most exclusive influencer community. Limited spots available.
          </p>
          <Link to="/join" className="btn-primary text-lg px-8 py-4">
            Start Your Journey
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
