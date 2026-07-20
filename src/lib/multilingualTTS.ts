// src/utils/multilingualTTS.ts

// 🔎 Detect language using Unicode ranges
export function detectLanguage(text: string): string {
  if (/[\u0C00-\u0C7F]/.test(text)) return "te-IN"; // Telugu
  if (/[\u0900-\u097F]/.test(text)) return "hi-IN"; // Hindi
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta-IN"; // Tamil
  if (/[\u0C80-\u0CFF]/.test(text)) return "kn-IN"; // Kannada
  return "en-IN"; // Default English
}

// 🎙 Google Cloud TTS Voice Mapping
function getVoiceConfig(languageCode: string) {
  const voiceMap: Record<string, string> = {
    "te-IN": "te-IN-Standard-A",
    "hi-IN": "hi-IN-Standard-A",
    "ta-IN": "ta-IN-Standard-A",
    "kn-IN": "kn-IN-Standard-A",
    "en-IN": "en-IN-Standard-A"
  };

  return {
    languageCode,
    name: voiceMap[languageCode] || "en-IN-Standard-A",
    ssmlGender: "FEMALE"
  };
}

// 🔊 Main TTS Function
export async function speakMultilingual(
  text: string,
  apiKey: string
): Promise<void> {
  const languageCode = detectLanguage(text);
  const voice = getVoiceConfig(languageCode);

  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          input: { text },
          voice,
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 1.0,
            pitch: 0
          }
        })
      }
    );

    const data = await response.json();

    if (!data.audioContent) {
      console.error("No audio content received from TTS.");
      return;
    }

    const audio = new Audio(
      "data:audio/mp3;base64," + data.audioContent
    );
    audio.play();

  } catch (error) {
    console.error("Multilingual TTS Error:", error);
  }
}