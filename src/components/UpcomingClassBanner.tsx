import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Navigation, ChevronRight } from 'lucide-react';
import { useTimetable } from '@/hooks/useTimetable';
import { formatTime } from '@/lib/timetable';

interface UpcomingClassBannerProps {
  onNavigate?: (building: string) => void;
}

export default function UpcomingClassBanner({ onNavigate }: UpcomingClassBannerProps) {
  const { upcoming } = useTimetable();
  const navigate = useNavigate();

  if (upcoming.length === 0) return null;

  const next = upcoming[0];
  const { entry, minutesUntil, isOngoing } = next;

  return (
    <div className="w-full animate-in slide-in-from-top-2 duration-300">
      <button
        onClick={() => navigate('/timetable')}
        className="w-full rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-3 flex items-center gap-3 hover:border-primary/40 transition-all group text-left"
      >
        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
          isOngoing ? 'bg-green-500/15' : minutesUntil <= 15 ? 'bg-amber-500/15' : 'bg-primary/10'
        }`}>
          <Clock className={`w-5 h-5 ${
            isOngoing ? 'text-green-600' : minutesUntil <= 15 ? 'text-amber-600' : 'text-primary'
          }`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{entry.subject}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {entry.room}, {entry.building}
            <span className="mx-1">·</span>
            {formatTime(entry.startTime)}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            isOngoing
              ? 'bg-green-500/10 text-green-600'
              : minutesUntil <= 15
                ? 'bg-amber-500/10 text-amber-600'
                : 'bg-muted text-muted-foreground'
          }`}>
            {isOngoing ? 'Now' : `${minutesUntil}m`}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </button>
    </div>
  );
}
