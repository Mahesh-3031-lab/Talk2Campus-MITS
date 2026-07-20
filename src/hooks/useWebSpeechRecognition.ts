import { useState, useCallback, useRef, useEffect } from 'react';
import { SupportedLanguage } from '@/lib/language';

// Re-export for backward compat
export type { SupportedLanguage } from '@/lib/language';
export { SUPPORTED_LANGUAGES } from '@/lib/language';
export type { LanguageOption } from '@/lib/language';

interface UseWebSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  selectedLanguage: SupportedLanguage;
  setSelectedLanguage: (lang: SupportedLanguage) => void;
  startListening: (onSpeechEnd?: (finalTranscript: string) => void) => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

// Extend Window interface for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

export const useWebSpeechRecognition = (
  externalLanguage?: SupportedLanguage,
  onLanguageChange?: (lang: SupportedLanguage) => void
): UseWebSpeechRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [internalLanguage, setInternalLanguage] = useState<SupportedLanguage>('en-IN');

  const selectedLanguage = externalLanguage ?? internalLanguage;
  const setSelectedLanguage = useCallback((lang: SupportedLanguage) => {
    if (onLanguageChange) {
      onLanguageChange(lang);
    } else {
      setInternalLanguage(lang);
    }
  }, [onLanguageChange]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onSpeechEndCallbackRef = useRef<((finalTranscript: string) => void) | null>(null);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedTranscriptRef = useRef<string>('');

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const clearSilenceTimeout = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  const createRecognition = useCallback((onSpeechEnd?: (finalTranscript: string) => void) => {
    if (!isSupported) return null;

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedLanguage;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      accumulatedTranscriptRef.current = '';
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalTranscript) {
        accumulatedTranscriptRef.current += finalTranscript;
        setTranscript(accumulatedTranscriptRef.current);
      }
      setInterimTranscript(interim);

      clearSilenceTimeout();

      if (finalTranscript && onSpeechEnd) {
        silenceTimeoutRef.current = setTimeout(() => {
          const currentTranscript = accumulatedTranscriptRef.current.trim();
          if (currentTranscript) {
            recognition.stop();
            onSpeechEnd(currentTranscript);
          }
        }, 1500);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'aborted' is expected when we programmatically stop/restart recognition — ignore it
      if (event.error === 'aborted') {
        return;
      }
      console.error('Speech recognition error:', event.error);
      clearSilenceTimeout();

      switch (event.error) {
        case 'no-speech':
          setError('No speech detected. Please try again.');
          break;
        case 'audio-capture':
          setError('No microphone found. Please check your device.');
          break;
        case 'not-allowed':
          setError('Microphone permission denied. Please allow access.');
          break;
        case 'network':
          setError('Network error. Please check your connection.');
          break;
        default:
          setError(`Error: ${event.error}`);
      }

      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      clearSilenceTimeout();
    };

    return recognition;
  }, [isSupported, selectedLanguage, clearSilenceTimeout]);

  const startListening = useCallback((onSpeechEnd?: (finalTranscript: string) => void) => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    onSpeechEndCallbackRef.current = onSpeechEnd || null;

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    clearSilenceTimeout();

    recognitionRef.current = createRecognition(onSpeechEnd);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start recognition:', e);
        setError('Failed to start voice recognition.');
      }
    }
  }, [isSupported, createRecognition, clearSilenceTimeout]);

  const stopListening = useCallback(() => {
    clearSilenceTimeout();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, [clearSilenceTimeout]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    accumulatedTranscriptRef.current = '';
  }, []);

  useEffect(() => {
    return () => {
      clearSilenceTimeout();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [clearSilenceTimeout]);

  useEffect(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = createRecognition(onSpeechEndCallbackRef.current || undefined);
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    }
  }, [selectedLanguage, createRecognition, isListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    selectedLanguage,
    setSelectedLanguage,
    startListening,
    stopListening,
    resetTranscript,
  };
};
