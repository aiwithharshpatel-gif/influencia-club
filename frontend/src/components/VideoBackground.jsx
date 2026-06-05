const VideoBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.14),transparent_55%)]"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-bg/80 via-bg/60 to-bg/80"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-bg/90 via-transparent to-bg/90"></div>

      {/* Gold tint overlay */}
      <div className="absolute inset-0 bg-gold/5 mix-blend-overlay"></div>

      {/* Animated particles on top of video */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gold/40 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoBackground;
