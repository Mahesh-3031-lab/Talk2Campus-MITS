import { useNavigate } from 'react-router-dom';
import { GraduationCap, Users } from 'lucide-react';
import { useAppMode, AppMode } from '@/hooks/useAppMode';
import { stopSpeaking } from '@/lib/speakMultilingual';
import { cn } from '@/lib/utils';

interface ModeSwitcherProps {
  current: AppMode;
  className?: string;
  onBeforeSwitch?: () => void;
}

/**
 * Minimal floating pill that switches to the opposite mode.
 * Positioned bottom-right by default to avoid overlapping Navbar/Hero.
 */
const ModeSwitcher = ({ current, className, onBeforeSwitch }: ModeSwitcherProps) => {
  const navigate = useNavigate();
  const { setMode } = useAppMode();

  const target: AppMode = current === 'student' ? 'parent' : 'student';
  const Icon = target === 'parent' ? Users : GraduationCap;
  const label = target === 'parent' ? 'Parent Mode' : 'Student Mode';

  const handleClick = () => {
    onBeforeSwitch?.();
    try { window.speechSynthesis?.cancel(); } catch {}
    stopSpeaking();
    setMode(target);
    navigate(`/${target}`);
  };

  return (
    <button
      onClick={handleClick}
      aria-label={`Switch to ${label}`}
      className={cn(
        'fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-primary/20 bg-card/90 px-4 py-2 text-sm font-medium text-foreground shadow-elegant backdrop-blur transition-colors hover:bg-primary hover:text-primary-foreground',
        className
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
};

export default ModeSwitcher;
