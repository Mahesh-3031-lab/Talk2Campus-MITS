import { useState, useCallback, useRef, useEffect } from 'react';
import { SupportedLanguage } from './useWebSpeechRecognition';

// Language configurations with fallback patterns
const LANGUAGE_CONFIG: Record<SupportedLanguage, { 
  codes: string[]; 
  fallbackCodes: string[];
  name: string;
}> = {
  'en-IN': { 
    codes: ['en-IN', 'en_IN'], 
    fallbackCodes: ['en-GB', 'en-US', 'en'],
    name: 'English'
  },
  'te-IN': { 
    codes: ['te-IN', 'te_IN', 'tel-IN'], 
    fallbackCodes: ['te', 'tel'],
    name: 'Telugu'
  },
  'hi-IN': { 
    codes: ['hi-IN', 'hi_IN', 'hin-IN'], 
    fallbackCodes: ['hi', 'hin'],
    name: 'Hindi'
  },
  'ta-IN': { 
    codes: ['ta-IN', 'ta_IN', 'tam-IN'], 
    fallbackCodes: ['ta', 'tam'],
    name: 'Tamil'
  },
  'kn-IN': { 
    codes: ['kn-IN', 'kn_IN', 'kan-IN'], 
    fallbackCodes: ['kn', 'kan'],
    name: 'Kannada'
  },
  'ml-IN': { 
    codes: ['ml-IN', 'ml_IN', 'mal-IN'], 
    fallbackCodes: ['ml', 'mal'],
    name: 'Malayalam'
  },
};

interface UseTextToSpeechReturn {
  isSpeaking: boolean;
  speak: (text: string, language?: SupportedLanguage) => void;
  stop: () => void;
  isSupported: boolean;
  availableVoices: SpeechSynthesisVoice[];
  hasVoiceForLanguage: (language: SupportedLanguage) => boolean;
}

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const queueRef = useRef<string[]>([]);
  const activeLanguageRef = useRef<SupportedLanguage>('en-IN');
  
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      console.log('Available TTS voices:', voices.map(v => `${v.name} (${v.lang})`));
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported]);

  const findBestVoice = useCallback((language: SupportedLanguage): SpeechSynthesisVoice | null => {
    if (availableVoices.length === 0) return null;

    const config = LANGUAGE_CONFIG[language];
    
    // Try exact matches first
    for (const code of config.codes) {
      const exactMatch = availableVoices.find(voice => 
        voice.lang.toLowerCase() === code.toLowerCase()
      );
      if (exactMatch) {
        console.log(`Found exact voice match for ${language}:`, exactMatch.name);
        return exactMatch;
      }
    }

    // Try partial matches (language code only)
    for (const code of config.fallbackCodes) {
      const partialMatch = availableVoices.find(voice => 
        voice.lang.toLowerCase().startsWith(code.toLowerCase())
      );
      if (partialMatch) {
        console.log(`Found partial voice match for ${language}:`, partialMatch.name);
        return partialMatch;
      }
    }

    // Try by name containing language name
    const nameMatch = availableVoices.find(voice => 
      voice.name.toLowerCase().includes(config.name.toLowerCase())
    );
    if (nameMatch) {
      console.log(`Found voice by name for ${language}:`, nameMatch.name);
      return nameMatch;
    }

    console.log(`No voice found for ${language}, using default`);
    return null;
  }, [availableVoices]);

  const hasVoiceForLanguage = useCallback((language: SupportedLanguage): boolean => {
    return findBestVoice(language) !== null;
  }, [findBestVoice]);

  const stop = useCallback(() => {
    queueRef.current = [];
    if (isSupported && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback((text: string, language: SupportedLanguage = 'en-IN') => {
    if (!isSupported || !text.trim()) return;

    activeLanguageRef.current = language;

    // Stop any ongoing speech + clear queue
    stop();

    const normalizeText = (t: string) =>
      t
        .replace(/\s*\n+\s*/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .replace(/"/g, '')
        .trim();

    const splitIntoChunks = (t: string) => {
      const normalized = normalizeText(t);
      if (!normalized) return [] as string[];

      // Split by sentence boundaries (including Indian danda) and keep chunks small.
      const rough = normalized.match(/[^.!?।]+[.!?।]?/g) ?? [normalized];
      const chunks: string[] = [];
      const MAX_LEN = 180;

      let buf = '';
      for (const part of rough.map(s => s.trim()).filter(Boolean)) {
        const next = buf ? `${buf} ${part}` : part;
        if (next.length > MAX_LEN) {
          if (buf) chunks.push(buf);
          // If a single sentence is too long, hard-split.
          if (part.length > MAX_LEN) {
            for (let i = 0; i < part.length; i += MAX_LEN) {
              chunks.push(part.slice(i, i + MAX_LEN));
            }
            buf = '';
          } else {
            buf = part;
          }
        } else {
          buf = next;
        }
      }
      if (buf) chunks.push(buf);
      return chunks;
    };

    const chunks = splitIntoChunks(text);
    if (chunks.length === 0) return;
    queueRef.current = chunks;

    const speakNext = () => {
      if (!isSupported) return;
      const nextText = queueRef.current.shift();
      if (!nextText) {
        setIsSpeaking(false);
        return;
      }

      // Ensure voices are loaded
      const voices = window.speechSynthesis.getVoices();
      const utterance = new SpeechSynthesisUtterance(nextText);

      const langToUse = activeLanguageRef.current;
      const bestVoice = findBestVoice(langToUse);
      if (bestVoice) {
        utterance.voice = bestVoice;
        utterance.lang = bestVoice.lang;
      } else {
        utterance.lang = langToUse;
      }

      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => speakNext();
      utterance.onerror = () => speakNext();

      utteranceRef.current = utterance;
      // Chrome sometimes needs a short delay between cancel/speak
      setTimeout(() => window.speechSynthesis.speak(utterance), voices.length ? 0 : 50);
    };

    speakNext();
  }, [isSupported, stop, findBestVoice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return {
    isSpeaking,
    speak,
    stop,
    isSupported,
    availableVoices,
    hasVoiceForLanguage,
  };
};
