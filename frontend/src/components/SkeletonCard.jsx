/**
 * SkeletonCard - Animated loading placeholder with gold shimmer effect.
 * 
 * Variants:
 *  - "stat"    : Small stat card (stats grid)
 *  - "card"    : Medium content card (campaigns, creators)
 *  - "message" : Narrow message bar
 *  - "row"     : Table-like row
 */

const SkeletonCard = ({ variant = 'card', count = 1 }) => {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === 'stat') {
    return (
      <>
        {items.map((i) => (
          <div key={i} className="bg-bg-card rounded-xl p-6 border border-border skeleton-shimmer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 bg-border/50 rounded-lg" />
            </div>
            <div className="h-7 w-16 bg-border/50 rounded mb-2" />
            <div className="h-4 w-24 bg-border/30 rounded" />
          </div>
        ))}
      </>
    );
  }

  if (variant === 'card') {
    return (
      <>
        {items.map((i) => (
          <div key={i} className="bg-bg-card rounded-xl p-6 border border-border skeleton-shimmer">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-border/50 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 bg-border/50 rounded" />
                <div className="h-3 w-1/2 bg-border/30 rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-border/30 rounded" />
              <div className="h-3 w-2/3 bg-border/30 rounded" />
            </div>
            <div className="mt-4 pt-4 border-t border-border/30">
              <div className="h-10 w-full bg-border/40 rounded-lg" />
            </div>
          </div>
        ))}
      </>
    );
  }

  if (variant === 'message') {
    return (
      <>
        {items.map((i) => (
          <div key={i} className="flex items-center gap-3 p-4 border-b border-border/30 skeleton-shimmer">
            <div className="w-10 h-10 bg-border/50 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-border/50 rounded" />
              <div className="h-3 w-2/3 bg-border/30 rounded" />
            </div>
            <div className="h-3 w-8 bg-border/30 rounded" />
          </div>
        ))}
      </>
    );
  }

  if (variant === 'row') {
    return (
      <>
        {items.map((i) => (
          <div key={i} className="bg-bg rounded-lg p-4 border border-border/50 skeleton-shimmer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-border/50 rounded-full" />
                <div className="h-4 w-32 bg-border/40 rounded" />
              </div>
              <div className="h-6 w-20 bg-border/30 rounded-full" />
            </div>
          </div>
        ))}
      </>
    );
  }

  return null;
};

export default SkeletonCard;
