import { useState, useCallback, useMemo } from 'react';
import { X, Search, Navigation, Layers, MapPin, ArrowUp, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SupportedLanguage } from '@/lib/language';
import {
  KK_INDOOR_NODES,
  IndoorNode,
  IndoorStep,
  findIndoorPath,
  generateIndoorSteps,
  searchIndoorRooms,
  resolveIndoorNodeId,
} from '@/data/kkBlockIndoor';
import {
  ADMIN_INDOOR_NODES,
  findAdminIndoorPath,
  generateAdminIndoorSteps,
  searchAdminRooms,
  resolveAdminNodeId,
} from '@/data/adminBlockIndoor';

export type IndoorBuildingId = 'kk-block' | 'main-block';

interface IndoorMapProps {
  onClose: () => void;
  language?: SupportedLanguage;
  buildingId?: IndoorBuildingId;
}

const BUILDING_CONFIG: Record<IndoorBuildingId, {
  name: string;
  subtitle: string;
  floors: string[];
  nodes: IndoorNode[];
  entranceId: string;
  layout: 'multi-floor' | 'corridor';
  adjacentBuilding?: string;
}> = {
  'kk-block': {
    name: 'KK Block',
    subtitle: 'MCA & MBA Department',
    floors: ['Ground', '1st', '2nd', '3rd'],
    nodes: KK_INDOOR_NODES,
    entranceId: 'kk-g-entrance',
    layout: 'multi-floor',
  },
  'main-block': {
    name: 'Admin Block',
    subtitle: 'Administration',
    floors: ['Ground'],
    nodes: ADMIN_INDOOR_NODES,
    entranceId: 'admin-entrance',
    layout: 'corridor',
    adjacentBuilding: 'Lakshmi Block',
  },
};

const ROOM_TYPE_COLORS: Record<string, string> = {
  classroom: 'hsl(217 91% 60%)',
  lab: 'hsl(142 71% 45%)',
  office: 'hsl(38 92% 50%)',
  common: 'hsl(258 90% 66%)',
  washroom: 'hsl(200 18% 46%)',
};

const NODE_TYPE_COLORS: Record<string, string> = {
  lift: 'hsl(200 80% 50%)',
  stairs: 'hsl(25 95% 53%)',
  entrance: 'hsl(0 84% 60%)',
  corridor: 'hsl(var(--muted-foreground))',
};

