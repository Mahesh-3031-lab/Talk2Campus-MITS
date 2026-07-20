import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  'https://talk2campus.mits.ac.in',
  'http://localhost:8080',
  'http://localhost:5173',
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const isVercelPreview = /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin);
const allowedOrigin = (ALLOWED_ORIGINS.includes(origin) || isVercelPreview)
  ? origin
  : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

// ─── IP Rate Limiting ─────────────────────────────────────────────────────────
const ipRateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_COUNT = 20;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(req: Request): boolean {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('cf-connecting-ip') ??
    'unknown';
  const now = Date.now();
  const entry = ipRateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_COUNT) return true;
  entry.count++;
  return false;
}

// Map language codes to ElevenLabs language_code parameter
// ElevenLabs supports these Indian languages natively
const LANGUAGE_MAP: Record<string, string> = {
  'en-IN': 'en',
  'te-IN': 'te',
  'hi-IN': 'hi',
  'ta-IN': 'ta',
  'kn-IN': 'kn',
  'ml-IN': 'ml',
};

// Unicode script detection for automatic language detection
function detectLanguage(text: string): string {
  let telugu = 0, hindi = 0, tamil = 0, kannada = 0, malayalam = 0, latin = 0;
  for (const char of text) {
    const code = char.codePointAt(0)!;
    if (code >= 0x0C00 && code <= 0x0C7F) telugu++;
    else if (code >= 0x0900 && code <= 0x097F) hindi++;
    else if (code >= 0x0B80 && code <= 0x0BFF) tamil++;
    else if (code >= 0x0C80 && code <= 0x0CFF) kannada++;
    else if (code >= 0x0D00 && code <= 0x0D7F) malayalam++;
    else if (code >= 0x0041 && code <= 0x007A) latin++;
  }

  const scores: [string, number][] = [
    ['te-IN', telugu],
    ['hi-IN', hindi],
    ['ta-IN', tamil],
    ['kn-IN', kannada],
    ['ml-IN', malayalam],
    ['en-IN', latin],
  ];
  scores.sort((a, b) => b[1] - a[1]);
  return scores[0][1] === 0 ? 'en-IN' : scores[0][0];
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (isRateLimited(req)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } },
    );
  }


  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    const { text, language } = await req.json();

    if (!text || !text.trim()) {
      return new Response(
        JSON.stringify({ error: 'No text provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Detect language from text if not explicitly provided
    const detectedLang = language || detectLanguage(text);
    const elevenLabsLang = LANGUAGE_MAP[detectedLang] || 'en';

    console.log(`TTS request: lang=${detectedLang}, elevenLabsLang=${elevenLabsLang}, text="${text.substring(0, 80)}..."`);

    // Sanitize text for TTS
    const sanitized = text
      .replace(/[*#_~`>|\\[\]{}()]/g, '')
      .replace(/\s*\n+\s*/g, '. ')
      .replace(/\s{2,}/g, ' ')
      .replace(/[^\p{L}\p{N}\p{P}\p{Z}]/gu, '')
      .trim();

    if (!sanitized) {
      return new Response(
        JSON.stringify({ error: 'No speakable text after sanitization' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use ElevenLabs multilingual v2 model with automatic language detection
    // Voice: "Rachel" (21m00Tcm4TlvDq8ikWAM) — clear, neutral, works well across languages
    const voiceId = '21m00Tcm4TlvDq8ikWAM';

    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: sanitized,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
          language_code: elevenLabsLang,
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text();
      console.error(`ElevenLabs error [${ttsResponse.status}]:`, errText);

      if (ttsResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'TTS rate limit exceeded, please try again shortly.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`ElevenLabs API error: ${ttsResponse.status}`);
    }

    // Return audio directly as binary
    const audioBuffer = await ttsResponse.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('cloud-tts error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
