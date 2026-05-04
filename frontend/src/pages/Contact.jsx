import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Phone, MapPin, Clock, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const contactInfo = [
    {
      icon: Mail,
      label: 'Email',
      value: 'hello@influenziaclub.in',
      href: 'mailto:hello@influenziaclub.in'
    },
    {
      icon: Phone,
      label: 'WhatsApp',
      value: '+91 XXXXX XXXXX',
      href: 'https://wa.me/91XXXXX XXXXX'
    },
    {
      icon: MapPin,
      label: 'Location',
      value: 'Ahmedabad, Gujarat, India'
    },
    {
      icon: Clock,
      label: 'Response Time',
      value: 'Within 24 hours',
      highlight: true
    },
  ];

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/contact', data);
      if (response.data.success) {
        setSubmitted(true);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to send message');
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-5xl font-bold text-white mb-4">
            Get in <span className="gold-text">Touch</span>
          </h1>
          <p className="text-muted text-lg max-w-2xl">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="font-display text-3xl font-bold text-white mb-8">
                Contact Information
              </h2>

              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-purple-glow rounded-lg flex items-center justify-center flex-shrink-0">
                      <info.icon size={24} className="text-white" />
                    </div>
                    <div>
                      <div className="text-muted text-sm mb-1">{info.label}</div>
                      {info.href ? (
                        <a
                          href={info.href}
                          className={`text-lg ${info.highlight ? 'text-gold font-semibold' : 'text-white hover:text-primary'} transition-colors`}
                        >
                          {info.value}
                        </a>
                      ) : (
                        <div className={`text-lg ${info.highlight ? 'text-gold font-semibold' : 'text-white'}`}>
                          {info.value}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Map Placeholder */}
              <div className="mt-12 bg-bg-card rounded-xl border border-border h-64 flex items-center justify-center">
                <div className="text-center text-muted">
                  <MapPin size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Ahmedabad, Gujarat</p>
                  <p className="text-sm">India</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-bg-card rounded-2xl p-8 border border-border">
              {!submitted ? (
                <>
                  <h2 className="font-display text-3xl font-bold text-white mb-6">
                    Send us a Message
                  </h2>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        {...register('name', { required: 'Name is required' })}
                        className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                        placeholder="Your name"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">
                        Email *
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
                        placeholder="your@email.com"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        {...register('subject', { required: 'Subject is required' })}
                        className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
                        placeholder="How can we help?"
                      />
                      {errors.subject && (
                        <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">
                        Message *
                      </label>
                      <textarea
                        {...register('message', { required: 'Message is required' })}
                        rows={5}
                        className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary resize-none"
                        placeholder="Tell us more about your inquiry..."
                      />
                      {errors.message && (
                        <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full btn-primary py-4 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} className="text-green-500" />
                  </div>
                  <h2 className="font-display text-3xl font-bold text-white mb-4">
                    Message Sent!
                  </h2>
                  <p className="text-muted">
                    Thank you for reaching out. We'll get back to you within 24 hours.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
