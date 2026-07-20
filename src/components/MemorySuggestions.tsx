import { Clock, MapPin, Repeat, Navigation, Sparkles } from 'lucide-react';
import { MemoryPlace } from '@/hooks/useGraphMemory';

interface MemorySuggestionsProps {
  recentPlaces: MemoryPlace[];
  frequentPlaces: MemoryPlace[];
  suggestions: string[];
  onSuggestionClick: (text: string) => void;
  isVisible: boolean;
}

const MemorySuggestions = ({ recentPlaces, frequentPlaces, suggestions, onSuggestionClick, isVisible }: MemorySuggestionsProps) => {
  if (!isVisible) return null;
  
  const hasContent = recentPlaces.length > 0 || frequentPlaces.length > 0 || suggestions.length > 0;
  if (!hasContent) return null;

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Predictive Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Suggested for you</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick(suggestion)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
              >
                <Navigation className="w-3 h-3" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Places */}
      {recentPlaces.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Recent places</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentPlaces.slice(0, 4).map((place) => (
              <button
                key={place.id}
                onClick={() => onSuggestionClick(`Navigate to ${place.name}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs glass hover:bg-muted/80 transition-colors"
              >
                <MapPin className="w-3 h-3 text-muted-foreground" />
                {place.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Frequently Visited */}
      {frequentPlaces.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Repeat className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Frequently visited</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {frequentPlaces.slice(0, 3).map((place) => (
              <button
                key={place.id}
                onClick={() => onSuggestionClick(`Navigate to ${place.name}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-accent/50 hover:bg-accent/70 transition-colors"
              >
                <MapPin className="w-3 h-3" />
                {place.name}
                <span className="text-muted-foreground">({place.visitCount}x)</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemorySuggestions;
