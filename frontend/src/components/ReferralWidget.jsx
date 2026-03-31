import { useState } from 'react';
import { Copy, Share2, Check } from 'lucide-react';

const ReferralWidget = ({ referralCode }) => {
  const [copied, setCopied] = useState(false);

  const referralLink = `${window.location.origin}/join?ref=${referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Influenzia Club',
          text: `Join me on Influenzia Club - India's Next-Gen Influencer Platform! Use my referral code: ${referralCode}`,
          url: referralLink
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="bg-glass rounded-xl p-6 border border-border">
      <h3 className="font-display text-xl font-bold text-white mb-4">
        🎁 Your Referral Link
      </h3>

      {/* Link Display */}
      <div className="flex items-center space-x-2 mb-4">
        <div className="flex-1 bg-bg-card rounded-lg px-4 py-3 text-sm text-muted font-mono truncate">
          {referralLink}
        </div>
        <button
          onClick={handleCopy}
          className="p-3 bg-primary rounded-lg text-white hover:bg-primary-soft transition-colors"
          title="Copy link"
        >
          {copied ? <Check size={20} /> : <Copy size={20} />}
        </button>
        <button
          onClick={handleShare}
          className="p-3 bg-primary rounded-lg text-white hover:bg-primary-soft transition-colors"
          title="Share"
        >
          <Share2 size={20} />
        </button>
      </div>

      {/* Points Info */}
      <div className="bg-bg-card rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-muted text-sm">Signup Bonus</span>
          <span className="text-gold font-semibold">+10 pts</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted text-sm">Per Referral</span>
          <span className="text-gold font-semibold">+50 pts</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted text-sm">5-Referral Bonus</span>
          <span className="text-gold font-semibold">+100 pts</span>
        </div>
      </div>

      {/* Share on WhatsApp */}
      <a
        href={`https://wa.me/?text=Join%20me%20on%20Influenzia%20Club%20-%20India's%20Next-Gen%20Influencer%20Platform!%20Use%20my%20referral%20code:%20${referralCode}%20${encodeURIComponent(referralLink)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full btn-primary text-center mt-4"
      >
        Share on WhatsApp
      </a>
    </div>
  );
};

export default ReferralWidget;
