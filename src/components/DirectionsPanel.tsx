import { useState, useEffect, useCallback } from 'react';
import { Navigation, Volume2, VolumeX, ChevronUp, ChevronDown, MapPin, X, Locate, LocateOff, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigationVoice } from '@/hooks/useNavigationVoice';
import { useGeolocation, calculateDistance } from '@/hooks/useGeolocation';
import { SupportedLanguage } from '@/lib/language';
import { CAMPUS_GPS_BOUNDS } from '@/data/campusData';
import { NavigationStep } from '@/lib/routeInstructions';

interface DirectionsPanelProps {
  directions: string[];
  navigationSteps?: NavigationStep[];
  isVisible: boolean;
  onClose: () => void;
  from: string;
  to: string;
  language?: SupportedLanguage;
  isMinimized?: boolean;
  onMinimizeToggle?: () => void;
  onUserPositionUpdate?: (gridPosition: { x: number; y: number } | null) => void;
}

const WAYPOINT_PROXIMITY_METERS = 20; // Distance in meters to trigger waypoint arrival

const DirectionsPanel = ({
  directions,
  navigationSteps,
  isVisible,
  onClose,
  from,
  to,
  language = 'en-IN',
  isMinimized = false,
  onMinimizeToggle,
  onUserPositionUpdate,
}: DirectionsPanelProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  
  const { speakDirection, speakProgress, stopNavigation } = useNavigationVoice();
  const { 
    position, 
    error: gpsError, 
    isLoading: gpsLoading, 
    isWatching,
    startWatching, 
    stopWatching 
  } = useGeolocation({ watchPosition: gpsEnabled });

  // Convert GPS position to grid position for map display
  useEffect(() => {
    if (position && onUserPositionUpdate) {
      const x = ((position.longitude - CAMPUS_GPS_BOUNDS.minLon) / (CAMPUS_GPS_BOUNDS.maxLon - CAMPUS_GPS_BOUNDS.minLon)) * 100;
      const y = ((CAMPUS_GPS_BOUNDS.maxLat - position.latitude) / (CAMPUS_GPS_BOUNDS.maxLat - CAMPUS_GPS_BOUNDS.minLat)) * 100;
      
      // Only update if within campus bounds (with some margin)
      if (x >= -10 && x <= 110 && y >= -10 && y <= 110) {
        onUserPositionUpdate({ 
          x: Math.max(0, Math.min(100, x)), 
          y: Math.max(0, Math.min(100, y)) 
        });
      }
    } else if (!position && onUserPositionUpdate) {
      onUserPositionUpdate(null);
    }
  }, [position, onUserPositionUpdate]);

  // Auto-advance based on GPS proximity to waypoints
  useEffect(() => {
    if (!position || !navigationSteps || !autoAdvanceEnabled || !gpsEnabled) return;

    const currentWaypoint = navigationSteps[currentStep]?.waypoint;
    if (!currentWaypoint?.gpsPosition) return;

    const distance = calculateDistance(
      position.latitude,
      position.longitude,
      currentWaypoint.gpsPosition.latitude,
      currentWaypoint.gpsPosition.longitude
    );

    // Check if we've reached the current waypoint
    if (distance <= WAYPOINT_PROXIMITY_METERS && !completedSteps.has(currentStep)) {
      // Mark current step as completed
      setCompletedSteps(prev => new Set(prev).add(currentStep));
      
      // Voice confirmation
      if (voiceEnabled) {
        if (currentStep === navigationSteps.length - 1) {
          speakProgress('arrived');
        } else {
          speakProgress('onTrack');
        }
      }

      // Auto-advance to next step after a short delay
      if (currentStep < navigationSteps.length - 1) {
        setTimeout(() => {
          const nextStep = currentStep + 1;
          setCurrentStep(nextStep);
          
          if (voiceEnabled && navigationSteps[nextStep]) {
            setTimeout(() => {
              speakDirection(navigationSteps[nextStep].instruction, { language });
            }, 1000);
          }
        }, 1500);
      }
    }
  }, [position, navigationSteps, currentStep, autoAdvanceEnabled, gpsEnabled, completedSteps, voiceEnabled, speakDirection, speakProgress, language]);

  // Initial voice announcement
  useEffect(() => {
    if (voiceEnabled && directions.length > 0 && isVisible && !isMinimized) {
      speakProgress('startNav');
      
      const timer = setTimeout(() => {
        if (directions[0]) {
          speakDirection(directions[0], { language });
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isVisible]); // Only on visibility change

  // Handle GPS toggle
  const toggleGPS = useCallback(() => {
    if (gpsEnabled) {
      stopWatching();
      setGpsEnabled(false);
      onUserPositionUpdate?.(null);
    } else {
      setGpsEnabled(true);
      startWatching();
    }
  }, [gpsEnabled, startWatching, stopWatching, onUserPositionUpdate]);

  const handleNextStep = () => {
    if (currentStep < directions.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setCompletedSteps(prev => new Set(prev).add(currentStep));
      
      if (voiceEnabled) {
        speakProgress('nextTurn');
        setTimeout(() => {
          speakDirection(directions[nextStep], { language });
        }, 1500);
      }
    } else if (currentStep === directions.length - 1) {
      if (voiceEnabled) {
        speakProgress('arrived');
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      
      if (voiceEnabled) {
        speakDirection(directions[prevStep], { language });
      }
    }
  };

  const toggleVoice = () => {
    if (voiceEnabled) {
      stopNavigation();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    if (voiceEnabled) {
      speakDirection(directions[index], { language });
    }
  };

  const handleClose = () => {
    stopNavigation();
    stopWatching();
    setGpsEnabled(false);
    onUserPositionUpdate?.(null);
    onClose();
  };

  // Calculate distance to current waypoint
  const getDistanceToCurrentWaypoint = (): string | null => {
    if (!position || !navigationSteps?.[currentStep]?.waypoint?.gpsPosition) return null;
    
    const waypoint = navigationSteps[currentStep].waypoint;
    if (!waypoint.gpsPosition) return null;
    
    const distance = calculateDistance(
      position.latitude,
      position.longitude,
      waypoint.gpsPosition.latitude,
      waypoint.gpsPosition.longitude
    );
    
    if (distance < 1000) {
      return `${Math.round(distance)}m away`;
    }
    return `${(distance / 1000).toFixed(1)}km away`;
  };

  if (!isVisible || directions.length === 0) return null;

  const distanceText = getDistanceToCurrentWaypoint();

  return (
    <div 
      className={`fixed left-0 right-0 z-40 transition-all duration-300 ease-out ${
        isMinimized 
          ? 'bottom-32 max-h-16' 
          : 'bottom-40 max-h-[50vh]'
      }`}
    >
      <div className="max-w-2xl mx-auto px-4">
        <div className="glass rounded-2xl border border-primary/20 shadow-lg overflow-hidden backdrop-blur-xl">
          {/* Header - Always visible */}
          <div className="flex items-center justify-between p-3 bg-primary/10 border-b border-primary/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Navigation className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {from} → {to}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Step {currentStep + 1} of {directions.length}</span>
                  {distanceText && gpsEnabled && (
                    <span className="text-primary font-medium">• {distanceText}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* GPS toggle */}
              <button
                onClick={toggleGPS}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  gpsEnabled 
                    ? isWatching 
                      ? 'bg-green-500 text-white animate-pulse' 
                      : 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
                title={gpsEnabled ? 'GPS tracking active' : 'Enable GPS tracking'}
              >
                {gpsEnabled ? <Locate className="w-4 h-4" /> : <LocateOff className="w-4 h-4" />}
              </button>

              {/* Voice toggle */}
              <button
                onClick={toggleVoice}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  voiceEnabled 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-muted/80'
                }`}
                title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Minimize toggle */}
              <button
                onClick={onMinimizeToggle}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {/* Close */}
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-muted hover:bg-destructive/20 hover:text-destructive flex items-center justify-center transition-colors"
                title="Close directions"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* GPS Status Bar */}
          {gpsEnabled && !isMinimized && (
            <div className={`px-4 py-2 text-xs flex items-center gap-2 ${
              gpsError ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600'
            }`}>
              {gpsLoading ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  <span>Acquiring GPS signal...</span>
                </>
              ) : gpsError ? (
                <>
                  <LocateOff className="w-3 h-3" />
                  <span>{gpsError}</span>
                </>
              ) : position ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>GPS active • Accuracy: ±{Math.round(position.accuracy)}m</span>
                  {autoAdvanceEnabled && (
                    <span className="ml-auto text-primary">Auto-advance ON</span>
                  )}
                </>
              ) : null}
            </div>
          )}

          {/* Current Step - Highlighted */}
          {!isMinimized && (
            <>
              <div className="p-4 bg-primary/5">
                <div className="flex gap-3 items-start">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    completedSteps.has(currentStep) 
                      ? 'bg-green-500 text-white' 
                      : 'bg-primary text-primary-foreground'
                  }`}>
                    {completedSteps.has(currentStep) ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      currentStep + 1
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium leading-relaxed">
                      {directions[currentStep]}
                    </p>
                    {distanceText && gpsEnabled && (
                      <p className="text-sm text-primary mt-1">{distanceText}</p>
                    )}
                  </div>
                </div>

                {/* Step navigation */}
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevStep}
                    disabled={currentStep === 0}
                    className="flex-1 rounded-full"
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleNextStep}
                    disabled={currentStep === directions.length - 1}
                    className="flex-1 rounded-full"
                  >
                    {currentStep === directions.length - 1 ? 'Arrived!' : 'Next Step'}
                  </Button>
                </div>
              </div>

              {/* All Steps - Scrollable */}
              <ScrollArea className="max-h-32">
                <div className="p-3 space-y-1">
                  {directions.map((step, index) => (
                    <button
                      key={index}
                      onClick={() => handleStepClick(index)}
                      className={`w-full flex gap-2 items-start p-2 rounded-lg text-left transition-colors ${
                        index === currentStep
                          ? 'bg-primary/10 text-primary'
                          : completedSteps.has(index)
                            ? 'text-green-600 bg-green-500/5'
                            : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                        index === currentStep
                          ? 'bg-primary text-primary-foreground'
                          : completedSteps.has(index)
                            ? 'bg-green-500 text-white'
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {completedSteps.has(index) ? '✓' : index + 1}
                      </div>
                      <span className="text-sm">{step}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          {/* Minimized view - just current step preview */}
          {isMinimized && (
            <div className="px-4 py-2 flex items-center gap-2">
              {gpsEnabled && <Locate className="w-4 h-4 text-green-500 animate-pulse flex-shrink-0" />}
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-sm truncate flex-1">{directions[currentStep]}</p>
              {distanceText && <span className="text-xs text-primary">{distanceText}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectionsPanel;
