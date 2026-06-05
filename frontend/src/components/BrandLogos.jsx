const BrandLogos = () => {
  const categories = [
    'Fashion',
    'Beauty',
    'Lifestyle',
    'Technology',
    'Entertainment',
    'Hospitality',
  ];
  const extendedCategories = [...categories, ...categories, ...categories];

  return (
    <section className="py-16 bg-bg-cardLight relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/3 to-transparent"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">Built for</span> Creator Collaborations
          </h2>
          <p className="text-muted">Supporting campaign discovery across growing industry categories</p>
        </div>

        {/* Infinite Scroll Container */}
        <div className="relative overflow-hidden">
          {/* Gradient masks for smooth edges */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-bg-cardLight to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-bg-cardLight to-transparent z-10"></div>

          {/* Scrolling brands - Row 1 (Left to Right) */}
          <div className="flex animate-scroll-left">
            {extendedCategories.map((category, index) => (
              <div
                key={`row1-${index}`}
                className="flex-shrink-0 w-40 h-24 mx-8 luxury-card rounded-xl flex items-center justify-center group hover:border-gold/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-xl font-display font-bold text-gold/60 group-hover:text-gold transition-colors">
                  {category}
                </div>
              </div>
            ))}
          </div>

          {/* Scrolling brands - Row 2 (Right to Left, offset) */}
          <div className="flex animate-scroll-right mt-4">
            {extendedCategories.map((category, index) => (
              <div
                key={`row2-${index}`}
                className="flex-shrink-0 w-40 h-24 mx-8 luxury-card rounded-xl flex items-center justify-center group hover:border-gold/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-xl font-display font-bold text-gold/60 group-hover:text-gold transition-colors">
                  {category}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-2xl font-display font-bold gradient-text mb-2">Discover</div>
            <div className="text-muted text-sm uppercase tracking-wider">Creator Profiles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-display font-bold gradient-text mb-2">Organize</div>
            <div className="text-muted text-sm uppercase tracking-wider">Campaign Inquiries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-display font-bold gradient-text mb-2">Manage</div>
            <div className="text-muted text-sm uppercase tracking-wider">Creator Accounts</div>
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
