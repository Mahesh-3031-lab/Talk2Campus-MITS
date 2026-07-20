import { useEffect, useState } from "react";

interface AudioWaveformProps {
  isActive: boolean;
  barCount?: number;
  className?: string;
}

const AudioWaveform = ({ isActive, barCount = 5, className = "" }: AudioWaveformProps) => {
  const [heights, setHeights] = useState<number[]>(Array(barCount).fill(0.3));

  useEffect(() => {
    if (!isActive) {
      setHeights(Array(barCount).fill(0.3));
      return;
    }

    const interval = setInterval(() => {
      setHeights(prev => 
        prev.map(() => 0.2 + Math.random() * 0.8)
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isActive, barCount]);

  return (
    <div className={`flex items-center justify-center gap-1 h-8 ${className}`}>
      {heights.map((height, i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-primary transition-all duration-100"
          style={{
            height: `${height * 100}%`,
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
};

export default AudioWaveform;
