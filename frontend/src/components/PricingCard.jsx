const PricingCard = ({ tier, price, features, isPopular, onSelect }) => {
  return (
    <div className={`relative card-hover bg-bg-card rounded-2xl p-8 border ${
      isPopular ? 'border-gold shadow-lg shadow-gold/20' : 'border-border'
    }`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gold text-bg-card px-4 py-1 rounded-full text-sm font-semibold">
          Most Popular
        </div>
      )}

      {/* Tier Name */}
      <h3 className="font-display text-2xl font-bold text-white mb-2">
        {tier}
      </h3>

      {/* Price */}
      <div className="mb-6">
        <span className="text-4xl font-display font-bold text-white">₹{price.toLocaleString()}</span>
        <span className="text-muted ml-2">/campaign</span>
      </div>

      {/* Features */}
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-muted text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={onSelect}
        className={`w-full py-3 rounded-lg font-semibold transition-colors ${
          isPopular
            ? 'bg-purple-glow text-white hover:opacity-90'
            : 'border-2 border-primary text-primary hover:bg-glass'
        }`}
      >
        Get Started
      </button>
    </div>
  );
};

export default PricingCard;
