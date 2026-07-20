import { useState, useRef, useEffect, useCallback } from "react";
import SEOHead from "@/components/SEOHead";
import { Map, Plus, Send, ArrowLeft, MessageSquare, Volume2, VolumeX, Navigation } from "lucide-react";
import AudioWaveform from "@/components/AudioWaveform";
import WavesAnimation from "@/components/WavesAnimation";
import SlideToTalk from "@/components/SlideToTalk";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import CampusMap from "@/components/CampusMap";
import VoiceAssistant from "@/components/VoiceAssistant";
import LanguageSelector from "@/components/LanguageSelector";
import TopicSuggestions from "@/components/TopicSuggestions";
import TopicLoadingSkeleton from "@/components/TopicLoadingSkeleton";
import MemorySuggestions from "@/components/MemorySuggestions";
import UpcomingClassBanner from "@/components/UpcomingClassBanner";
import { useLiveKitVoice } from "@/hooks/useLiveKitVoice";
import { useWebSpeechRecognition, SUPPORTED_LANGUAGES } from "@/hooks/useWebSpeechRecognition";
import { useLanguagePreference } from "@/hooks/useLanguagePreference";
import { useGraphMemory } from "@/hooks/useGraphMemory";
import { useTimetable } from "@/hooks/useTimetable";
import { useToast } from "@/hooks/use-toast";
import { checkActionRateLimit } from "@/lib/security";

import { getTopicConfig, TopicId } from "@/lib/topicContext";
import { supabase } from "@/integrations/supabase/client";
import { speakMultilingual, stopSpeaking, onSpeakingChange, isSpeaking as getIsSpeaking } from "@/lib/speakMultilingual";
import { resolveLocationToNodeId } from "@/lib/fuzzySearch";
import { findShortestPath } from "@/lib/campusGraph";
import { generateNavigationSteps } from "@/lib/routeInstructions";

