import { GraduationCap, Users } from 'lucide-react';
import { AppMode } from '@/hooks/useAppMode';
import { cn } from '@/lib/utils';

interface ModeToggleProps {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
  className?: string;
}

const ModeToggle = ({ mode, onChange, className }: ModeToggleProps) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-primary/20 bg-card/80 p-1 shadow-elegant backdrop-blur',
        className
      )}
      role="tablist"
      aria-label="Select mode"
    >
      <button
        role="tab"
        aria-selected={mode === 'student'}
        onClick={() => onChange('student')}
        className={cn(
          'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
          mode === 'student'
            ? 'bg-primary text-primary-foreground shadow'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <GraduationCap className="h-4 w-4" />
        Student
      </button>
      <button
        role="tab"
        aria-selected={mode === 'parent'}
        onClick={() => onChange('parent')}
        className={cn(
          'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
          mode === 'parent'
            ? 'bg-primary text-primary-foreground shadow'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Users className="h-4 w-4" />
        Parent
      </button>
    </div>
  );
};

export default ModeToggle;
