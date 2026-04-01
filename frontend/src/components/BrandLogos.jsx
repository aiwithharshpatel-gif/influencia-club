const BrandLogos = () => {
  // Replace with actual brand logos later
  const brands = [
    { name: 'Gucci', placeholder: 'G' },
    { name: 'Louis Vuitton', placeholder: 'LV' },
    { name: 'Chanel', placeholder: 'C' },
    { name: 'Dior', placeholder: 'D' },
    { name: 'Prada', placeholder: 'P' },
    { name: 'Versace', placeholder: 'V' },
    { name: 'Armani', placeholder: 'A' },
    { name: 'Burberry', placeholder: 'B' },
    { name: 'Fendi', placeholder: 'F' },
    { name: 'Givenchy', placeholder: 'G' },
    { name: 'Balenciaga', placeholder: 'B' },
    { name: 'Saint Laurent', placeholder: 'Y' },
  ];

  // Duplicate for seamless infinite scroll
  const extendedBrands = [...brands, ...brands, ...brands];

  return (
    <section className="py-16 bg-bg-cardLight relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/3 to-transparent"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">Trusted By</span> Luxury Brands
          </h2>
          <p className="text-muted">Partnering with the world's most prestigious brands</p>
        </div>

        {/* Infinite Scroll Container */}
        <div className="relative overflow-hidden">
          {/* Gradient masks for smooth edges */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-bg-cardLight to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-bg-cardLight to-transparent z-10"></div>

          {/* Scrolling brands - Row 1 (Left to Right) */}
          <div className="flex animate-scroll-left">
            {extendedBrands.map((brand, index) => (
              <div
                key={`row1-${index}`}
                className="flex-shrink-0 w-40 h-24 mx-8 luxury-card rounded-xl flex items-center justify-center group hover:border-gold/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-4xl font-display font-bold text-gold/40 group-hover:text-gold transition-colors">
                  {brand.placeholder}
                </div>
              </div>
            ))}
          </div>

          {/* Scrolling brands - Row 2 (Right to Left, offset) */}
          <div className="flex animate-scroll-right mt-4">
            {extendedBrands.map((brand, index) => (
              <div
                key={`row2-${index}`}
                className="flex-shrink-0 w-40 h-24 mx-8 luxury-card rounded-xl flex items-center justify-center group hover:border-gold/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-4xl font-display font-bold text-gold/40 group-hover:text-gold transition-colors">
                  {brand.placeholder}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-display font-bold gradient-text mb-2">50+</div>
            <div className="text-muted text-sm uppercase tracking-wider">Luxury Brands</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-display font-bold gradient-text mb-2">200+</div>
            <div className="text-muted text-sm uppercase tracking-wider">Campaigns</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-display font-bold gradient-text mb-2">98%</div>
            <div className="text-muted text-sm uppercase tracking-wider">Satisfaction</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-scroll-left {
          animation: scroll-left 30s linear infinite;
        }
        .animate-scroll-right {
          animation: scroll-right 30s linear infinite;
        }
      `}</style>
    </section>
  );
};

export default BrandLogos;
