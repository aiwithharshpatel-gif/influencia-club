import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Target, Users, Clock, DollarSign, CheckCircle } from 'lucide-react';
import PricingCard from '../components/PricingCard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';

const Brands = () => {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const reasons = [
    {
      icon: Users,
      title: 'Curated Creator Network',
      description: 'Access verified, high-performing creators across Gujarat'
    },
    {
      icon: Target,
      title: 'Tier 2 & 3 Reach',
      description: 'Connect with authentic voices that resonate with local audiences'
    },
    {
      icon: Clock,
      title: 'Fast 48-hr Matching',
      description: 'Get matched with the perfect creators in just 48 hours'
    },
    {
      icon: DollarSign,
      title: 'Campaign Solutions',
      description: 'End-to-end campaign management from brief to reporting'
    },
  ];

  const pricingTiers = [
    {
      tier: 'Basic',
      price: 5000,
      features: [
        '1 micro creator (10K–50K followers)',
        '1 Instagram Reel OR Story',
        '48-hour turnaround matching',
        'Basic campaign brief',
        'Basic metrics report',
        'Email support'
      ],
      isPopular: false
    },
    {
      tier: 'Growth',
      price: 18000,
      features: [
        '3 verified creators',
        'Reels + Stories + Feed Posts',
        '48-hour priority matching',
        'Full campaign management',
        'Brand mention tracking',
        'Detailed post-campaign report',
        'WhatsApp support included'
      ],
      isPopular: true
    },
    {
      tier: 'Premium',
      price: 45000,
      features: [
        '8–10 curated creators',
        'Multi-format content',
        '24-hour dedicated matching',
        'Dedicated campaign manager',
        'Content approval workflow',
        'Full analytics dashboard',
        'Comprehensive report + recommendations',
        'Dedicated WhatsApp contact',
        'Quarterly strategy call'
      ],
      isPopular: false
    },
  ];

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/inquiries', {
        ...data,
        categories: Array.isArray(data.categories) ? data.categories : [data.categories]
      });
      if (response.data.success) {
        setSubmitted(true);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit inquiry');
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl font-bold text-white mb-6">
              Connect with Creators Who <span className="gold-text">Actually Convert</span>
            </h1>
            <p className="text-muted text-lg mb-8">
              Authentic Gujarat creators delivering real results for your brand. 
              From micro-influencers to macro creators, we've got you covered.
            </p>
          </div>

          {/* Why Work With Us */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {reasons.map((reason, index) => (
              <div
                key={index}
                className="card-hover bg-bg rounded-xl p-6 border border-border"
              >
                <div className="w-12 h-12 bg-purple-glow rounded-lg flex items-center justify-center mb-4">
                  <reason.icon size={24} className="text-white" />
                </div>
                <h3 className="font-display text-lg font-semibold text-white mb-2">
                  {reason.title}
                </h3>
                <p className="text-muted text-sm">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-4xl font-bold text-white text-center mb-4">
            Simple, <span className="gradient-text">Transparent</span> Pricing
          </h2>
          <p className="text-muted text-center mb-12 max-w-2xl mx-auto">
            Choose the perfect package for your campaign needs
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <PricingCard
                key={index}
                {...tier}
                onSelect={() => document.getElementById('inquiry-form')?.scrollIntoView({ behavior: 'smooth' })}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry Form Section */}
      <section className="py-20 bg-bg-card" id="inquiry-form">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {!submitted ? (
            <>
              <h2 className="font-display text-4xl font-bold text-white text-center mb-4">
                Start Your <span className="gold-text">Campaign</span>
              </h2>
              <p className="text-muted text-center mb-12">
                Tell us about your brand and we'll match you with perfect creators
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">
                    Brand / Company Name *
                  </label>
                  <input
                    type="text"
                    {...register('brandName', { required: 'Brand name is required' })}
                    className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                    placeholder="Your brand name"
                  />
                  {errors.brandName && (
                    <p className="text-red-500 text-sm mt-1">{errors.brandName.message}</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-2">
                      Business Email *
                    </label>
                    <input
                      type="email"
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                      placeholder="brand@company.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted mb-2">
                      WhatsApp / Mobile *
                    </label>
                    <input
                      type="tel"
                      {...register('mobile', { 
                        required: 'Mobile number is required',
                        pattern: {
                          value: /^[6-9]\d{9}$/,
                          message: 'Enter a valid 10-digit Indian mobile number'
                        }
                      })}
                      className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                      placeholder="9876543210"
                    />
                    {errors.mobile && (
                      <p className="text-red-500 text-sm mt-1">{errors.mobile.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted mb-2">
                    Campaign Budget *
                  </label>
                  <select
                    {...register('budgetRange', { required: 'Budget range is required' })}
                    className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="">Select budget range</option>
                    <option value="<5000">Less than ₹5,000</option>
                    <option value="5000-15000">₹5,000 - ₹15,000</option>
                    <option value="15000-30000">₹15,000 - ₹30,000</option>
                    <option value="30000-50000">₹30,000 - ₹50,000</option>
                    <option value="50000+">₹50,000+</option>
                  </select>
                  {errors.budgetRange && (
                    <p className="text-red-500 text-sm mt-1">{errors.budgetRange.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted mb-2">
                    Creator Category Needed *
                  </label>
                  <select
                    {...register('categories', { required: 'Category is required' })}
                    className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="">Select category</option>
                    <option value="influencer">Influencer</option>
                    <option value="actor">Actor</option>
                    <option value="model">Model</option>
                    <option value="creator">Content Creator</option>
                    <option value="public_figure">Public Figure</option>
                  </select>
                  {errors.categories && (
                    <p className="text-red-500 text-sm mt-1">{errors.categories.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted mb-2">
                    Campaign Brief / Message
                  </label>
                  <textarea
                    {...register('message')}
                    rows={4}
                    className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary resize-none"
                    placeholder="Tell us about your campaign goals, target audience, and expectations..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary py-4 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-green-500" />
              </div>
              <h2 className="font-display text-3xl font-bold text-white mb-4">
                Inquiry Submitted!
              </h2>
              <p className="text-muted mb-6">
                Thank you for your interest! Our team will review your requirements<br />
                and get back to you within 48 hours with creator recommendations.
              </p>
              <p className="text-gold">
                Check your email for confirmation.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Brands;
