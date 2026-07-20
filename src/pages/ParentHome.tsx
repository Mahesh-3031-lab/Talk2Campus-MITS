import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, MapPin, X } from 'lucide-react';
import ParentAssistant from '@/components/parent/ParentAssistant';
import SEOHead from '@/components/SEOHead';
import ModeSwitcher from '@/components/ModeSwitcher';
import { useAppMode } from '@/hooks/useAppMode';
import { useParentVoiceSession } from '@/hooks/useParentVoiceSession';
import { useLanguagePreference } from '@/hooks/useLanguagePreference';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@/lib/language';
import { stopSpeaking } from '@/lib/speakMultilingual';

const STATUS_LABEL: Record<string, Record<SupportedLanguage, string>> = {
  greeting: {
    'en-IN': 'Greeting you…',
    'te-IN': 'మిమ్మల్ని పలకరిస్తున్నాను…',
    'hi-IN': 'आपका स्वागत…',
    'ta-IN': 'வரவேற்கிறேன்…',
    'kn-IN': 'ಸ್ವಾಗತಿಸುತ್ತಿದ್ದೇನೆ…',
    'ml-IN': 'സ്വാഗതം പറയുന്നു…',
  },
  listening: {
    'en-IN': 'Listening… please speak',
    'te-IN': 'వింటున్నాను… మాట్లాడండి',
    'hi-IN': 'सुन रहा हूं… बोलिए',
    'ta-IN': 'கேட்கிறேன்… பேசுங்கள்',
    'kn-IN': 'ಕೇಳುತ್ತಿದ್ದೇನೆ… ಮಾತನಾಡಿ',
    'ml-IN': 'കേൾക്കുന്നു… സംസാരിക്കൂ',
  },
  thinking: {
    'en-IN': 'Thinking…',
    'te-IN': 'ఆలోచిస్తున్నాను…',
    'hi-IN': 'सोच रहा हूं…',
    'ta-IN': 'யோசிக்கிறேன்…',
    'kn-IN': 'ಯೋಚಿಸುತ್ತಿದ್ದೇನೆ…',
    'ml-IN': 'ചിന്തിക്കുന്നു…',
  },
  speaking: {
    'en-IN': 'Speaking…',
    'te-IN': 'మాట్లాడుతున్నాను…',
    'hi-IN': 'बोल रहा हूं…',
    'ta-IN': 'பேசுகிறேன்…',
    'kn-IN': 'ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ…',
    'ml-IN': 'സംസാരിക്കുന്നു…',
  },
};

const ParentHome = () => {
  const { setMode } = useAppMode();
  const { language, setLanguage } = useLanguagePreference();
  const session = useParentVoiceSession(language);
  const navigate = useNavigate();

  useEffect(() => {
    setMode('parent');
  }, [setMode]);

  useEffect(() => {
    if (session.language !== language) {
      session.setLanguage(language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Auto-start + bulletproof cleanup on unmount
  useEffect(() => {
    session.start();
    return () => {
      session.stop();
      stopSpeaking();
      try { window.speechSynthesis?.cancel(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goStudent = () => {
    session.stop();
    stopSpeaking();
    try { window.speechSynthesis?.cancel(); } catch {}
    setMode('student');
    navigate('/student');
  };

  const statusKey = ['greeting', 'listening', 'thinking', 'speaking'].includes(session.status)
    ? session.status
    : null;
  const statusText = statusKey
    ? STATUS_LABEL[statusKey][session.language] || STATUS_LABEL[statusKey]['en-IN']
    : '';

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-primary/5 animate-fade-in">
      <SEOHead
        title="Parent Mode — Talk2Campus | Voice Campus Assistant"
        description="Voice-first multilingual campus assistant for parents visiting MITS. Ask anything and get spoken guidance."
        path="/parent"
      />

      {/* Top-left: switch to Student (reusable switcher, repositioned) */}
      <ModeSwitcher
        current="parent"
        onBeforeSwitch={() => session.stop()}
        className="bottom-auto right-auto top-4 left-4"
      />

      {/* Top-right: language */}
      <div className="absolute top-4 right-4 z-20">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
          className="rounded-full border border-primary/20 bg-card/80 px-3 py-2 text-sm backdrop-blur shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-label="Language"
        >
          {SUPPORTED_LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.nativeName}</option>
          ))}
        </select>
      </div>

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6">
        <ParentAssistant isSpeaking={session.isSpeaking} isListening={session.isListening && !session.isSpeaking} />

        <div className="mt-32 max-w-xl text-center">
          {session.status === 'denied' && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
              Microphone access is needed for voice. Please allow it and tap the mic below.
            </div>
          )}

          {statusText && (
            <p className="text-base font-medium text-muted-foreground">{statusText}</p>
          )}

          {session.lastReply && (
            <p className="mt-3 text-lg leading-relaxed text-foreground/90 line-clamp-4">
              {session.lastReply}
            </p>
          )}
        </div>

        {session.navigateTarget && (
          <div className="fixed bottom-28 left-1/2 z-30 -translate-x-1/2 flex items-center gap-3 rounded-full border border-primary/30 bg-card px-5 py-3 shadow-elegant">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Guiding you to {session.navigateTarget}</span>
            <button
              onClick={() => {
                const target = session.navigateTarget;
                session.clearNavigateTarget();
                navigate(`/chat?destination=${encodeURIComponent(target || '')}`);
              }}
              className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Open Map
            </button>
            <button
              onClick={session.clearNavigateTarget}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>

      <div className="fixed bottom-8 left-1/2 z-20 -translate-x-1/2">
        {session.status === 'idle' || session.status === 'denied' || session.status === 'error' ? (
          <button
            onClick={() => session.start()}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-primary-foreground shadow-elegant hover:scale-105 transition-transform"
          >
            <Mic className="h-5 w-5" />
            <span className="font-semibold">Start talking</span>
          </button>
        ) : (
          <button
            onClick={() => session.stop()}
            className="flex items-center gap-2 rounded-full border border-destructive/30 bg-card px-5 py-3 text-destructive shadow-sm hover:bg-destructive/10"
          >
            <MicOff className="h-5 w-5" />
            <span className="font-medium">Stop</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ParentHome;
