import { useEffect, useState } from "react";

interface WavesAnimationProps {
  isActive?: boolean;
  intensity?: number; // 0-1 scale
}

const WavesAnimation = ({ isActive = false, intensity = 0.3 }: WavesAnimationProps) => {
  const [waveHeights, setWaveHeights] = useState([1, 1, 1, 1]);

  useEffect(() => {
    if (!isActive) {
      setWaveHeights([1, 1, 1, 1]);
      return;
    }

    const interval = setInterval(() => {
      setWaveHeights([
        0.8 + Math.random() * 0.4 * (1 + intensity),
        0.7 + Math.random() * 0.5 * (1 + intensity),
        0.9 + Math.random() * 0.3 * (1 + intensity),
        0.75 + Math.random() * 0.45 * (1 + intensity),
      ]);
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, intensity]);

  const baseAnimationDuration = isActive ? 2 : 8;
  const activeScale = isActive ? 1.2 : 1;

  return (
    <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none z-0">
      <svg
        className="w-full transition-all duration-300"
        style={{
          height: isActive ? '10rem' : '8rem',
          transform: `scaleY(${activeScale})`,
          transformOrigin: 'bottom',
        }}
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Wave 1 - Back layer */}
        <path
          className={`transition-all duration-150 ${isActive ? 'fill-primary/20' : 'fill-primary/10'}`}
          style={{
            animation: `wave-flow ${baseAnimationDuration}s ease-in-out infinite`,
            transform: `scaleY(${waveHeights[0]})`,
            transformOrigin: 'bottom',
          }}
          d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
        
        {/* Wave 2 - Middle layer */}
        <path
          className={`transition-all duration-150 ${isActive ? 'fill-primary/25' : 'fill-primary/15'}`}
          style={{
            animation: `wave-flow ${baseAnimationDuration * 0.75}s ease-in-out infinite`,
            animationDelay: '-2s',
            transform: `scaleY(${waveHeights[1]})`,
            transformOrigin: 'bottom',
          }}
          d="M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,197.3C672,213,768,235,864,224C960,213,1056,171,1152,165.3C1248,160,1344,192,1392,208L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
        
        {/* Wave 3 - Front layer */}
        <path
          className={`transition-all duration-150 ${isActive ? 'fill-primary/35' : 'fill-primary/20'}`}
          style={{
            animation: `wave-flow ${baseAnimationDuration * 0.5}s ease-in-out infinite`,
            animationDelay: '-1s',
            transform: `scaleY(${waveHeights[2]})`,
            transformOrigin: 'bottom',
          }}
          d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,229.3C672,245,768,267,864,261.3C960,256,1056,224,1152,213.3C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
        
        {/* Wave 4 - Bottom accent with glow effect when active */}
        <path
          className={`transition-all duration-150 ${isActive ? 'fill-primary-glow/40' : 'fill-primary-glow/25'}`}
          style={{
            animation: `wave-flow ${baseAnimationDuration}s ease-in-out infinite`,
            animationDelay: '-3s',
            transform: `scaleY(${waveHeights[3]})`,
            transformOrigin: 'bottom',
          }}
          d="M0,320L48,304C96,288,192,256,288,245.3C384,235,480,245,576,256C672,267,768,277,864,272C960,267,1056,245,1152,240C1248,235,1344,245,1392,250.7L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>
      
      {/* Glow overlay when active */}
      {isActive && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-primary/20 to-transparent pointer-events-none animate-pulse"
          style={{ animationDuration: '1s' }}
        />
      )}
    </div>
  );
};

export default WavesAnimation;
