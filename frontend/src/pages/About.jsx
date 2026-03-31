import { Link } from 'react-router-dom';
import { Target, Eye, Gift, Users, TrendingUp, DollarSign } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const About = () => {
  const offerings = [
    {
      icon: Gift,
      title: 'Personal Branding',
      description: 'Build your unique identity and stand out in the creator economy.'
    },
    {
      icon: DollarSign,
      title: 'Paid Collaborations',
      description: 'Earn from authentic brand partnerships that align with your values.'
    },
    {
      icon: Users,
      title: 'Community Growth',
      description: 'Network with fellow creators and learn from industry experts.'
    },
  ];

  const stats = [
    { value: '500+', label: 'Active Creators' },
    { value: '80+', label: 'Brand Deals Closed' },
    { value: '12+', label: 'Cities Represented' },
    { value: '₹2Cr+', label: 'Deals Facilitated' },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-display text-5xl font-bold text-white mb-6">
                Who <span className="gradient-text">We Are</span>
              </h1>
              <p className="text-muted text-lg mb-6">
                Influenzia Club is India's curated influencer-brand marketplace, 
                designed to bridge the gap between talented creators and ambitious brands.
              </p>
              <p className="text-muted">
                We're building a community where micro-influencers from Tier 2 & 3 cities 
                get the recognition and opportunities they deserve.
              </p>
            </div>

            {/* Stats Visual */}
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-bg rounded-xl p-6 border border-border text-center"
                >
                  <div className="font-display text-4xl font-bold text-gold mb-2">
                    {stat.value}
                  </div>
                  <div className="text-muted text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Mission */}
            <div className="bg-bg-card rounded-2xl p-8 border border-border">
              <div className="w-12 h-12 bg-purple-glow rounded-lg flex items-center justify-center mb-6">
                <Target size={24} className="text-white" />
              </div>
              <h2 className="font-display text-3xl font-bold text-white mb-4">
                Our Mission
              </h2>
              <p className="text-muted text-lg">
                To empower creators from every corner of India with opportunities, 
                resources, and a supportive community that helps them turn their 
                passion into a sustainable career.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-bg-card rounded-2xl p-8 border border-border">
              <div className="w-12 h-12 bg-purple-glow rounded-lg flex items-center justify-center mb-6">
                <Eye size={24} className="text-white" />
              </div>
              <h2 className="font-display text-3xl font-bold text-white mb-4">
                Our Vision
              </h2>
              <p className="text-muted text-lg">
                To become India's largest creator economy platform, 
                democratizing influencer marketing and making it accessible 
                to creators and brands in Tier 2 & 3 cities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-20 bg-bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-4xl font-bold text-white text-center mb-4">
            What We <span className="gold-text">Offer</span>
          </h2>
          <p className="text-muted text-center mb-12 max-w-2xl mx-auto">
            Everything you need to grow your influence and monetize your content
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {offerings.map((offering, index) => (
              <div
                key={index}
                className="card-hover bg-bg rounded-xl p-6 border border-border"
              >
                <div className="w-12 h-12 bg-purple-glow rounded-lg flex items-center justify-center mb-4">
                  <offering.icon size={24} className="text-white" />
                </div>
                <h3 className="font-display text-xl font-semibold text-white mb-2">
                  {offering.title}
                </h3>
                <p className="text-muted">{offering.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Powered By */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Powered by <span className="text-primary">ZCAD Nexoraa Pvt. Ltd.</span>
          </h2>
          <p className="text-muted max-w-2xl mx-auto">
            Influenzia Club is a venture by ZCAD Nexoraa Pvt. Ltd., 
            a technology company based in Ahmedabad, Gujarat, 
            dedicated to building innovative digital platforms.
          </p>
          <Link to="/contact" className="inline-block btn-primary mt-8">
            Get in Touch
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
