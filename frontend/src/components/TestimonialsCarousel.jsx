import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const TestimonialsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const testimonials = [
    {
      id: 1,
      name: 'Priya Sharma',
      role: 'Fashion Influencer',
      followers: '500K+',
      image: null,
      content: 'Influenzia Club transformed my career. I went from 50K to 500K followers in just 8 months, and the brand partnerships are incredible!',
      rating: 5,
      earnings: '₹15L+',
    },
    {
      id: 2,
      name: 'Rahul Mehta',
      role: 'Tech Content Creator',
      followers: '250K+',
      image: null,
      content: 'The VIP access to luxury brands is unreal. I\'ve worked with 20+ premium brands since joining. Best investment for creators!',
      rating: 5,
      earnings: '₹8L+',
    },
    {
      id: 3,
      name: 'Ananya Patel',
      role: 'Fashion Model',
      followers: '180K+',
      image: null,
      content: 'Finally, a platform that understands luxury. The team is professional, the brands are top-tier, and the community is supportive.',
      rating: 5,
      earnings: '₹12L+',
    },
    {
      id: 4,
      name: 'Vikram Singh',
      role: 'Lifestyle Influencer',
      followers: '320K+',
      image: null,
      content: 'The founding member offer was the best decision. I\'ve already earned 10x my investment. Highly recommend to serious creators!',
      rating: 5,
      earnings: '₹20L+',
    },
    {
      id: 5,
      name: 'Sneha Kapoor',
      role: 'Beauty Creator',
      followers: '420K+',
      image: null,
      content: 'What sets Influenzia apart is the quality of brands. I\'m working with luxury names I only dreamed of before. Game changer!',
      rating: 5,
      earnings: '₹18L+',
    },
  ];

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-cardLight via-gold/5 to-bg-cardLight"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Success</span> Stories
          </h2>
          <p className="text-muted text-lg">Hear from our elite creators who made it big</p>
        </div>

        {/* Carousel Container */}
        <div 
          className="relative max-w-5xl mx-auto"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* Main Card */}
          <div className="luxury-card rounded-3xl p-8 md:p-12 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl"></div>

            <div className="relative">
              {/* Quote icon */}
              <Quote className="w-12 h-12 text-gold/30 mb-6" />

              {/* Testimonial content */}
              <div className="mb-8">
                <p className="text-xl md:text-2xl text-white leading-relaxed mb-6">
                  "{testimonials[currentIndex].content}"
                </p>

                {/* Rating */}
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <span key={i} className="text-gold text-xl">★</span>
                  ))}
                </div>
              </div>

              {/* Author info */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex-1">
                  <div className="text-lg font-bold text-white mb-1">
                    {testimonials[currentIndex].name}
                  </div>
                  <div className="text-gold text-sm mb-2">{testimonials[currentIndex].role}</div>
                  <div className="text-muted text-sm">
                    <span className="text-gold">{testimonials[currentIndex].followers}</span> followers • 
                    Earned <span className="text-gold font-semibold">{testimonials[currentIndex].earnings}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold hover:bg-gold hover:text-black transition-all duration-300 group"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold hover:bg-gold hover:text-black transition-all duration-300 group"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-3 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 ${
                  index === currentIndex
                    ? 'w-8 h-3 bg-gold rounded-full'
                    : 'w-3 h-3 bg-gold/30 rounded-full hover:bg-gold/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
