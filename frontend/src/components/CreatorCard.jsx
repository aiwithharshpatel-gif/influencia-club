import { Verified, TrendingUp } from 'lucide-react';

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
    influencer: 'bg-purple-500/20 text-purple-400',
    actor: 'bg-pink-500/20 text-pink-400',
    model: 'bg-blue-500/20 text-blue-400',
    creator: 'bg-green-500/20 text-green-400',
    public_figure: 'bg-gold/20 text-gold'
  };

  return (
    <div className="card-hover bg-bg-card rounded-xl overflow-hidden border border-border">
      {/* Photo */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7B2FFF&color=fff&size=400`}
          alt={name}
          className="w-full h-full object-cover"
        />
        {isFeatured && (
          <div className="absolute top-2 right-2 bg-gold text-bg-card px-2 py-1 rounded-full text-xs font-semibold">
            Featured
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Name & Verify Badge */}
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-white">
            {name}
          </h3>
          {isVerified && (
            <Verified size={18} className="text-primary" fill="#7B2FFF" />
          )}
        </div>

        {/* Category Tag */}
        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${categoryColors[category]}`}>
          {category.replace('_', ' ')}
        </span>

        {/* Location & Followers */}
        <div className="flex items-center justify-between text-sm text-muted">
          <span>{city}</span>
          {followerCount && (
            <span className="flex items-center">
              <TrendingUp size={14} className="mr-1" />
              {followerCount}
            </span>
          )}
        </div>

        {/* Bio */}
        {bio && (
          <p className="text-sm text-muted line-clamp-2">
            {bio}
          </p>
        )}

        {/* Instagram Handle */}
        <a
          href={`https://instagram.com/${instagram}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm text-primary hover:text-primary-soft transition-colors"
        >
          @{instagram}
        </a>

        {/* Collab Button */}
        <button className="w-full btn-outline text-sm">
          Collab ↗
        </button>
      </div>
    </div>
  );
};

export default CreatorCard;