const IndoorMap = ({ onClose, language = 'en-IN', buildingId = 'kk-block' }: IndoorMapProps) => {
  const config = BUILDING_CONFIG[buildingId];
  const [currentFloor, setCurrentFloor] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<IndoorNode | null>(null);
  const [navigationTo, setNavigationTo] = useState('');
  const [preferLift, setPreferLift] = useState(true);
  const [indoorSteps, setIndoorSteps] = useState<IndoorStep[]>([]);
  const [routeNodeIds, setRouteNodeIds] = useState<Set<string>>(new Set());
  const [routeFloors, setRouteFloors] = useState<Set<number>>(new Set());
  const [isNavigating, setIsNavigating] = useState(false);

  const floorNodes = useMemo(() =>
    config.nodes.filter(n => n.floor === currentFloor),
    [currentFloor, config.nodes]
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return buildingId === 'main-block'
      ? searchAdminRooms(searchQuery)
      : searchIndoorRooms(searchQuery);
  }, [searchQuery, buildingId]);

  const handleNavigate = useCallback(() => {
    if (!navigationTo.trim()) return;
    let toId: string | null;
    if (buildingId === 'main-block') {
      toId = resolveAdminNodeId(navigationTo);
      if (!toId) return;
      const path = findAdminIndoorPath(config.entranceId, toId);
      if (!path) return;
      const steps = generateAdminIndoorSteps(path, language);
      setIndoorSteps(steps);
      setRouteNodeIds(new Set(path.nodes.map(n => n.id)));
      setRouteFloors(new Set(path.nodes.map(n => n.floor)));
      setIsNavigating(true);
    } else {
      toId = resolveIndoorNodeId(navigationTo);
      if (!toId) return;
      const path = findIndoorPath(config.entranceId, toId, preferLift);
      if (!path) return;
      const steps = generateIndoorSteps(path, language);
      setIndoorSteps(steps);
      setRouteNodeIds(new Set(path.nodes.map(n => n.id)));
      setRouteFloors(new Set(path.nodes.map(n => n.floor)));
      setIsNavigating(true);
      const destNode = config.nodes.find(n => n.id === toId);
      if (destNode) setCurrentFloor(destNode.floor);
    }
  }, [navigationTo, preferLift, language, buildingId, config]);

  const handleRoomClick = (node: IndoorNode) => {
    setSelectedNode(node === selectedNode ? null : node);
  };

  const handleNavigateToRoom = (node: IndoorNode) => {
    setNavigationTo(node.name);
    setSelectedNode(null);
    const toId = node.id;
    if (buildingId === 'main-block') {
      const path = findAdminIndoorPath(config.entranceId, toId);
      if (!path) return;
      const steps = generateAdminIndoorSteps(path, language);
      setIndoorSteps(steps);
      setRouteNodeIds(new Set(path.nodes.map(n => n.id)));
      setRouteFloors(new Set(path.nodes.map(n => n.floor)));
    } else {
      const path = findIndoorPath(config.entranceId, toId, preferLift);
      if (!path) return;
      const steps = generateIndoorSteps(path, language);
      setIndoorSteps(steps);
      setRouteNodeIds(new Set(path.nodes.map(n => n.id)));
      setRouteFloors(new Set(path.nodes.map(n => n.floor)));
    }
    setIsNavigating(true);
    setCurrentFloor(node.floor);
  };

  const clearNavigation = () => {
    setIndoorSteps([]);
    setRouteNodeIds(new Set());
    setRouteFloors(new Set());
    setIsNavigating(false);
    setNavigationTo('');
  };

  const getNodeColor = (node: IndoorNode) => {
    if (routeNodeIds.has(node.id)) return 'hsl(142 71% 45%)';
    if (node.type === 'room') return ROOM_TYPE_COLORS[node.roomType || ''] || 'hsl(217 91% 60%)';
    return NODE_TYPE_COLORS[node.type] || 'hsl(var(--muted-foreground))';
  };

  const getNodeSize = (node: IndoorNode) => {
    if (config.layout === 'corridor' && node.type === 'room') return { w: 16, h: 14 };
    if (node.type === 'entrance') return { w: 14, h: 10 };
    if (node.type === 'room') return { w: 20, h: 12 };
    return { w: 10, h: 8 };
  };

  // Draw route lines on current floor
  const routeEdgesOnFloor = useMemo(() => {
    if (!isNavigating) return [];
    const allRouteNodes = config.nodes.filter(n => routeNodeIds.has(n.id));
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < allRouteNodes.length - 1; i++) {
      const a = allRouteNodes[i];
      const b = allRouteNodes[i + 1];
      if (a.floor === currentFloor && b.floor === currentFloor) {
        lines.push({ x1: a.position.x, y1: a.position.y, x2: b.position.x, y2: b.position.y });
      }
    }
    return lines;
  }, [isNavigating, currentFloor, routeNodeIds, config.nodes]);

  const isCorridor = config.layout === 'corridor';

  return (
    <div className="fixed inset-0 z-[60] bg-background/98 backdrop-blur-md flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <div>
            <h2 className="font-display text-lg font-semibold">{config.name}</h2>
            <p className="text-xs text-muted-foreground">{config.subtitle}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-destructive/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Floor Selector (only for multi-floor) */}
      {config.floors.length > 1 && (
        <div className="px-4 pt-3 pb-2 border-b border-border/30">
          <Tabs value={String(currentFloor)} onValueChange={(v) => setCurrentFloor(Number(v))}>
            <TabsList className="w-full">
              {config.floors.map((label, i) => (
                <TabsTrigger
                  key={i}
                  value={String(i)}
                  className={`flex-1 text-xs ${routeFloors.has(i) ? 'ring-1 ring-primary/50' : ''}`}
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Search & Navigation Controls */}
      <div className="p-4 space-y-3 border-b border-border/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={isCorridor ? "Search rooms... (Chairman, Accounts)" : "Search rooms... (HOD office, Computer Lab)"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-full bg-muted/50 text-sm"
          />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="bg-muted/30 rounded-lg p-2 space-y-1 max-h-32 overflow-y-auto">
            {searchResults.map(node => (
              <button
                key={node.id}
                onClick={() => {
                  setCurrentFloor(node.floor);
                  setSelectedNode(node);
                  setSearchQuery('');
                }}
                className="w-full text-left px-3 py-1.5 rounded-md hover:bg-muted text-sm flex justify-between items-center"
              >
                <span>{node.name}</span>
                <span className="text-xs text-muted-foreground">
                  {config.floors.length > 1 ? `${config.floors[node.floor]} Floor` : ''}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Navigation input */}
        <div className="flex gap-2">
          <Input
            placeholder="Navigate to..."
            value={navigationTo}
            onChange={(e) => setNavigationTo(e.target.value)}
            className="flex-1 rounded-lg text-sm"
          />
          <Button size="sm" onClick={handleNavigate} disabled={!navigationTo.trim()}>
            <Navigation className="w-4 h-4" />
          </Button>
        </div>

        {/* Lift/Stairs toggle (only for multi-floor) */}
        <div className="flex items-center gap-3">
          {config.floors.length > 1 && (
            <>
              <button
                onClick={() => setPreferLift(true)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors ${
                  preferLift ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <ArrowUp className="w-3 h-3" /> Lift
              </button>
              <button
                onClick={() => setPreferLift(false)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors ${
                  !preferLift ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <Layers className="w-3 h-3" /> Stairs
              </button>
            </>
          )}
          {config.adjacentBuilding && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowRight className="w-3 h-3" /> Connects to {config.adjacentBuilding}
            </span>
          )}
          {isNavigating && (
            <button
              onClick={clearNavigation}
              className="ml-auto text-xs text-destructive hover:underline"
            >
              Clear route
            </button>
          )}
        </div>
      </div>

      {/* Floor Plan SVG */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="relative w-full h-full bg-muted/20 rounded-2xl border border-border/30 overflow-hidden">
          {/* Floor label */}
          <div className="absolute top-3 left-3 z-10 bg-background/90 px-3 py-1 rounded-full text-xs font-medium border border-border/50">
            {config.floors[currentFloor]} Floor
          </div>

          {/* "You are here" marker */}
          {currentFloor === 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-primary/10 border border-primary/30 px-3 py-1 rounded-full text-xs text-primary font-medium">
              <MapPin className="w-3 h-3" />
              You are here
            </div>
          )}

          {/* Adjacent building indicator for corridor layout */}
          {isCorridor && config.adjacentBuilding && (
            <div className="absolute top-3 right-3 z-10 bg-accent/10 border border-accent/30 px-3 py-1 rounded-full text-xs text-accent-foreground font-medium flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              {config.adjacentBuilding}
            </div>
          )}

          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            {/* Building outline */}
            <rect x="5" y="5" width="90" height="90" rx="3" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="2 1" />

            {/* Corridor line for corridor layout */}
            {isCorridor && (
              <line x1="8" y1="50" x2="95" y2="50" stroke="hsl(var(--muted-foreground))" strokeWidth="0.4" strokeDasharray="2 1" opacity="0.5" />
            )}

            {/* Route lines */}
            {routeEdgesOnFloor.map((line, i) => (
              <line
                key={`route-${i}`}
                x1={line.x1} y1={line.y1}
                x2={line.x2} y2={line.y2}
                stroke="hsl(142 71% 45%)"
                strokeWidth="1.5"
                strokeDasharray="3 1.5"
                strokeLinecap="round"
                opacity="0.8"
              >
                <animate attributeName="stroke-dashoffset" from="0" to="-9" dur="1s" repeatCount="indefinite" />
              </line>
            ))}

            {/* Room nodes */}
            {floorNodes.map(node => {
              const size = getNodeSize(node);
              const color = getNodeColor(node);
              const isSelected = selectedNode?.id === node.id;
              const isOnRoute = routeNodeIds.has(node.id);

              // Hide corridor nodes in the SVG
              if (node.type === 'corridor') return null;

              return (
                <g
                  key={node.id}
                  onClick={() => handleRoomClick(node)}
                  className="cursor-pointer"
                >
                  <rect
                    x={node.position.x - size.w / 2}
                    y={node.position.y - size.h / 2}
                    width={size.w}
                    height={size.h}
                    rx="1.5"
                    fill={color}
                    fillOpacity={isOnRoute ? 0.9 : 0.7}
                    stroke={isSelected ? 'hsl(var(--foreground))' : 'white'}
                    strokeWidth={isSelected ? '1' : '0.3'}
                  />
                  <text
                    x={node.position.x}
                    y={node.position.y + 0.5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={isCorridor ? '2' : '2.5'}
                    fontWeight="600"
                  >
                    {node.name.length > 18 ? node.name.substring(0, 17) + '…' : node.name}
                  </text>

                  {/* Entrance marker */}
                  {node.type === 'entrance' && currentFloor === 0 && (
                    <circle
                      cx={node.position.x}
                      cy={node.position.y + size.h / 2 + 3}
                      r="2"
                      fill="hsl(217 91% 60%)"
                      stroke="white"
                      strokeWidth="0.4"
                    >
                      <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Selected Room Detail */}
      {selectedNode && selectedNode.type === 'room' && (
        <div className="p-4 border-t border-border/50 bg-muted/20">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-sm">{selectedNode.name}</h4>
              <p className="text-xs text-muted-foreground">
                {config.floors[selectedNode.floor]} Floor
                {selectedNode.department && ` • ${selectedNode.department}`}
                {selectedNode.roomType && ` • ${selectedNode.roomType}`}
              </p>
            </div>
            <Button size="sm" variant="default" onClick={() => handleNavigateToRoom(selectedNode)}>
              <Navigation className="w-3 h-3 mr-1" />
              Navigate
            </Button>
          </div>
        </div>
      )}

      {/* Indoor Directions Panel */}
      {isNavigating && indoorSteps.length > 0 && (
        <div className="border-t border-border/50 bg-primary/5">
          <ScrollArea className="max-h-40">
            <div className="p-3 space-y-1.5">
              {indoorSteps.map((step, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 text-sm px-2 py-1 rounded-md ${
                    step.isStart ? 'bg-primary/10 font-medium' :
                    step.isEnd ? 'bg-green-500/10 font-medium' : ''
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step.instruction}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Legend */}
      <div className="p-3 border-t border-border/30 flex flex-wrap justify-center gap-3">
        {Object.entries(ROOM_TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
            <span className="capitalize">{type}</span>
          </div>
        ))}
        {config.floors.length > 1 && (
          <>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: NODE_TYPE_COLORS.lift }} />
              <span>Lift</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: NODE_TYPE_COLORS.stairs }} />
              <span>Stairs</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default IndoorMap;
