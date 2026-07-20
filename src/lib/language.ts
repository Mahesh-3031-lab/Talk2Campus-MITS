// Shared language types and constants — single source of truth
export type SupportedLanguage =
  | 'en-IN'
  | 'te-IN'
  | 'hi-IN'
  | 'ta-IN'
  | 'kn-IN'
  | 'ml-IN';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en-IN', name: 'English', nativeName: 'English' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം' },
];

/**
 * Detect language from text using Unicode script ranges.
 * Returns the Google Cloud TTS language code.
 */
export function detectLanguageFromText(text: string): SupportedLanguage {
  // Count characters in each script range
  let telugu = 0, hindi = 0, tamil = 0, kannada = 0, malayalam = 0, latin = 0;

  for (const char of text) {
    const code = char.codePointAt(0)!;
    if (code >= 0x0C00 && code <= 0x0C7F) telugu++;
    else if (code >= 0x0900 && code <= 0x097F) hindi++;
    else if (code >= 0x0B80 && code <= 0x0BFF) tamil++;
    else if (code >= 0x0C80 && code <= 0x0CFF) kannada++;
    else if (code >= 0x0D00 && code <= 0x0D7F) malayalam++;
    else if ((code >= 0x0041 && code <= 0x007A)) latin++;
  }

  const scores: [SupportedLanguage, number][] = [
    ['te-IN', telugu],
    ['hi-IN', hindi],
    ['ta-IN', tamil],
    ['kn-IN', kannada],
    ['ml-IN', malayalam],
    ['en-IN', latin],
  ];

  scores.sort((a, b) => b[1] - a[1]);

  // If the top score is 0, default to English
  if (scores[0][1] === 0) return 'en-IN';
  return scores[0][0];
}
