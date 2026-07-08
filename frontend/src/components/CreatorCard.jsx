import { Verified, TrendingUp, Instagram } from 'lucide-react';

const CreatorCard = ({ creator }) => {
  const {
    name,
    photoUrl,
    category,
    city,
    instagram,
    followerCount,
    isVerified,
    isFeatured,
    bio
  } = creator;

  const categoryColors = {
    influencer: 'bg-gold/10 text-gold border border-gold/20',
    actor: 'bg-white/5 text-white/80 border border-white/10',
    model: 'bg-white/5 text-white/80 border border-white/10',
    creator: 'bg-gold/10 text-gold border border-gold/20',
    public_figure: 'bg-gold/15 text-gold border border-gold/30'
  };

  return (
    <div className="group relative bg-gradient-to-b from-[#0e0e0e] to-black rounded-2xl border border-white/5 hover:border-gold/30 transition-all duration-500 p-4 shadow-xl hover:shadow-gold-sm/10 flex flex-col h-full">
      {/* Photo Container */}
      <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-white/5">
        <img
          src={photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111&color=D4AF37&size=400`}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {isFeatured && (
          <div className="absolute top-3 right-3 bg-gold-gradient text-black px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg">
            Featured
          </div>
        )}
      </div>

      {/* Info details */}
      <div className="flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          {/* Name & Verify */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <h3 className="text-base font-semibold text-white tracking-wide group-hover:text-gold transition-colors duration-300">
                {name}
              </h3>
              {isVerified && (
                <Verified size={15} className="text-gold fill-gold/10" />
              )}
            </div>
            {creator.matchPercentage && (
              <span className="bg-gold/15 text-gold border border-gold/25 px-2 py-0.5 rounded-full text-[9px] font-bold">
                {creator.matchPercentage}
              </span>
            )}
          </div>

          {/* Instagram Handle */}
          <a
            href={`https://instagram.com/${instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-muted hover:text-white transition-colors space-x-1"
          >
            <Instagram size={12} className="text-gold/60" />
            <span>@{instagram}</span>
          </a>
        </div>

        {/* Bio */}
        {bio && (
          <p className="text-xs text-muted line-clamp-2 leading-relaxed h-8">
            {bio}
          </p>
        )}

        {/* Location & Followers and Category tags */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span className="capitalize px-2 py-0.5 rounded bg-white/5">{city}</span>
            {followerCount && (
              <span className="flex items-center text-white/90 font-medium">
                <TrendingUp size={11} className="mr-1 text-gold" />
                {followerCount}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-1 gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${categoryColors[category] || 'bg-white/5'}`}>
              {category.replace('_', ' ')}
            </span>
            <a
              href={`https://instagram.com/${instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-white/5 hover:bg-gold-gradient text-white hover:text-black border border-white/10 hover:border-transparent text-xs font-bold rounded-lg transition-all duration-300 text-center"
            >
              Collab ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorCard;
