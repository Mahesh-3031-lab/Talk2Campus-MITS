import { useState, useEffect, useCallback } from 'react';
import { SupportedLanguage } from '@/lib/language';

const STORAGE_KEY = 'talk2campus_language_preference';

interface UseLanguagePreferenceReturn {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  isLoaded: boolean;
}

export const useLanguagePreference = (): UseLanguagePreferenceReturn => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en-IN');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored && isValidLanguage(stored)) {
      setLanguageState(stored as SupportedLanguage);
    } else {
      const detected = detectBrowserLanguage();
      if (detected) {
        setLanguageState(detected);
        localStorage.setItem(STORAGE_KEY, detected);
      }
    }
    
    setIsLoaded(true);
  }, []);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  return { language, setLanguage, isLoaded };
};

function isValidLanguage(code: string): code is SupportedLanguage {
  const validCodes: SupportedLanguage[] = ['en-IN', 'te-IN', 'hi-IN', 'ta-IN', 'kn-IN', 'ml-IN'];
  return validCodes.includes(code as SupportedLanguage);
}

function detectBrowserLanguage(): SupportedLanguage | null {
  if (typeof navigator === 'undefined') return null;

  const browserLang = navigator.language || (navigator as any).userLanguage || '';
  const langCode = browserLang.toLowerCase();

  const languageMap: Record<string, SupportedLanguage> = {
    'te': 'te-IN', 'te-in': 'te-IN',
    'hi': 'hi-IN', 'hi-in': 'hi-IN',
    'ta': 'ta-IN', 'ta-in': 'ta-IN',
    'kn': 'kn-IN', 'kn-in': 'kn-IN',
    'ml': 'ml-IN', 'ml-in': 'ml-IN',
    'en': 'en-IN', 'en-in': 'en-IN', 'en-us': 'en-IN', 'en-gb': 'en-IN',
  };

  if (languageMap[langCode]) return languageMap[langCode];
  const prefix = langCode.split('-')[0];
  if (languageMap[prefix]) return languageMap[prefix];
  return null;
}

export default useLanguagePreference;
