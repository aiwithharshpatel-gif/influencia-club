import { useEffect, useState } from 'react';

const GoldenParticles = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate random particles
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.5 + 0.2,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: 'radial-gradient(circle, #F4D06F 0%, #D4AF37 50%, transparent 70%)',
            opacity: particle.opacity,
            animation: `float ${particle.duration}s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`,
            boxShadow: `0 0 ${particle.size * 2}px #D4AF37`,
          }}
        />
      ))}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
            opacity: 0.2;
          }
          25% {
            transform: translateY(-100px) translateX(50px) rotate(90deg);
            opacity: 0.5;
          }
          50% {
            transform: translateY(-50px) translateX(-50px) rotate(180deg);
            opacity: 0.8;
          }
          75% {
            transform: translateY(-150px) translateX(30px) rotate(270deg);
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
};

export default GoldenParticles;
