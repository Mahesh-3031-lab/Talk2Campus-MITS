import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import AudioWaveform from './AudioWaveform';

interface SlideToTalkProps {
  onActivate: () => void;
  onDeactivate: () => void;
  isListening: boolean;
  isSpeaking?: boolean;
  disabled?: boolean;
}

const SlideToTalk = ({ onActivate, onDeactivate, isListening, isSpeaking, disabled }: SlideToTalkProps) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const trackWidthRef = useRef(0);
  const activatedRef = useRef(false);

  const THUMB_SIZE = 48;
  const ACTIVATION_THRESHOLD = 0.85;

  const getMaxDrag = () => {
    if (!trackRef.current) return 200;
    return trackRef.current.offsetWidth - THUMB_SIZE - 8; // 8 for padding
  };

  const handleStart = useCallback((clientX: number) => {
    if (disabled || isListening) return;
    const track = trackRef.current;
    if (!track) return;
    trackWidthRef.current = track.offsetWidth;
    startXRef.current = clientX;
    activatedRef.current = false;
    setIsDragging(true);
    setDragX(0);
  }, [disabled, isListening]);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging) return;
    const delta = clientX - startXRef.current;
    const max = getMaxDrag();
    const clamped = Math.max(0, Math.min(delta, max));
    setDragX(clamped);
  }, [isDragging]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    const max = getMaxDrag();
    const progress = dragX / max;

    if (progress >= ACTIVATION_THRESHOLD) {
      activatedRef.current = true;
      onActivate();
    }
    
    setIsDragging(false);
    setDragX(0);
  }, [isDragging, dragX, onActivate]);

  // Mouse events
  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, handleMove, handleEnd]);

  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handleMove(e.touches[0].clientX);
  };
  const onTouchEnd = () => handleEnd();
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX);

  const max = getMaxDrag();
  const progress = max > 0 ? dragX / max : 0;

  // Listening state — show active UI
  if (isListening) {
    return (
      <div className="flex items-center gap-2 w-full">
        <div
          ref={trackRef}
          className="relative flex-1 h-12 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 flex items-center px-1 overflow-hidden"
        >
          {/* Pulsing background */}
          <div className="absolute inset-0 bg-primary/10 animate-pulse rounded-full" />
          
          {/* Waveform center */}
          <div className="flex-1 flex items-center justify-center gap-2 relative z-10">
            <Mic className="w-4 h-4 text-primary animate-pulse" />
            <AudioWaveform isActive barCount={5} className="h-6" />
            <span className="text-xs font-medium text-primary">Listening…</span>
          </div>

          {/* Stop button */}
          <button
            onClick={onDeactivate}
            className="w-10 h-10 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shrink-0 relative z-10 shadow-md hover:bg-destructive/90 transition-colors"
          >
            <MicOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Default: slide-to-talk slider
  return (
    <div className="flex items-center w-full">
      <div
        ref={trackRef}
        className="relative flex-1 h-12 rounded-full bg-muted/60 border border-border/50 overflow-hidden select-none"
        style={{ touchAction: 'none' }}
      >
        {/* Progress fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-none"
          style={{
            width: `${(dragX + THUMB_SIZE + 8)}px`,
            background: `linear-gradient(90deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / ${0.15 + progress * 0.35}))`,
          }}
        />

        {/* Shimmer effect on track */}
        {!isDragging && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer bg-[length:200%_100%]" />
        )}

        {/* Label text */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200"
          style={{ opacity: 1 - progress * 1.5 }}
        >
          <span className="text-sm text-muted-foreground font-medium tracking-wide flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Slide to talk
          </span>
        </div>

        {/* Activation text */}
        {progress > 0.6 && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ opacity: (progress - 0.6) * 2.5 }}
          >
            <span className="text-sm text-primary font-semibold">Release to activate</span>
          </div>
        )}

        {/* Draggable thumb */}
        <div
          className={`absolute top-1 h-10 w-10 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-shadow ${
            isDragging 
              ? 'shadow-lg shadow-primary/30 scale-110' 
              : 'shadow-md hover:shadow-lg'
          } ${progress >= ACTIVATION_THRESHOLD ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground'}`}
          style={{
            left: `${4 + dragX}px`,
            transition: isDragging ? 'none' : 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.2s, background-color 0.2s',
          }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <Mic className={`w-5 h-5 ${progress >= ACTIVATION_THRESHOLD ? 'text-primary-foreground' : 'text-primary'}`} />
        </div>

        {/* Right-side target indicator */}
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none transition-opacity"
          style={{ opacity: isDragging ? 0.6 + progress * 0.4 : 0.3 }}
        >
          <div className={`w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center ${
            progress >= ACTIVATION_THRESHOLD ? 'border-primary bg-primary/10' : 'border-muted-foreground/30'
          }`}>
            <Mic className={`w-3 h-3 ${progress >= ACTIVATION_THRESHOLD ? 'text-primary' : 'text-muted-foreground/40'}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideToTalk;
