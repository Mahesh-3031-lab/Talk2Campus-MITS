import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useLiveKitVoice, ConnectionStatus } from '@/hooks/useLiveKitVoice';
import mitsLogo from '@/assets/mits-logo.jpeg';

interface VoiceAssistantProps {
  onStatusChange?: (status: ConnectionStatus) => void;
}

const VoiceAssistant = ({ onStatusChange }: VoiceAssistantProps) => {
  const { 
    status, 
    isListening, 
    isSpeaking, 
    transcript, 
    connect, 
    disconnect 
  } = useLiveKitVoice();

  const handleToggle = async () => {
    if (status === 'connected') {
      disconnect();
    } else if (status === 'disconnected' || status === 'error') {
      await connect();
    }
    onStatusChange?.(status);
  };

  const isActive = status === 'connected' && (isListening || isSpeaking);
  const isConnecting = status === 'connecting';

  return (
    <div className="relative">
      {/* Outer Glow Ring */}
      <div 
        className={`absolute -inset-8 rounded-full transition-all duration-500 ${
          isSpeaking 
            ? "animate-voice-ring bg-primary/30" 
            : isListening 
              ? "animate-voice-ring bg-primary/20" 
              : "bg-primary/5"
        }`} 
      />
      <div 
        className={`absolute -inset-4 rounded-full transition-all duration-500 ${
          isSpeaking 
            ? "animate-voice-ring-inner bg-primary/40" 
            : isListening 
              ? "animate-voice-ring-inner bg-primary/30" 
              : "bg-primary/10"
        }`} 
        style={{ animationDelay: "0.2s" }} 
      />
      
      {/* Main Container */}
      <button
        onClick={handleToggle}
        disabled={isConnecting}
        className={`relative w-40 h-40 rounded-full glass flex items-center justify-center transition-all duration-500 ${
          isActive 
            ? "glow-primary scale-110" 
            : "shadow-elegant hover:scale-105"
        } ${isConnecting ? "cursor-wait" : "cursor-pointer"}`}
      >
        {isConnecting ? (
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
        ) : isActive ? (
          /* Microphone with Voice Waves */
          <div className="relative flex items-center justify-center">
            <Mic className={`w-16 h-16 text-primary ${isSpeaking ? 'animate-bounce' : 'animate-pulse'}`} />
            {/* Voice Wave Indicators */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="voice-wave" />
              <div className="voice-wave" style={{ animationDelay: "0.2s" }} />
              <div className="voice-wave" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        ) : (
          /* College Logo with AI Agent Hug Effect */
          <div className="relative">
            <img 
              src={mitsLogo} 
              alt="MITS Logo" 
              className="w-28 h-28 rounded-full object-cover shadow-lg"
            />
            {/* AI Agent Hug Elements */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-16 bg-gradient-to-r from-primary/40 to-transparent rounded-full blur-sm animate-float" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-16 bg-gradient-to-l from-primary/40 to-transparent rounded-full blur-sm animate-float" style={{ animationDelay: "0.5s" }} />
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-gradient-to-b from-primary/30 to-transparent rounded-full blur-sm" />
          </div>
        )}
      </button>

      {/* Transcription Wave Animation */}
      {isListening && (
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-end gap-1">
          {[...Array(7)].map((_, i) => (
            <div 
              key={i}
              className="w-1.5 bg-primary rounded-full animate-transcription-wave"
              style={{ 
                animationDelay: `${i * 0.1}s`,
                height: `${Math.random() * 20 + 10}px`
              }}
            />
          ))}
        </div>
      )}

      {/* Transcript Display */}
      {transcript && (
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-64 text-center">
          <p className="text-sm text-muted-foreground italic">"{transcript}"</p>
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;
