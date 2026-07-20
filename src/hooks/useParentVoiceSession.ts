import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SupportedLanguage, detectLanguageFromText } from '@/lib/language';
import { speakMultilingual, stopSpeaking, onSpeakingChange } from '@/lib/speakMultilingual';
import { useWebSpeechRecognition } from '@/hooks/useWebSpeechRecognition';

const GREETINGS: Record<SupportedLanguage, string> = {
  'en-IN': 'Welcome to Talk2Campus. I am your campus assistant. How can I help you today?',
  'te-IN': 'టాక్ టూ క్యాంపస్ కి స్వాగతం. నేను మీ క్యాంపస్ సహాయకుడిని. మీకు ఎలా సహాయం చేయాలి?',
  'hi-IN': 'टॉक टू कैंपस में आपका स्वागत है। मैं आपका कैंपस सहायक हूं। मैं आपकी कैसे मदद कर सकता हूं?',
  'ta-IN': 'டாக் டூ கேம்பஸுக்கு வரவேற்கிறோம். நான் உங்கள் வளாக உதவியாளர். நான் எப்படி உதவ முடியும்?',
  'kn-IN': 'ಟಾಕ್ ಟು ಕ್ಯಾಂಪಸ್‌ಗೆ ಸ್ವಾಗತ. ನಾನು ನಿಮ್ಮ ಕ್ಯಾಂಪಸ್ ಸಹಾಯಕ. ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
  'ml-IN': 'ടോക്ക് ടു ക്യാമ്പസിലേക്ക് സ്വാഗതം. ഞാൻ നിങ്ങളുടെ ക്യാമ്പസ് സഹായിയാണ്. എങ്ങനെ സഹായിക്കാം?',
};

export type ParentStatus = 'idle' | 'requesting-mic' | 'greeting' | 'listening' | 'thinking' | 'speaking' | 'denied' | 'error';

interface UseParentVoiceSessionReturn {
  status: ParentStatus;
  isSpeaking: boolean;
  isListening: boolean;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  transcript: string;
  lastReply: string;
  navigateTarget: string | null;
  start: () => Promise<void>;
  stop: () => void;
  clearNavigateTarget: () => void;
}

export const useParentVoiceSession = (
  initialLanguage: SupportedLanguage = 'en-IN'
): UseParentVoiceSessionReturn => {
  const [status, setStatus] = useState<ParentStatus>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);
  const [lastReply, setLastReply] = useState('');
  const [navigateTarget, setNavigateTarget] = useState<string | null>(null);
  const activeRef = useRef(false);
  const langRef = useRef(language);

  useEffect(() => { langRef.current = language; }, [language]);

  const speech = useWebSpeechRecognition(language, setLanguage);

  useEffect(() => {
    return onSpeakingChange((s) => setIsSpeaking(s));
  }, []);

  const handleUserUtterance = useCallback(async (text: string) => {
    if (!activeRef.current || !text.trim()) return;
    setStatus('thinking');

    // Detect language from utterance and lock to it for this turn
    const detected = detectLanguageFromText(text);
    if (detected !== langRef.current) {
      setLanguage(detected);
    }

    try {
      const { data, error } = await supabase.functions.invoke('campus-ai', {
        body: {
          message: text,
          type: 'voice',
          userLanguage: detected,
          mode: 'parent',
        },
      });
      if (error) throw error;
      let reply: string = data?.response || '';

      // Extract [NAVIGATE:<place>] token if present
      const navMatch = reply.match(/\[NAVIGATE:([^\]]+)\]/i);
      let cleanReply = reply.replace(/\[NAVIGATE:[^\]]+\]/gi, '').trim();
      if (!cleanReply) cleanReply = reply;

      setLastReply(cleanReply);
      setStatus('speaking');
      await speakMultilingual(cleanReply, detected);

      if (navMatch) {
        setNavigateTarget(navMatch[1].trim());
      }

      // Resume listening after speaking finishes (poll)
      const waitDone = () => new Promise<void>((resolve) => {
        const check = () => {
          if (!activeRef.current) return resolve();
          // speakMultilingual returns immediately; isSpeakingState updates via listener.
          // Poll listeners state
          import('@/lib/speakMultilingual').then(m => {
            if (!m.isSpeaking()) resolve();
            else setTimeout(check, 200);
          });
        };
        setTimeout(check, 300);
      });
      await waitDone();

      if (activeRef.current) {
        setStatus('listening');
        speech.resetTranscript();
        speech.startListening(handleUserUtterance);
      }
    } catch (e) {
      console.error('Parent voice error:', e);
      setStatus('error');
      if (activeRef.current) {
        setTimeout(() => {
          if (activeRef.current) {
            setStatus('listening');
            speech.startListening(handleUserUtterance);
          }
        }, 1500);
      }
    }
  }, [speech]);

  const start = useCallback(async () => {
    if (activeRef.current) return;
    setStatus('requesting-mic');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch {
      setStatus('denied');
      return;
    }

    activeRef.current = true;
    setStatus('greeting');
    const greeting = GREETINGS[langRef.current] || GREETINGS['en-IN'];
    setLastReply(greeting);
    await speakMultilingual(greeting, langRef.current);

    // Wait for greeting to finish then start listening
    const waitGreet = () => new Promise<void>((resolve) => {
      const check = () => {
        import('@/lib/speakMultilingual').then(m => {
          if (!m.isSpeaking()) resolve();
          else setTimeout(check, 200);
        });
      };
      setTimeout(check, 400);
    });
    await waitGreet();

    if (activeRef.current) {
      setStatus('listening');
      speech.startListening(handleUserUtterance);
    }
  }, [speech, handleUserUtterance]);

  const stop = useCallback(() => {
    activeRef.current = false;
    speech.stopListening();
    stopSpeaking();
    setStatus('idle');
  }, [speech]);

  const clearNavigateTarget = useCallback(() => setNavigateTarget(null), []);

  useEffect(() => () => {
    activeRef.current = false;
    stopSpeaking();
  }, []);

  return {
    status,
    isSpeaking,
    isListening: speech.isListening,
    language,
    setLanguage,
    transcript: speech.transcript || speech.interimTranscript,
    lastReply,
    navigateTarget,
    start,
    stop,
    clearNavigateTarget,
  };
};
