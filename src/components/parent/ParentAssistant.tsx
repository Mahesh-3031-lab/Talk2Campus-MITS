import mitsLogo from '@/assets/mits-logo.jpeg';
import { cn } from '@/lib/utils';

interface ParentAssistantProps {
  isSpeaking: boolean;
  isListening: boolean;
}

const ParentAssistant = ({ isSpeaking, isListening }: ParentAssistantProps) => {
  const active = isSpeaking || isListening;
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow rings */}
      <div
        className={cn(
          'absolute rounded-full transition-all duration-500',
          isSpeaking ? 'animate-ping bg-primary/20' : 'bg-primary/5',
          'h-[420px] w-[420px]'
        )}
      />
      <div
        className={cn(
          'absolute rounded-full transition-all duration-500',
          active ? 'bg-primary/15' : 'bg-primary/5',
          'h-[320px] w-[320px] blur-2xl'
        )}
      />
      <div
        className={cn(
          'absolute rounded-full transition-all duration-700',
          active ? 'bg-primary/25 animate-pulse' : 'bg-primary/10',
          'h-[220px] w-[220px] blur-xl'
        )}
      />

      {/* Logo orb */}
      <div
        className={cn(
          'relative flex h-44 w-44 items-center justify-center rounded-full bg-card shadow-elegant transition-transform duration-500',
          isSpeaking && 'scale-110',
          isListening && !isSpeaking && 'scale-105'
        )}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-primary/20" />
        <div className="absolute inset-1 rounded-full border border-primary/20" />
        <img src={mitsLogo} alt="Campus Assistant" className="h-32 w-32 rounded-full object-cover" />
      </div>

      {/* Waveform bars when speaking */}
      {isSpeaking && (
        <div className="absolute -bottom-20 flex items-end gap-1.5">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 rounded-full bg-primary"
              style={{
                height: `${12 + Math.abs(Math.sin((i + 1) * 0.9)) * 28}px`,
                animation: `transcription-wave 0.9s ease-in-out ${i * 0.08}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* Listening dots */}
      {isListening && !isSpeaking && (
        <div className="absolute -bottom-16 flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ParentAssistant;
