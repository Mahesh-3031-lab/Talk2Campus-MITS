import { useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export interface VoiceCommand {
  patterns: RegExp[];
  action: () => void;
  description: string;
}

interface UseVoiceCommandsOptions {
  enabled?: boolean;
  onCommandDetected?: (command: string) => void;
}

interface UseVoiceCommandsReturn {
  checkForCommand: (transcript: string) => boolean;
  commands: VoiceCommand[];
}

export const useVoiceCommands = (options: UseVoiceCommandsOptions = {}): UseVoiceCommandsReturn => {
  const { enabled = true, onCommandDetected } = options;
  const navigate = useNavigate();
  const { toast } = useToast();
  const lastCommandRef = useRef<string>('');
  const lastCommandTimeRef = useRef<number>(0);

  // Define voice commands with patterns for multiple languages
  const commands: VoiceCommand[] = [
    {
      patterns: [
        // English patterns
        /\b(show|check|open|view|see|get)\b.*\b(my\s+)?attendance\b/i,
        /\battendance\b.*\b(show|check|open|view|see)\b/i,
        /\bmy\s+attendance\b/i,
        /\bhow\s+(is|was)\s+my\s+attendance\b/i,
        /\battendance\s+(percentage|status|report)\b/i,
        // Telugu patterns (transliterated)
        /\b(attendance|అటెండెన్స్)\b.*\b(చూపించు|చూడు)\b/i,
        /\b(హాజరు|హజరు)\b/i,
        // Hindi patterns (transliterated)
        /\b(attendance|अटेंडेंस)\b.*\b(दिखाओ|देखो)\b/i,
        /\b(उपस्थिति|हाजिरी)\b/i,
        // Simple keyword match as fallback
        /^attendance$/i,
      ],
      action: () => navigate('/attendance'),
      description: 'Open attendance tracker',
    },
    {
      patterns: [
        // Campus map commands
        /\b(show|open|view)\b.*\b(campus\s+)?map\b/i,
        /\bcampus\s+map\b/i,
        /\bnavigate\b.*\bcampus\b/i,
        /\bwhere\s+is\b/i,
        /\bhow\s+to\s+(get|go|reach)\b/i,
      ],
      action: () => {
        // This will be handled by the ChatInterface via callback
        toast({
          title: 'Opening Campus Map',
          description: 'Showing interactive campus map...',
        });
      },
      description: 'Open campus map',
    },
    {
      patterns: [
        // Admissions commands
        /\b(tell|show|explain)\b.*\badmission(s)?\b/i,
        /\badmission(s)?\s+(process|procedure|info|information)\b/i,
        /\bhow\s+to\s+(apply|admit|join)\b/i,
      ],
      action: () => navigate('/chat?topic=admissions'),
      description: 'Learn about admissions',
    },
    {
      patterns: [
        // Courses commands
        /\b(what|which)\s+courses?\b/i,
        /\bcourses?\s+(available|offered)\b/i,
        /\b(show|tell)\b.*\bcourses?\b/i,
        /\bprograms?\s+(available|offered)\b/i,
      ],
      action: () => navigate('/chat?topic=courses'),
      description: 'Explore courses',
    },
    {
      patterns: [
        // Events/updates commands
        /\b(what|upcoming|latest|new)\s+(events?|updates?|notices?)\b/i,
        /\bevents?\s+(happening|coming)\b/i,
        /\b(show|check|open)\b.*\b(events?|updates?|notices?)\b/i,
        /\bfest(s)?\b/i,
        /\byukta\b/i,
        /\bcampus\s+(news|updates?|notices?)\b/i,
        /\bany\s+new\s+(updates?|notices?|events?)\b/i,
      ],
      action: () => navigate('/updates'),
      description: 'Check events & updates',
    },
    {
      patterns: [
        // Canteen/food ordering commands
        /\b(show|open|view)\b.*\b(canteen|food|menu)\b/i,
        /\bcanteen\s+(menu|order)\b/i,
        /\border\s+food\b/i,
        /\bwant\s+to\s+(eat|order)\b/i,
        /\bfood\s+order(ing)?\b/i,
        /\bhungry\b/i,
      ],
      action: () => navigate('/canteen'),
      description: 'Open canteen orders',
    },
    {
      patterns: [
        // Home/back commands
        /\b(go\s+)?(back\s+)?(to\s+)?home\b/i,
        /\bmain\s+(page|screen)\b/i,
        /\bstart\s+over\b/i,
      ],
      action: () => navigate('/'),
      description: 'Go to home',
    },
  ];

  const checkForCommand = useCallback((transcript: string): boolean => {
    if (!enabled || !transcript.trim()) return false;

    const normalizedTranscript = transcript.toLowerCase().trim();
    
    // Debounce: Prevent same command from triggering multiple times
    const now = Date.now();
    if (normalizedTranscript === lastCommandRef.current && now - lastCommandTimeRef.current < 3000) {
      return false;
    }

    for (const command of commands) {
      for (const pattern of command.patterns) {
        if (pattern.test(normalizedTranscript)) {
          console.log(`Voice command detected: "${normalizedTranscript}" matched "${command.description}"`);
          
          lastCommandRef.current = normalizedTranscript;
          lastCommandTimeRef.current = now;
          
          // Execute the command
          command.action();
          
          // Notify callback
          onCommandDetected?.(command.description);
          
          toast({
            title: '🎤 Voice Command',
            description: command.description,
          });
          
          return true;
        }
      }
    }

    return false;
  }, [enabled, commands, onCommandDetected, toast]);

  return {
    checkForCommand,
    commands,
  };
};
