import { useState, useCallback, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, LocateFixed } from 'lucide-react';
import { X, MapPin, Building2, ChevronRight, ChevronDown, Search, Navigation, Layers, User, DoorOpen, ShieldCheck, Car, Trees, Utensils, GraduationCap, Theater, Landmark, Factory, CircleDot, Briefcase, BookOpen, Clock, Info, MapPinned } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { campusBuildings, buildingColors, roomTypeColors, searchCampus, Building, Floor } from '@/data/campusData';
import { CAMPUS_NODES, CAMPUS_EDGES, findShortestPath } from '@/lib/campusGraph';
import { generateNavigationSteps, NavigationStep } from '@/lib/routeInstructions';
import { resolveLocationToNodeId, searchCampusGraph } from '@/lib/fuzzySearch';
import DirectionsPanel from './DirectionsPanel';
import IndoorMap, { IndoorBuildingId } from './IndoorMap';
import { SupportedLanguage } from '@/lib/language';

interface CampusMapProps {
  onClose: () => void;
  language?: SupportedLanguage;
  onNavigationStateChange?: (isNavigating: boolean) => void;
  onMapInteract?: () => void;
}

const CampusMap = ({ onClose, language = 'en-IN', onNavigationStateChange, onMapInteract }: CampusMapProps) => {
  const [showIndoorMap, setShowIndoorMap] = useState(false);
  const [indoorBuildingId, setIndoorBuildingId] = useState<IndoorBuildingId>('kk-block');
  const [mapBrightness, setMapBrightness] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
  const [navigationFrom, setNavigationFrom] = useState('');
  const [navigationTo, setNavigationTo] = useState('');
  const [directions, setDirections] = useState<string[]>([]);
  const [navigationSteps, setNavigationSteps] = useState<NavigationStep[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'navigate'>('map');
  const [isDirectionsPanelMinimized, setIsDirectionsPanelMinimized] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [userPosition, setUserPosition] = useState<{ x: number; y: number } | null>(null);

  // Zoom & Pan state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef(0);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const clampScale = (s: number) => Math.min(Math.max(s, 0.5), 4);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => clampScale(prev * delta));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    isPanning.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    setTranslate(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  // Pinch-to-zoom via touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.hypot(dx, dy);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (lastPinchDist.current > 0) {
        const ratio = dist / lastPinchDist.current;
        setScale(prev => clampScale(prev * ratio));
      }
      lastPinchDist.current = dist;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    lastPinchDist.current = 0;
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const searchResults = searchQuery ? searchCampus(searchQuery) : null;
  const displayBuildings = searchResults?.buildings || campusBuildings;

  const toggleBuildingExpand = (buildingId: string) => {
    setExpandedBuildings(prev => {
      const next = new Set(prev);
      if (next.has(buildingId)) {
        next.delete(buildingId);
      } else {
        next.add(buildingId);
      }
      return next;
    });
  };

  const handleNavigate = useCallback(() => {
    if (navigationFrom && navigationTo) {
      const fromId = resolveLocationToNodeId(navigationFrom);
      const toId = resolveLocationToNodeId(navigationTo);
      
      if (!fromId || !toId) {
        setDirections(['Location not found. Try "Main Gate", "NPN Block", "Auditorium", etc.']);
        setNavigationSteps([]);
        return;
      }
      
      const route = findShortestPath(fromId, toId);
      if (!route) {
        setDirections(['No route found between these locations.']);
        setNavigationSteps([]);
        return;
      }
      
      const steps = generateNavigationSteps(route, language);
      setNavigationSteps(steps);
      setDirections(steps.map(s => s.instruction));
      setIsNavigating(true);
      onNavigationStateChange?.(true);
    }
  }, [navigationFrom, navigationTo, language, onNavigationStateChange]);

  const handleUserPositionUpdate = useCallback((pos: { x: number; y: number } | null) => {
    setUserPosition(pos);
  }, []);

  const handleCloseDirections = useCallback(() => {
    setDirections([]);
    setIsNavigating(false);
    onNavigationStateChange?.(false);
  }, [onNavigationStateChange]);

  const handleBuildingClick = (building: Building) => {
    if (selectedBuilding?.id === building.id) {
      setSelectedBuilding(null);
      setSelectedFloor(null);
    } else {
      setSelectedBuilding(building);
      setSelectedFloor(building.floors[0] || null);
    }
  };

  const mainContentPaddingBottom = isNavigating && !isDirectionsPanelMinimized ? 'pb-72' : isNavigating ? 'pb-24' : 'pb-0';

  // Visible nodes on the map (exclude invisible intersection/junction helpers)
  const visibleNodes = CAMPUS_NODES.filter(n => n.type !== 'intersection' && n.type !== 'junction');

  if (showIndoorMap) {
    return <IndoorMap onClose={() => setShowIndoorMap(false)} language={language} buildingId={indoorBuildingId} />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border/50">
        <h2 className="font-display text-xl font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          MITS Campus Map
        </h2>
        <div className="flex items-center gap-2">
          <div className="glass rounded-full p-1 flex gap-1">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${viewMode === 'map' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <Building2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('navigate')}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${viewMode === 'navigate' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <Navigation className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-destructive/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="p-4 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search buildings, rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-full bg-muted/50"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex overflow-hidden transition-all duration-300 ${mainContentPaddingBottom}`}>
        {/* Campus Visual Map */}
        {viewMode === 'map' && (
          <div className="flex-1 flex flex-col lg:flex-row">
            {/* Interactive Campus Map — free-form with zoom & pan */}
            <div
              ref={mapContainerRef}
              className={`flex-1 p-2 relative overflow-hidden touch-none cursor-grab active:cursor-grabbing transition-[filter] duration-300 ${mapBrightness ? 'brightness-[1.03]' : ''}`}
              onWheel={handleWheel}
              onClick={() => { onMapInteract?.(); setMapBrightness(true); setTimeout(() => setMapBrightness(false), 3000); }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Zoom controls */}
              <div className="absolute top-4 right-4 z-30 flex flex-col gap-1">
                <button onClick={() => setScale(prev => clampScale(prev * 1.3))} className="w-9 h-9 rounded-lg bg-background/90 border border-border flex items-center justify-center hover:bg-muted transition-colors shadow-sm">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button onClick={() => setScale(prev => clampScale(prev * 0.7))} className="w-9 h-9 rounded-lg bg-background/90 border border-border flex items-center justify-center hover:bg-muted transition-colors shadow-sm">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button onClick={resetView} className="w-9 h-9 rounded-lg bg-background/90 border border-border flex items-center justify-center hover:bg-muted transition-colors shadow-sm">
                  <LocateFixed className="w-4 h-4" />
                </button>
              </div>

              <div
                className="relative w-full h-full min-h-[500px] bg-gradient-to-br from-green-900/20 to-green-800/10 rounded-2xl border border-border/30 overflow-hidden"
                style={{
                  transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                  transformOrigin: 'center center',
                  transition: isPanning.current ? 'none' : 'transform 0.15s ease-out',
                }}
              >

                {/* Roads as SVG */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {CAMPUS_EDGES.map((e, i) => {
                    const from = CAMPUS_NODES.find(n => n.id === e.from);
                    const to = CAMPUS_NODES.find(n => n.id === e.to);
                    if (!from || !to) return null;

                    const strokeColor =
                      e.pathType === 'road' ? 'hsl(var(--muted-foreground) / 0.35)' :
                      e.pathType === 'walkway' ? 'hsl(142 71% 45% / 0.4)' :
                      e.pathType === 'stairs' ? 'hsl(38 92% 50% / 0.5)' :
                      e.pathType === 'corridor' ? 'hsl(258 90% 66% / 0.4)' :
                      'hsl(var(--muted-foreground) / 0.25)';
                    const strokeW = e.pathType === 'road' ? '1' : '0.7';
                    const dash = e.pathType === 'road' ? '3 1' : e.pathType === 'walkway' ? '1.5 1' : e.pathType === 'stairs' ? '0.8 0.8' : '2 1';

                    const mx = (from.position.x + to.position.x) / 2;
                    const my = (from.position.y + to.position.y) / 2;

                    // Icon paths for each type
                    const iconPath =
                      e.pathType === 'road'
                        ? <path d={`M${mx - 1} ${my - 0.6} L${mx + 1} ${my - 0.6} M${mx - 1} ${my + 0.6} L${mx + 1} ${my + 0.6} M${mx - 0.3} ${my - 0.6} L${mx - 0.3} ${my + 0.6} M${mx + 0.3} ${my - 0.6} L${mx + 0.3} ${my + 0.6}`} stroke={strokeColor} strokeWidth="0.15" fill="none" />
                        : e.pathType === 'walkway'
                        ? <circle cx={mx} cy={my} r="0.5" fill="hsl(142 71% 45% / 0.5)" stroke="white" strokeWidth="0.15" />
                        : e.pathType === 'stairs'
                        ? <path d={`M${mx - 0.6} ${my + 0.4} L${mx - 0.2} ${my + 0.4} L${mx - 0.2} ${my} L${mx + 0.2} ${my} L${mx + 0.2} ${my - 0.4} L${mx + 0.6} ${my - 0.4}`} stroke="hsl(38 92% 50% / 0.7)" strokeWidth="0.2" fill="none" />
                        : null;

                    return (
                      <g key={i}>
                        <line
                          x1={from.position.x} y1={from.position.y}
                          x2={to.position.x}   y2={to.position.y}
                          stroke={strokeColor}
                          strokeWidth={strokeW}
                          strokeDasharray={dash}
                        />
                        {iconPath}
                      </g>
                    );
                  })}
                </svg>

                {/* SVG Route Path Overlay */}
                {isNavigating && navigationSteps.length > 1 && (
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    <polyline
                      points={navigationSteps
                        .map(s => `${s.waypoint.gridPosition.x},${s.waypoint.gridPosition.y}`)
                        .join(' ')}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="3 1.5"
                      opacity="0.85"
                    />
                    {navigationSteps.map((s, i) => (
                      <circle
                        key={i}
                        cx={s.waypoint.gridPosition.x}
                        cy={s.waypoint.gridPosition.y}
                        r={s.isStart || s.isEnd ? 2 : 1}
                        fill={s.isStart ? '#3b82f6' : s.isEnd ? '#ef4444' : '#3b82f6'}
                        stroke="white"
                        strokeWidth="0.5"
                      />
                    ))}
                  </svg>
                )}

                {/* Building markers from graph nodes */}
                {visibleNodes.map((gn) => {
                  const building = campusBuildings.find(b => b.id === gn.buildingId);
                  const typeColor =
                    gn.type === 'entry' || gn.type === 'checkpoint' ? 'hsl(0 84% 60%)' :
                    gn.type === 'parking' ? 'hsl(142 71% 45%)' :
                    gn.type === 'ground' ? 'hsl(172 66% 50%)' :
                    gn.type === 'landmark' ? 'hsl(280 65% 55%)' :
                    gn.type === 'office' ? 'hsl(25 95% 53%)' :
                    gn.type === 'facility' ? 'hsl(142 71% 45%)' :
                    building ? (buildingColors[building.type] || 'hsl(217 91% 60%)') :
                    'hsl(217 91% 60%)';

                  const IconComponent =
                    gn.id === 'main-gate' ? DoorOpen :
                    gn.id === 'security-gate' ? ShieldCheck :
                    gn.id === 'parking-area' ? Car :
                    gn.id === 'ground' ? Trees :
                    gn.id === 'i-love-mits-park' ? Trees :
                    gn.id === 'ekadants-cafe' || gn.id === 'main-canteen' || gn.id === 'lickies' ? Utensils :
                    gn.id === 'auditorium' ? Theater :
                    gn.id === 'placement-cell' ? Briefcase :
                    gn.id === 'industrial-block' ? Factory :
                    gn.id === 'circular-block' ? CircleDot :
                    gn.id === 'central-library' ? BookOpen :
                    gn.id === 'saraswathi-block' ? Landmark :
                    GraduationCap;

                  const isSelected = selectedBuilding?.id === gn.buildingId;

                  return (
                    <div key={gn.id} className="absolute" style={{ left: `${gn.position.x}%`, top: `${gn.position.y}%`, zIndex: isSelected ? 30 : 1 }}>
                      <button
                        onClick={() => building ? handleBuildingClick(building) : null}
                        className={`transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 transition-all hover:scale-110 ${
                          isSelected ? 'scale-110' : ''
                        }`}
                        title={gn.name}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md border-2 ${isSelected ? 'border-primary ring-2 ring-primary/40' : 'border-white/80'}`}
                          style={{ backgroundColor: typeColor }}
                        >
                          <IconComponent className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-[7px] font-bold whitespace-nowrap leading-tight bg-background/80 px-1 rounded text-foreground shadow-sm">
                          {gn.shortName || gn.name}
                        </span>
                      </button>

                      {/* Building detail popup */}
                      {isSelected && building && (
                        <div className="absolute left-1/2 -translate-x-1/2 top-8 w-48 bg-background border border-border rounded-lg shadow-xl p-3 z-40 animate-in fade-in-0 zoom-in-95 duration-200">
                          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-background border-l border-t border-border rotate-45" />
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedBuilding(null); }}
                            className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <h4 className="font-semibold text-sm text-foreground pr-4">{building.name}</h4>
                          <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{building.description}</p>
                          {building.timings && (
                            <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                              <Clock className="w-3 h-3 text-primary" />
                              <span>{building.timings}</span>
                            </div>
                          )}
                          {building.landmarks && building.landmarks.length > 0 && (
                            <div className="flex items-start gap-1 mt-1.5 text-[10px] text-muted-foreground">
                              <MapPinned className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                              <span>{building.landmarks.join(' • ')}</span>
                            </div>
                          )}
                          <div className="mt-2 flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setNavigationTo(building.name);
                                setViewMode('navigate');
                                setSelectedBuilding(null);
                              }}
                              className="flex-1 flex items-center justify-center gap-1 bg-primary text-primary-foreground text-[10px] font-medium py-1.5 rounded-md hover:bg-primary/90 transition-colors"
                            >
                              <Navigation className="w-3 h-3" />
                              Navigate
                            </button>
                            {(building.id === 'kk-block' || building.id === 'main-block') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIndoorBuildingId(building.id as any);
                                  setShowIndoorMap(true);
                                  setSelectedBuilding(null);
                                }}
                                className="flex-1 flex items-center justify-center gap-1 bg-accent text-accent-foreground text-[10px] font-medium py-1.5 rounded-md hover:bg-accent/80 transition-colors"
                              >
                                <Building2 className="w-3 h-3" />
                                Explore
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* User Position Marker */}
                {userPosition && (
                  <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                    style={{
                      left: `${userPosition.x}%`,
                      top: `${userPosition.y}%`,
                    }}
                  >
                    <div className="absolute inset-0 w-8 h-8 -translate-x-1/2 -translate-y-1/2 bg-blue-500/20 rounded-full animate-ping" />
                    <div className="relative w-4 h-4 -translate-x-1/2 -translate-y-1/2">
                      <div className="absolute inset-0 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
                      <div className="absolute inset-1 bg-blue-400 rounded-full" />
                    </div>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[8px] px-1.5 py-0.5 rounded-full whitespace-nowrap font-medium shadow-sm">
                      You
                    </div>
                  </div>
                )}

                {/* Compass */}
                <div className="absolute bottom-2 right-2 w-10 h-10 bg-background/80 rounded-full flex items-center justify-center border border-border">
                  <span className="text-xs font-bold text-primary">N</span>
                </div>
              </div>
            </div>

            {/* Building Details Panel */}
            {selectedBuilding && (
              <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-border/50 bg-muted/20">
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: buildingColors[selectedBuilding.type] }}
                      >
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold">{selectedBuilding.name}</h3>
                        <p className="text-xs text-muted-foreground">{selectedBuilding.shortName}</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">{selectedBuilding.description}</p>
                    
                    {selectedBuilding.timings && (
                      <p className="text-sm mb-2">
                        <span className="font-medium">Hours:</span> {selectedBuilding.timings}
                      </p>
                    )}
                    
                    {selectedBuilding.landmarks && (
                      <p className="text-sm mb-4">
                        <span className="font-medium">Landmarks:</span> {selectedBuilding.landmarks.join(', ')}
                      </p>
                    )}

                    {selectedBuilding.floors.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Layers className="w-4 h-4" />
                          Floor Plan
                        </h4>
                        <div className="flex gap-1 flex-wrap">
                          {selectedBuilding.floors.map((floor) => (
                            <button
                              key={floor.level}
                              onClick={() => setSelectedFloor(floor)}
                              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                selectedFloor?.level === floor.level
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted hover:bg-muted/80'
                              }`}
                            >
                              {floor.name}
                            </button>
                          ))}
                        </div>

                        {selectedFloor && (
                          <div className="mt-3 space-y-1">
                            {selectedFloor.rooms.map((room) => (
                              <div
                                key={room.id}
                                className="glass rounded-lg px-3 py-2 flex items-center gap-2"
                              >
                                <div
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: roomTypeColors[room.type] }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{room.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {room.number && `#${room.number}`}
                                    {room.capacity && ` • ${room.capacity} capacity`}
                                    {room.department && ` • ${room.department}`}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {displayBuildings.map((building) => (
                <div key={building.id} className="glass rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleBuildingExpand(building.id)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: buildingColors[building.type] }}
                    >
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{building.name}</p>
                      <p className="text-xs text-muted-foreground">{building.description}</p>
                    </div>
                    {expandedBuildings.has(building.id) ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  
                  {expandedBuildings.has(building.id) && (
                    <div className="px-4 pb-3 space-y-2">
                      {building.timings && (
                        <p className="text-xs text-muted-foreground">🕒 {building.timings}</p>
                      )}
                      {building.floors.map((floor) => (
                        <div key={floor.level} className="bg-muted/30 rounded-lg p-2">
                          <p className="text-xs font-medium mb-1">{floor.name}</p>
                          <div className="flex flex-wrap gap-1">
                            {floor.rooms.slice(0, 5).map((room) => (
                              <span
                                key={room.id}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-background/50"
                              >
                                {room.name}
                              </span>
                            ))}
                            {floor.rooms.length > 5 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-background/50 text-muted-foreground">
                                +{floor.rooms.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {searchResults?.rooms && searchResults.rooms.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Rooms Found</h3>
                  {searchResults.rooms.map(({ building, floor, room }) => (
                    <div key={room.id} className="glass rounded-lg px-4 py-2 mb-1">
                      <p className="text-sm font-medium">{room.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {building.shortName} • {floor.name}
                        {room.department && ` • ${room.department}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Navigation View */}
        {viewMode === 'navigate' && (
          <div className="flex-1 p-4">
            <div className="max-w-md mx-auto space-y-4">
              <div className="glass rounded-xl p-4 space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-primary" />
                  Get Directions
                </h3>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground">From</label>
                    <Input
                      placeholder="e.g. Main Gate, NPN Block"
                      value={navigationFrom}
                      onChange={(e) => setNavigationFrom(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground">To</label>
                    <Input
                      placeholder="e.g. Placement Cell, Auditorium"
                      value={navigationTo}
                      onChange={(e) => setNavigationTo(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleNavigate}
                  className="w-full rounded-lg"
                  disabled={!navigationFrom || !navigationTo}
                >
                  Get Directions
                </Button>
              </div>

              {directions.length > 0 && (
                <div className="glass rounded-xl p-4 bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 text-primary">
                    <Navigation className="w-4 h-4" />
                    <p className="text-sm font-medium">Navigation active - see panel below</p>
                  </div>
                </div>
              )}

              {/* Quick Navigation */}
              <div className="glass rounded-xl p-4">
                <h4 className="font-medium mb-3">Popular Destinations</h4>
                <div className="flex flex-wrap gap-2">
                  {['Placement Cell', 'Auditorium', "Ekadant's Cafe", 'Main Canteen', 'Main Block', 'KK Block'].map((dest) => (
                    <button
                      key={dest}
                      onClick={() => setNavigationTo(dest)}
                      className="px-3 py-1 text-xs rounded-full bg-muted hover:bg-muted/80 transition-colors"
                    >
                      {dest}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Directions Panel */}
      <DirectionsPanel
        directions={directions}
        navigationSteps={navigationSteps}
        isVisible={isNavigating}
        onClose={handleCloseDirections}
        from={navigationFrom}
        to={navigationTo}
        language={language}
        isMinimized={isDirectionsPanelMinimized}
        onMinimizeToggle={() => setIsDirectionsPanelMinimized(!isDirectionsPanelMinimized)}
        onUserPositionUpdate={handleUserPositionUpdate}
      />

      {/* Legend */}
      <div className={`p-4 border-t border-border/50 transition-all duration-300 ${isNavigating && !isDirectionsPanelMinimized ? 'opacity-0 pointer-events-none' : ''}`}>
        <div className="flex flex-wrap justify-center gap-4 mb-2">
          {Object.entries(buildingColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="capitalize">{type}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-4 pt-2 border-t border-border/30">
          <div className="flex items-center gap-2 text-xs">
            <svg width="24" height="10" viewBox="0 0 24 10">
              <line x1="0" y1="5" x2="24" y2="5" stroke="hsl(var(--muted-foreground) / 0.5)" strokeWidth="2" strokeDasharray="6 2" />
            </svg>
            <span>Road</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <svg width="24" height="10" viewBox="0 0 24 10">
              <line x1="0" y1="5" x2="20" y2="5" stroke="hsl(142 71% 45% / 0.6)" strokeWidth="1.5" strokeDasharray="3 2" />
              <circle cx="22" cy="5" r="2.5" fill="hsl(142 71% 45% / 0.6)" />
            </svg>
            <span>Walkway</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <svg width="24" height="10" viewBox="0 0 24 10">
              <path d="M0 8 L6 8 L6 5 L12 5 L12 2 L18 2 L18 0 L24 0" stroke="hsl(38 92% 50% / 0.7)" strokeWidth="1.5" fill="none" />
            </svg>
            <span>Stairs</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusMap;
