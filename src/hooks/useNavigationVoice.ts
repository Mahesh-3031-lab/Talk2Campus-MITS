import { useCallback, useRef } from 'react';
import { SupportedLanguage } from '@/lib/language';
import { speakMultilingual, stopSpeaking } from '@/lib/speakMultilingual';

interface NavigationVoiceOptions {
  language?: SupportedLanguage;
}

interface UseNavigationVoiceReturn {
  speakDirection: (text: string, options?: NavigationVoiceOptions) => void;
  speakProgress: (message: string) => void;
  speakLandmark: (landmark: string) => void;
  stopNavigation: () => void;
  isSpeaking: boolean;
}

const PROGRESS_PHRASES: Record<string, Record<string, string>> = {
  'en-IN': {
    onTrack: 'You are on the right path.',
    nextTurn: 'Next turn is ahead.',
    arrived: 'You have arrived at your destination.',
    startNav: 'Starting navigation.',
  },
  'hi-IN': {
    onTrack: 'आप सही रास्ते पर हैं।',
    nextTurn: 'अगला मोड़ आगे है।',
    arrived: 'आप अपने गंतव्य पर पहुंच गए हैं।',
    startNav: 'नेविगेशन शुरू हो रहा है।',
  },
  'te-IN': {
    onTrack: 'మీరు సరైన దారిలో ఉన్నారు.',
    nextTurn: 'తదుపరి మలుపు ముందుంది.',
    arrived: 'మీరు మీ గమ్యస్థానానికి చేరుకున్నారు.',
    startNav: 'నావిగేషన్ ప్రారంభమవుతోంది.',
  },
  'ta-IN': {
    onTrack: 'நீங்கள் சரியான பாதையில் இருக்கிறீர்கள்.',
    nextTurn: 'அடுத்த திருப்பம் முன்னால் உள்ளது.',
    arrived: 'நீங்கள் உங்கள் இலக்கை அடைந்துவிட்டீர்கள்.',
    startNav: 'வழிசெலுத்தல் தொடங்குகிறது.',
  },
  'kn-IN': {
    onTrack: 'ನೀವು ಸರಿಯಾದ ಹಾದಿಯಲ್ಲಿದ್ದೀರಿ.',
    nextTurn: 'ಮುಂದಿನ ತಿರುವು ಮುಂದಿದೆ.',
    arrived: 'ನೀವು ನಿಮ್ಮ ಗಮ್ಯಸ್ಥಾನವನ್ನು ತಲುಪಿದ್ದೀರಿ.',
    startNav: 'ನ್ಯಾವಿಗೇಷನ್ ಪ್ರಾರಂಭವಾಗುತ್ತಿದೆ.',
  },
  'ml-IN': {
    onTrack: 'നിങ്ങൾ ശരിയായ വഴിയിലാണ്.',
    nextTurn: 'അടുത്ത തിരിവ് മുന്നിലാണ്.',
    arrived: 'നിങ്ങളുടെ ലക്ഷ്യസ്ഥാനത്ത് എത്തിയിരിക്കുന്നു.',
    startNav: 'നാവിഗേഷൻ ആരംഭിക്കുന്നു.',
  },
};

export const useNavigationVoice = (): UseNavigationVoiceReturn => {
  const isSpeakingRef = useRef(false);
  const currentLanguageRef = useRef<SupportedLanguage>('en-IN');

  const speakDirection = useCallback((text: string, options?: NavigationVoiceOptions) => {
    const language = options?.language || 'en-IN';
    currentLanguageRef.current = language;
    speakMultilingual(text, language);
  }, []);

  const speakProgress = useCallback((phraseKey: string) => {
    const language = currentLanguageRef.current;
    const phrases = PROGRESS_PHRASES[language] || PROGRESS_PHRASES['en-IN'];
    const message = phrases[phraseKey];
    if (message) {
      speakMultilingual(message, language);
    }
  }, []);

  const speakLandmark = useCallback((landmark: string) => {
    const language = currentLanguageRef.current;
    const prefix = language === 'hi-IN' ? 'देखें' : 'Look for';
    speakMultilingual(`${prefix}: ${landmark}`, language);
  }, []);

  const stopNavigation = useCallback(() => {
    stopSpeaking();
    isSpeakingRef.current = false;
  }, []);

  return {
    speakDirection,
    speakProgress,
    speakLandmark,
    stopNavigation,
    isSpeaking: isSpeakingRef.current,
  };
};