const ChatInterface = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [mapPermissionGranted, setMapPermissionGranted] = useState(false);
  const [showCampusMap, setShowCampusMap] = useState(false);
  const [message, setMessage] = useState("");
  const [isTextMode, setIsTextMode] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<TopicId | null>(null);
  const [topicContextLoaded, setTopicContextLoaded] = useState(false);
  const [isTopicLoading, setIsTopicLoading] = useState(false);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const [chatNavRoute, setChatNavRoute] = useState<{ from: string; to: string; steps: string[] } | null>(null);
  const [mapHighlighted, setMapHighlighted] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const mapHighlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { status, sendTextMessage } = useLiveKitVoice();
  const { recentPlaces, frequentPlaces, suggestions, recordSearch, recordNavigation, getAIContext, refresh: refreshMemory } = useGraphMemory();
  const { getAIContext: getTimetableContext, upcoming: upcomingClasses } = useTimetable();

  // Track speaking state from speakMultilingual
  useEffect(() => {
    const unsub = onSpeakingChange(setIsSpeakingNow);
    return unsub;
  }, []);

  // Persistent language preference
  const { language: savedLanguage, setLanguage: setSavedLanguage, isLoaded: isLanguageLoaded } = useLanguagePreference();

  // Web Speech Recognition for voice input only
  const {
    isListening: isSpeechListening,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported: isSpeechSupported,
    selectedLanguage,
    setSelectedLanguage,
    startListening,
    stopListening,
    resetTranscript,
  } = useWebSpeechRecognition(savedLanguage, setSavedLanguage);

  // Handle topic from URL params
  useEffect(() => {
    const topic = searchParams.get('topic') as TopicId | null;
    if (topic && !topicContextLoaded) {
      setCurrentTopic(topic);
      setIsTextMode(true);
      handleTopicInit(topic);
    }
  }, [searchParams, topicContextLoaded]);

  // Initialize topic conversation with scraped data
  const handleTopicInit = async (topic: TopicId) => {
    const topicConfig = getTopicConfig(topic);
    setTopicContextLoaded(true);
    setIsTopicLoading(true);
    setIsLoading(true);

    try {
      const { data: scraperData, error: scraperError } = await supabase.functions.invoke('mits-scraper', {
        body: { topic },
      });

      let contextInfo = '';
      if (!scraperError && scraperData?.content) {
        contextInfo = scraperData.content;
      }

      const { data, error } = await supabase.functions.invoke('campus-ai', {
        body: { 
          message: topicConfig.initialPrompt, 
          type: 'text',
          topicContext: contextInfo || undefined,
          userLanguage: selectedLanguage,
        },
      });

      if (error) throw error;
      const response = data.response;

      setChatMessages([
        { role: 'user', content: topicConfig.initialPrompt },
        { role: 'assistant', content: response },
      ]);

      if (voiceOutputEnabled) {
        speakMultilingual(response, selectedLanguage);
      }
    } catch (error) {
      console.error('Topic init error:', error);
      toast({
        title: 'Error',
        description: 'Could not load topic information. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsTopicLoading(false);
    }
  };

  const handleSuggestionClick = (question: string) => {
    setMessage(question);
  };

  // Sync transcript to message input
  useEffect(() => {
    if (transcript) {
      setMessage(transcript);
    }
  }, [transcript]);

  // Show speech errors
  useEffect(() => {
    if (speechError) {
      toast({
        title: 'Voice Input Error',
        description: speechError,
        variant: 'destructive',
      });
    }
  }, [speechError, toast]);

  // Auto-send handler for voice input
  const handleAutoSend = useCallback(async (finalTranscript: string) => {
    if (!finalTranscript.trim() || isLoading) return;

    if (!checkActionRateLimit('VOICE_START')) {
      toast({ title: 'Slow down', description: 'Please wait before starting a new voice session.' });
      return;
    }

    const userMessage = finalTranscript.trim();
    setMessage("");
    resetTranscript();
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);


    try {
      const response = await sendTextMessage(userMessage);
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
      
      if (voiceOutputEnabled) {
        speakMultilingual(response, selectedLanguage);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, sendTextMessage, voiceOutputEnabled, toast, resetTranscript]);

  const handleVoiceInputToggle = () => {
    if (isSpeechListening) {
      stopListening();
    } else {
      resetTranscript();
      setMessage("");
      startListening(handleAutoSend);
    }
  };

  const handleMapClick = () => {
    if (mapPermissionGranted) {
      setShowCampusMap(true);
    } else {
      setShowMapDialog(true);
    }
  };

  const handleMapPermission = () => {
    setMapPermissionGranted(true);
    setShowMapDialog(false);
    setShowCampusMap(true);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Only images are allowed.',
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: 'Image uploaded',
        description: `${file.name} uploaded successfully.`,
      });
    }
  };

  /** Detect navigation intent and extract destination */
  const detectNavigationIntent = (msg: string): { from: string; to: string } | null => {
    const lower = msg.toLowerCase();
    const navPatterns = [
      /how (?:do i |to |can i )(?:get to|reach|go to|find|navigate to|walk to)\s+(?:the\s+)?(.+)/i,
      /(?:take me|navigate|direct me|show (?:me )?(?:the )?(?:way|route|path|directions?)) (?:to\s+)?(?:the\s+)?(.+)/i,
      /(?:where is|where's|locate)\s+(?:the\s+)?(.+)/i,
      /(?:directions?|route|way|path)\s+(?:to|for)\s+(?:the\s+)?(.+)/i,
      /(?:i want to go to|i need to reach|bring me to)\s+(?:the\s+)?(.+)/i,
      // "from X to Y" pattern
      /from\s+(?:the\s+)?(.+?)\s+to\s+(?:the\s+)?(.+)/i,
    ];

    // Check "from X to Y"
    const fromToMatch = lower.match(/from\s+(?:the\s+)?(.+?)\s+to\s+(?:the\s+)?(.+)/i);
    if (fromToMatch) {
      return { from: fromToMatch[1].trim(), to: fromToMatch[2].trim() };
    }

    for (const pattern of navPatterns) {
      const match = msg.match(pattern);
      if (match) {
        const destination = match[1]?.replace(/[?.!,]+$/, '').trim();
        if (destination && resolveLocationToNodeId(destination)) {
          return { from: 'Main Gate', to: destination };
        }
      }
    }

    // Check for simple location mentions with navigation keywords
    const navKeywords = ['reach', 'go', 'find', 'way', 'route', 'direction', 'navigate', 'walk', 'where', 'locate', 'how to get'];
    const hasNavKeyword = navKeywords.some(k => lower.includes(k));
    if (hasNavKeyword) {
      // Try to find a campus location in the message
      const words = msg.replace(/[?.!,]+/g, '').split(/\s+/);
      for (let len = words.length; len >= 1; len--) {
        for (let i = 0; i <= words.length - len; i++) {
          const phrase = words.slice(i, i + len).join(' ');
          const nodeId = resolveLocationToNodeId(phrase);
          if (nodeId) {
            return { from: 'Main Gate', to: phrase };
          }
        }
      }
    }

    return null;
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    if (!checkActionRateLimit('CHAT_MESSAGE')) {
      toast({ title: 'Slow down', description: 'Too many messages. Wait a moment.' });
      return;
    }

    if (isSpeakingNow) {
      stopSpeaking();
    }

    const userMessage = message.trim();
    setMessage("");
    resetTranscript();
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);


    // Record search in graph memory
    recordSearch(userMessage);

    // Check for navigation intent
    const navIntent = detectNavigationIntent(userMessage);
    if (navIntent) {
      const fromId = resolveLocationToNodeId(navIntent.from);
      const toId = resolveLocationToNodeId(navIntent.to);

      if (fromId && toId) {
        const route = findShortestPath(fromId, toId);
        if (route) {
          const steps = generateNavigationSteps(route, selectedLanguage);
          const stepTexts = steps.map(s => s.instruction);
          const totalDist = route.totalDistance;

          setChatNavRoute({ from: navIntent.from, to: navIntent.to, steps: stepTexts });
          recordNavigation(navIntent.to);

          const responseText = `🧭 Here's your route from **${navIntent.from}** to **${navIntent.to}** (${totalDist}m):\n\n${stepTexts.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nTap "Open Map" below to see the route visually!`;

          setChatMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
          setIsLoading(false);

          if (voiceOutputEnabled) {
            speakMultilingual(stepTexts.join('. '), selectedLanguage);
          }
          return;
        }
      }
    }

    try {
      // Send with memory + timetable context for personalized responses
      const memCtx = getAIContext();
      const ttCtx = getTimetableContext();
      const combinedContext = [memCtx, ttCtx].filter(Boolean).join('\n\n');
      const { data, error } = await supabase.functions.invoke('campus-ai', {
        body: { message: userMessage, type: 'text', memoryContext: combinedContext || undefined, userLanguage: selectedLanguage },
      });
      if (error) throw error;
      const response = data.response;
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
      refreshMemory();
      
      if (voiceOutputEnabled) {
        speakMultilingual(response, selectedLanguage);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceOutput = () => {
    if (isSpeakingNow) {
      stopSpeaking();
    }
    setVoiceOutputEnabled(!voiceOutputEnabled);
  };

  const getStatusText = () => {
    if (isSpeakingNow) return "Speaking...";
    if (isTextMode) return "Type your message below";
    if (isSpeechListening) return `Listening in ${SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}... (auto-sends after pause)`;
    switch (status) {
      case 'connecting':
        return "Connecting...";
      case 'connected':
        return "Listening... Speak now";
      case 'error':
        return "Connection failed. Tap to retry";
      default:
        return "Tap to start talking";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-muted/30 flex flex-col relative overflow-hidden">
      <SEOHead title="Chat – Talk2Campus AI Assistant" description="Chat with the AI campus assistant at MITS. Get directions, answers, and campus info instantly." path="/chat" />
      <WavesAnimation 
        isActive={isSpeechListening || isSpeakingNow} 
        intensity={isSpeakingNow ? 0.8 : 0.5} 
      />
      
      {/* Background Glow Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-40 right-1/4 w-80 h-80 bg-primary-light/15 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-glow/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 flex items-center">
        <button 
          onClick={() => navigate("/")}
          className="glass rounded-full p-3 hover:bg-primary/10 transition-all duration-300 group"
        >
          <ArrowLeft className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="font-display text-xl font-semibold text-foreground">Talk2Campus</h1>
          <p className="text-xs text-muted-foreground">AI Campus Assistant</p>
        </div>
        <div className="w-11" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-2 sm:px-4 py-4 relative z-10 min-h-0 overflow-hidden">
        {isTextMode ? (
          <div className="w-full max-w-4xl flex flex-col flex-1 min-h-0 px-2 sm:px-4 space-y-2">
            {/* Upcoming class banner */}
            <UpcomingClassBanner />
            
            <div className="flex-1 min-h-0 relative rounded-3xl overflow-hidden bg-gradient-to-b from-background/80 via-background/60 to-transparent backdrop-blur-xl border border-glass-border/30 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary-light/5 pointer-events-none" />
              
              <div className="absolute inset-0 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                {isTopicLoading && currentTopic ? (
                  <TopicLoadingSkeleton topic={currentTopic} />
                ) : chatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary-light/20 flex items-center justify-center mb-4 animate-pulse">
                      <MessageSquare className="w-10 h-10 text-primary/60" />
                    </div>
                    <p className="text-muted-foreground text-lg font-medium">Start a conversation...</p>
                    <p className="text-muted-foreground/60 text-sm mt-2 max-w-sm">Ask me anything about MITS campus, admissions, courses, or navigation</p>
                  </div>
                ) : (
                  <>
                    {chatMessages.map((msg, i) => (
                      <div 
                        key={i} 
                        className={`animate-fade-in ${msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
                      >
                        <div 
                          className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl shadow-lg transition-all duration-300 ${
                            msg.role === 'user' 
                              ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-br-md' 
                              : 'bg-gradient-to-br from-muted/90 to-muted/70 backdrop-blur-sm border border-glass-border/20 rounded-bl-md'
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-line">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {/* Inline Open Map button when navigation route is active */}
                    {chatNavRoute && (
                      <div className="flex justify-start animate-fade-in">
                        <button
                          onClick={() => {
                            setMapPermissionGranted(true);
                            setShowCampusMap(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all"
                        >
                          <Navigation className="w-4 h-4" />
                          <span className="text-sm font-medium">Open Map — {chatNavRoute.from} → {chatNavRoute.to}</span>
                        </button>
                      </div>
                    )}
                    {isLoading && !isTopicLoading && (
                      <div className="flex justify-start animate-fade-in">
                        <div className="bg-gradient-to-br from-muted/90 to-muted/70 backdrop-blur-sm border border-glass-border/20 p-4 rounded-2xl rounded-bl-md shadow-lg">
                          <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" />
                            <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                            <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div className="mt-3 space-y-3">
              <MemorySuggestions
                recentPlaces={recentPlaces}
                frequentPlaces={frequentPlaces}
                suggestions={suggestions}
                onSuggestionClick={handleSuggestionClick}
                isVisible={chatMessages.length === 0 && !isLoading}
              />
              <TopicSuggestions
                currentTopic={currentTopic}
                onSuggestionClick={handleSuggestionClick}
                isVisible={chatMessages.length > 0 && !isLoading}
              />
            </div>
          </div>
        ) : (
          <VoiceAssistant />
        )}

        {!isTextMode && (
          <p className="mt-8 text-muted-foreground text-center">
            {getStatusText()}
          </p>
        )}

        {showCampusMap && (
          <CampusMap 
            onClose={() => {
              setShowCampusMap(false);
              setIsNavigating(false);
              setMapHighlighted(false);
              setChatCollapsed(false);
            }}
            language={selectedLanguage}
            onNavigationStateChange={setIsNavigating}
            onMapInteract={() => {
              setMapHighlighted(true);
              setChatCollapsed(true);
              if (mapHighlightTimer.current) clearTimeout(mapHighlightTimer.current);
              mapHighlightTimer.current = setTimeout(() => setMapHighlighted(false), 5000);
            }}
          />
        )}
      </main>

      {/* Bottom Message Bar */}
      <footer className={`relative z-10 p-4 transition-all duration-300 ${
        isNavigating ? 'pb-4 opacity-70' : 'pb-8'
      }`}>
        <div className="max-w-2xl mx-auto">
          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-4">
            <button 
              onClick={() => { setIsTextMode(!isTextMode); setMapHighlighted(false); setChatCollapsed(false); }}
              className={`action-button transition-all duration-300 ${
                isTextMode ? "bg-primary text-primary-foreground glow-primary" : "glass hover:bg-primary/10"
              } ${mapHighlighted ? "opacity-60 scale-95" : ""}`}
            >
              <MessageSquare className="w-6 h-6" />
              <span className="text-xs mt-1 font-medium">Text</span>
            </button>

            <button 
              onClick={() => { handleMapClick(); setMapHighlighted(false); setChatCollapsed(false); }}
              className={`action-button glass hover:bg-primary/10 transition-all duration-300 ${
                mapHighlighted
                  ? "scale-[1.07] bg-primary/10 ring-1 ring-primary/30 shadow-[0_6px_16px_hsl(var(--primary)/0.15)]"
                  : ""
              }`}
            >
              <Map className={`w-6 h-6 transition-colors duration-300 ${mapHighlighted ? "text-primary" : ""}`} />
              <span className={`text-xs mt-1 font-medium transition-colors duration-300 ${mapHighlighted ? "text-primary" : ""}`}>Maps</span>
            </button>

            <button 
              onClick={() => { handleFileUpload(); setMapHighlighted(false); setChatCollapsed(false); }}
              className={`action-button glass hover:bg-primary/10 transition-all duration-300 ${
                mapHighlighted ? "opacity-60 scale-95" : ""
              }`}
            >
              <Plus className="w-6 h-6" />
              <span className="text-xs mt-1 font-medium">Upload</span>
            </button>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="hidden"
            />

            <div className={`action-button glass hover:bg-primary/10 p-0 overflow-visible transition-all duration-300 ${
              mapHighlighted ? "opacity-60 scale-95" : ""
            }`}>
              <LanguageSelector 
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
                compact
              />
            </div>

            <button 
              onClick={toggleVoiceOutput}
              className={`action-button transition-all duration-300 ${
                voiceOutputEnabled ? "bg-primary text-primary-foreground glow-primary" : "glass hover:bg-primary/10"
              } ${mapHighlighted ? "opacity-60 scale-95" : ""}`}
              title={voiceOutputEnabled ? "Voice output enabled" : "Voice output disabled"}
            >
              {voiceOutputEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              <span className="text-xs mt-1 font-medium">Voice</span>
            </button>
          </div>

          {/* Collapsible Chat Input */}
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            chatCollapsed ? "max-h-10 opacity-70" : "max-h-96 opacity-100"
          }`}>
            {chatCollapsed && (
              <button
                onClick={() => setChatCollapsed(false)}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Tap to expand chat</span>
              </button>
            )}
            <div className={`transition-all duration-300 ${chatCollapsed ? "opacity-0 pointer-events-none h-0" : "opacity-100"}`}>
              {/* Message Input Bar */}
              <div className="glass rounded-2xl px-3 py-2 flex flex-col gap-2">
                {/* Text input row */}
                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    value={interimTranscript ? `${message} ${interimTranscript}` : message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={isSpeechListening ? "Listening..." : "Type your message..."}
                    className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm px-2"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={isLoading || !message.trim()}
                    className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-button disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Slide-to-talk voice slider */}
                {isSpeechSupported && (
                  <SlideToTalk
                    onActivate={() => {
                      resetTranscript();
                      setMessage("");
                      startListening(handleAutoSend);
                    }}
                    onDeactivate={stopListening}
                    isListening={isSpeechListening}
                    isSpeaking={isSpeakingNow}
                    disabled={isLoading}
                  />
                )}
              </div>
              
              {/* Status indicator with waveform */}
              {(isSpeechListening || isSpeakingNow) && (
                <div className="flex flex-col items-center mt-2 gap-1">
                  {isSpeakingNow && (
                    <AudioWaveform isActive={isSpeakingNow} barCount={7} className="h-6" />
                  )}
                  <p className="text-center text-sm text-primary animate-pulse">
                    {isSpeakingNow 
                      ? `Speaking in ${SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.name}...` 
                      : `Listening in ${SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage)?.nativeName}... (auto-sends after pause)`
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* Map Permission Dialog */}
      <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
        <DialogContent className="glass border-glass-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-center">Campus Maps</DialogTitle>
            <DialogDescription className="text-center">
              Allow Talk2Campus to access campus maps for navigation assistance?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button 
              variant="outline" 
              className="flex-1 rounded-full"
              onClick={() => setShowMapDialog(false)}
            >
              Deny
            </Button>
            <Button 
              className="flex-1 rounded-full bg-primary hover:bg-primary/90"
              onClick={handleMapPermission}
            >
              Allow
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatInterface;
