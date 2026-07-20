import { detectLanguageFromText, SupportedLanguage } from './language';

let currentAudio: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;
let isSpeakingState = false;

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
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  setSpeaking(false);
}

const CLOUD_PREFERRED = new Set<string>([
  'te-IN', 'ta-IN', 'kn-IN', 'ml-IN', 'hi-IN', 'en-IN',
]);

const BROWSER_LANG_MAP: Record<string, string> = {
  'en-IN': 'en-IN',
  'te-IN': 'te-IN',
  'hi-IN': 'hi-IN',
  'ta-IN': 'ta-IN',
  'kn-IN': 'kn-IN',
  'ml-IN': 'ml-IN',
};

/**
 * Two-tier TTS:
 * Tier 1 — Supabase cloud-tts edge function (ElevenLabs multilingual_v2)
 * Tier 2 — Browser speechSynthesis fallback
 */
export async function speakMultilingual(
  text: string,
  languageHint?: SupportedLanguage
): Promise<void> {
  if (!text.trim()) return;
  stopSpeaking();

  const lang: SupportedLanguage = languageHint ?? detectLanguageFromText(text);

  if (CLOUD_PREFERRED.has(lang)) {
    const ok = await tryCloudTTS(text, lang);
    if (ok) return;
  }

  speakWithBrowser(text, lang);
}

async function tryCloudTTS(text: string, lang: SupportedLanguage): Promise<boolean> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
  if (!supabaseUrl || !supabaseKey) return false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/cloud-tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ text, language: lang }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[TTS] cloud-tts returned ${response.status}, falling back to browser`);
      return false;
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.startsWith('audio/')) {
      console.warn('[TTS] cloud-tts returned non-audio response, falling back to browser');
      return false;
    }
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength < 100) {
      console.warn('[TTS] cloud-tts returned empty audio, falling back to browser');
      return false;
    }

    const blob = new Blob([buffer], { type: 'audio/mpeg' });
    const objectUrl = URL.createObjectURL(blob);
    currentObjectUrl = objectUrl;
    const audio = new Audio(objectUrl);
    currentAudio = audio;

    await new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        setSpeaking(false);
        URL.revokeObjectURL(objectUrl);
        currentObjectUrl = null;
        currentAudio = null;
        resolve();
      };
      audio.onerror = () => {
        setSpeaking(false);
        URL.revokeObjectURL(objectUrl);
        currentObjectUrl = null;
        currentAudio = null;
        reject(new Error('Audio element error'));
      };
      setSpeaking(true);
      audio.play().catch(reject);
    });
    return true;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('aborted')) {
      console.warn('[TTS] cloud-tts failed, using browser fallback:', msg);
    }
    return false;
  }
}

function speakWithBrowser(text: string, lang: SupportedLanguage): void {
  if (!window.speechSynthesis) {
    console.warn('[TTS] Browser speechSynthesis not available');
    setSpeaking(false);
    return;
  }

  const cleanText = text
    .replace(/[*#_~`>|\\[\]{}()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) {
    setSpeaking(false);
    return;
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = BROWSER_LANG_MAP[lang] ?? 'en-IN';
  utterance.rate = 1.0;
  utterance.pitch = 1.05;

  const doSpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = lang.split('-')[0];
    const exactMatch = voices.find(v => v.lang === utterance.lang);
    const prefixMatch = voices.find(v => v.lang.startsWith(langPrefix));
    if (exactMatch) utterance.voice = exactMatch;
    else if (prefixMatch) utterance.voice = prefixMatch;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = (e) => {
      console.warn('[TTS] Browser speech error:', e.error);
      setSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length > 0) {
    doSpeak();
  } else {
    const handler = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      doSpeak();
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      doSpeak();
    }, 1000);
  }
}
