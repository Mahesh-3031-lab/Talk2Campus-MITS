import { detectLanguageFromText, SupportedLanguage } from './language';

let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;
let isSpeakingState = false;

// Callbacks for UI reactivity
type SpeakingChangeCallback = (speaking: boolean) => void;
const listeners = new Set<SpeakingChangeCallback>();

export function onSpeakingChange(cb: SpeakingChangeCallback) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

function setSpeaking(val: boolean) {
  isSpeakingState = val;
  listeners.forEach(cb => cb(val));
}

export function isSpeaking() {
  return isSpeakingState;
}

/**
 * Stop any currently playing TTS audio.
 */
export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
  // Also stop browser speechSynthesis
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  setSpeaking(false);
}

// Language code mapping for browser speechSynthesis
const BROWSER_LANG_MAP: Record<string, string> = {
  'en-IN': 'en-IN',
  'te-IN': 'te-IN',
  'hi-IN': 'hi-IN',
  'ta-IN': 'ta-IN',
  'kn-IN': 'kn-IN',
  'ml-IN': 'ml-IN',
};

/**
 * Speak text using browser speechSynthesis with multilingual support.
 * Automatically detects language from Unicode script ranges.
 * Cancels any currently playing audio before starting.
 */
export async function speakMultilingual(
  text: string,
  languageHint?: SupportedLanguage
): Promise<void> {
  if (!text.trim()) return;

  // Stop any ongoing playback
  stopSpeaking();

  const detectedLang = languageHint || detectLanguageFromText(text);

  // Use browser speechSynthesis directly
  speakWithBrowser(text, detectedLang);
}

/**
 * Browser speechSynthesis fallback for when cloud TTS is unavailable.
 */
function speakWithBrowser(text: string, lang: string): void {
  if (!window.speechSynthesis) {
    console.warn('No speech synthesis available');
    setSpeaking(false);
    return;
  }

  // Clean text for speech
  const cleanText = text
    .replace(/[*#_~`>|\\[\]{}()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) {
    setSpeaking(false);
    return;
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = BROWSER_LANG_MAP[lang] || lang;
  utterance.rate = 1.05;
  utterance.pitch = 1.05;

  utterance.onend = () => setSpeaking(false);
  utterance.onerror = () => setSpeaking(false);

  setSpeaking(true);
  window.speechSynthesis.speak(utterance);
}
