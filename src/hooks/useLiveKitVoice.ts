import { useState, useRef, useCallback } from 'react';
import { Room, RoomEvent, Track, LocalAudioTrack, RemoteTrack, RemoteAudioTrack } from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface UseLiveKitVoiceReturn {
  status: ConnectionStatus;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendTextMessage: (text: string) => Promise<string>;
}

export const useLiveKitVoice = (): UseLiveKitVoiceReturn => {
  const { toast } = useToast();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  const roomRef = useRef<Room | null>(null);
  const localTrackRef = useRef<LocalAudioTrack | null>(null);

  const sendTextMessage = async (text: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('campus-ai', {
        body: { message: text, type: 'voice' },
      });

      if (error) throw error;
      return data.response;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const connect = useCallback(async () => {
    try {
      setStatus('connecting');

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      stream.getTracks().forEach(track => track.stop());

      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('livekit-token', {
        body: { 
          roomName: `talk2campus-${Date.now()}`,
          participantName: `user-${Date.now()}`
        },
      });

      if (tokenError) {
        console.error('Token error:', tokenError);
        throw new Error('Failed to get connection token');
      }

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      room.on(RoomEvent.Connected, () => {
        setStatus('connected');
        setIsListening(true);
        toast({
          title: 'Connected',
          description: 'Voice assistant is ready. Start speaking!',
        });
      });

      room.on(RoomEvent.Disconnected, () => {
        setStatus('disconnected');
        setIsListening(false);
      });

      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Audio) {
          const audioTrack = track as RemoteAudioTrack;
          const element = audioTrack.attach();
          document.body.appendChild(element);
        }
      });

      await room.connect(tokenData.url, tokenData.token);
      roomRef.current = room;

    } catch (error) {
      console.error('Connection error:', error);
      setStatus('error');
      
      let errorMessage = 'Failed to connect. Please try again.';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Microphone access denied. Please allow microphone access.';
        } else if (error.message.includes('token')) {
          errorMessage = 'Connection failed. Please try again.';
        }
      }
      
      toast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const disconnect = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }

    if (localTrackRef.current) {
      localTrackRef.current.stop();
      localTrackRef.current = null;
    }

    setStatus('disconnected');
    setIsListening(false);
    setIsSpeaking(false);
    setTranscript('');

    toast({
      title: 'Disconnected',
      description: 'Voice assistant disconnected.',
    });
  }, [toast]);

  return {
    status,
    isListening,
    isSpeaking,
    transcript,
    connect,
    disconnect,
    sendTextMessage,
  };
};
