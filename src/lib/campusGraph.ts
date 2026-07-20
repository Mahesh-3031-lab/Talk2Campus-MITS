/**
 * Campus Graph Model + A* Pathfinding Engine
 * 
 * Full MITS campus layout based on hand-drawn sketch.
 * Nodes: Main Gate, Security Gate, Secondary Junction, and all campus buildings.
 */

import { CAMPUS_GPS_BOUNDS, GPSCoordinate } from '@/data/campusData';

// ────────────────────── Types ──────────────────────

export type NodeType = 'building' | 'intersection' | 'entry' | 'landmark' | 'parking' | 'ground' | 'checkpoint' | 'junction' | 'facility' | 'office';

export interface GraphNode {
  id: string;
  name: string;
  shortName?: string;
  type: NodeType;
  position: { x: number; y: number };
  gps: GPSCoordinate;
  landmarks?: string[];
  buildingId?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  distance: number;
  pathType: 'walkway' | 'road' | 'stairs' | 'corridor' | 'entrance';
  bearing?: number;
  intermediatePoints?: { x: number; y: number }[];
}

export interface RouteResult {
  path: GraphNode[];
  totalDistance: number;
  edges: GraphEdge[];
}

// ────────────────── Utility ──────────────────

function gridToGPS(x: number, y: number): GPSCoordinate {
  return {
    latitude: CAMPUS_GPS_BOUNDS.maxLat - (y / 100) * (CAMPUS_GPS_BOUNDS.maxLat - CAMPUS_GPS_BOUNDS.minLat),
    longitude: CAMPUS_GPS_BOUNDS.minLon + (x / 100) * (CAMPUS_GPS_BOUNDS.maxLon - CAMPUS_GPS_BOUNDS.minLon),
  };
}

function haversine(a: GPSCoordinate, b: GPSCoordinate): number {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinLon * sinLon;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function bearing(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x;
  const dy = -(b.y - a.y);
  let angle = (Math.atan2(dx, dy) * 180) / Math.PI;
  if (angle < 0) angle += 360;
  return angle;
}

function bearingToCardinal(deg: number): string {
  const dirs = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West'];
  return dirs[Math.round(deg / 45) % 8];
}

export function relativeTurn(prevBearing: number, nextBearing: number): 'left' | 'right' | 'straight' | 'slight-left' | 'slight-right' | 'u-turn' {
  let diff = ((nextBearing - prevBearing) % 360 + 360) % 360;
  if (diff > 180) diff -= 360;
  if (Math.abs(diff) < 20) return 'straight';
  if (diff >= 20 && diff < 60) return 'slight-right';
  if (diff >= 60 && diff < 160) return 'right';
  if (diff <= -20 && diff > -60) return 'slight-left';
  if (diff <= -60 && diff > -160) return 'left';
  return 'u-turn';
}

// ────────────────── Campus Graph Data ──────────────────

function node(id: string, name: string, type: NodeType, x: number, y: number, extra?: Partial<GraphNode>): GraphNode {
  return { id, name, type, position: { x, y }, gps: gridToGPS(x, y), ...extra };
}

/*
  Layout from sketch (top = north, y increases downward):
  
  Top row:        Industrial → Auditorium → Saraswathi
  Upper mid:      Civil Industrial → Lakshmi → (Placement behind) → Circular → West
  Mid row:  Main Canteen ← NPN → Main Block                  KK → Ekadant's → Lickies
  Lower:          I Love MITS Park                                  
  South:          Secondary Jn → roads
  Bottom:   Parking ← Gate/Security                    Ground
*/

export const CAMPUS_NODES: GraphNode[] = [
  // ── Entry & Junctions ──
  node('main-gate',       'Main Gate',           'entry',       45, 92, { landmarks: ['College Entrance'] }),
  node('security-gate',   'Security Gate',       'checkpoint',  45, 78, { landmarks: ['Security Checkpoint'] }),
  node('secondary-jn',    'Secondary Junction',  'junction',    45, 65),

  // ── Road intersections (invisible routing helpers) ──
  node('int-upper',       'Upper Junction',      'intersection', 45, 50),
  node('int-north',       'North Junction',      'intersection', 45, 25),
  node('int-ne',          'NE Junction',         'intersection', 62, 12),
  node('int-east-mid',    'East Mid Junction',   'intersection', 72, 25),
  node('int-east',        'East Junction',       'intersection', 82, 38),

  // ── Buildings ──
  node('npn-block',       'NPN Block',           'building',    32, 50,  { shortName: 'NPN Block',       buildingId: 'npn-block',       landmarks: ['Below Main Block'] }),
  node('main-block',      'Main Block',          'building',    32, 38,  { shortName: 'Main Block',      buildingId: 'main-block',      landmarks: ['Center of campus'] }),
  node('civil-industrial-block','Civil Industrial Block','building', 40, 25, { shortName: 'Civil Industrial', buildingId: 'civil-industrial-block', landmarks: ['Near Lakshmi Block'] }),
  node('lakshmi-block',   'Lakshmi Block',       'building',    52, 25,  { shortName: 'Lakshmi Block',   buildingId: 'lakshmi-block',   landmarks: ['Near Placement Cell'] }),
  node('placement-cell',  'Placement Cell',      'office',      52, 18,  { shortName: 'Placement Cell',  buildingId: 'placement-cell',  landmarks: ['Behind Lakshmi Block'] }),
  node('industrial-block','Industrial Block',     'building',    52, 12,  { shortName: 'Industrial Block',buildingId: 'industrial-block',landmarks: ['Near Auditorium'] }),
  node('auditorium',      'Auditorium',          'facility',    62, 12,  { shortName: 'Auditorium',      buildingId: 'auditorium',      landmarks: ['Near Saraswathi Block'] }),
  node('saraswathi-block','Saraswathi Block',     'building',    78, 12,  { shortName: 'Saraswathi Block',buildingId: 'saraswathi-block',landmarks: ['North-east area'] }),
  node('circular-block',  'Circular Block',      'building',    72, 25,  { shortName: 'Circular Block',  buildingId: 'circular-block',  landmarks: ['Near Central Library'] }),
  node('central-library', 'Central Library',     'facility',    75, 18,  { shortName: 'Library',         buildingId: 'central-library', landmarks: ['Between Saraswathi & Circular Block'] }),
  node('west-block',      'West Block',          'building',    88, 25,  { shortName: 'West Block',      buildingId: 'west-block',      landmarks: ["Near Ekadant's Cafe"] }),
  node('kk-block',       'KK Block',            'building',    82, 38,  { shortName: 'KK Block',        buildingId: 'kk-block',        landmarks: ["Near Ekadant's Cafe"] }),
  node('ekadants-cafe',   "Ekadant's Cafe",      'facility',    86, 42,  { shortName: "Ekadant's",       buildingId: 'ekadants-cafe',   landmarks: ['Beside KK Block', 'Near Lickies'] }),
  node('lickies',         'Lickies Ice Creams and Cool Drinks', 'facility', 90, 42, { shortName: 'Lickies', buildingId: 'lickies', landmarks: ["Next to Ekadant's Cafe"] }),
  node('main-canteen',    'Main Canteen',        'facility',    8,  38,  { shortName: 'Main Canteen',    buildingId: 'main-canteen',    landmarks: ['Near NPN Block', 'Opposite campus road'] }),

  // ── Landmarks ──
  node('i-love-mits-park','I Love MITS Park',   'landmark',    8,  50,  { shortName: 'I Love MITS',     buildingId: 'i-love-mits-park',landmarks: ['West side'] }),
  node('parking-area',    'Parking Area',        'parking',     12, 82,  { shortName: 'Parking',         buildingId: 'parking-area',    landmarks: ['Near Main Gate'] }),
  node('ground',          'MITS Ground',         'ground',      75, 82,  { shortName: 'Ground',          buildingId: 'ground',          landmarks: ['South-east side'] }),
];

function edge(from: string, to: string, pathType: GraphEdge['pathType'] = 'road'): GraphEdge {
  const a = CAMPUS_NODES.find(n => n.id === from)!;
  const b = CAMPUS_NODES.find(n => n.id === to)!;
  const distance = haversine(a.gps, b.gps);
  return {
    from, to,
    distance: Math.round(distance),
    pathType,
    bearing: bearing(a.position, b.position),
  };
}

export const CAMPUS_EDGES: GraphEdge[] = [
  // Gate → Security → Secondary Junction
  edge('main-gate',       'security-gate',    'road'),
  edge('security-gate',   'secondary-jn',     'road'),

  // Secondary Jn → NPN Block → Main Block → upper
  edge('secondary-jn',    'int-upper',        'road'),
  edge('int-upper',       'npn-block',        'walkway'),
  edge('npn-block',       'main-block',       'walkway'),
  edge('int-upper',       'main-block',       'walkway'),

  // Main Block → Civil Industrial → Lakshmi
  edge('main-block',      'int-north',        'road'),
  edge('int-north',       'civil-industrial-block', 'walkway'),
  edge('civil-industrial-block', 'lakshmi-block', 'road'),

  // Lakshmi → Placement Cell → Industrial Block
  edge('lakshmi-block',   'placement-cell',   'walkway'),
  edge('placement-cell',  'industrial-block', 'road'),

  // Industrial → Auditorium → Saraswathi
  edge('industrial-block','auditorium',       'road'),
  edge('auditorium',      'saraswathi-block', 'road'),

  // Saraswathi → Circular Block → West Block
  edge('saraswathi-block','central-library',  'walkway'),
  edge('central-library', 'circular-block',  'walkway'),
  edge('circular-block',  'west-block',       'road'),
  edge('circular-block',  'int-east-mid',     'road'),

  // Circular → KK → Ekadant's Cafe → Lickies
  edge('int-east-mid',    'int-east',         'road'),
  edge('int-east',        'kk-block',         'walkway'),
  edge('kk-block',        'ekadants-cafe',    'walkway'),
  edge('ekadants-cafe',   'lickies',          'walkway'),

  // NPN → Main Canteen, NPN → I Love MITS Park
  edge('npn-block',       'main-canteen',     'road'),
  edge('npn-block',       'i-love-mits-park', 'walkway'),
  edge('main-canteen',    'i-love-mits-park', 'walkway'),

  // Secondary Jn → Circular Block (second gate road)
  edge('secondary-jn',    'circular-block',   'road'),

  // Secondary Jn → Parking Area
  edge('secondary-jn',    'parking-area',     'road'),

  // Secondary Jn → Ground
  edge('secondary-jn',    'ground',           'road'),
];

// ────────────────── A* Pathfinding ──────────────────

function buildAdjacency(edges: GraphEdge[]): Map<string, { neighborId: string; edge: GraphEdge }[]> {
  const adj = new Map<string, { neighborId: string; edge: GraphEdge }[]>();
  for (const e of edges) {
    if (!adj.has(e.from)) adj.set(e.from, []);
    if (!adj.has(e.to))   adj.set(e.to, []);
    adj.get(e.from)!.push({ neighborId: e.to, edge: e });
    adj.get(e.to)!.push({ neighborId: e.from, edge: e });
  }
  return adj;
}

const adjacency = buildAdjacency(CAMPUS_EDGES);

export function findShortestPath(startId: string, goalId: string): RouteResult | null {
  const startNode = CAMPUS_NODES.find(n => n.id === startId);
  const goalNode  = CAMPUS_NODES.find(n => n.id === goalId);
  if (!startNode || !goalNode) return null;
  if (startId === goalId) return { path: [startNode], totalDistance: 0, edges: [] };

  const parentMap = new Map<string, { parent: string; edge: GraphEdge }>();
  const gScore = new Map<string, number>();
  const open = new Map<string, number>();

  gScore.set(startId, 0);
  open.set(startId, haversine(startNode.gps, goalNode.gps));

  while (open.size > 0) {
    let currentId = '';
    let minF = Infinity;
    for (const [id, f] of open) {
      if (f < minF) { minF = f; currentId = id; }
    }

    if (currentId === goalId) {
      const path: GraphNode[] = [];
      const edges: GraphEdge[] = [];
      let id = goalId;
      while (id) {
        path.unshift(CAMPUS_NODES.find(n => n.id === id)!);
        const info = parentMap.get(id);
        if (info) {
          edges.unshift(info.edge);
          id = info.parent;
        } else break;
      }
      return { path, totalDistance: Math.round(gScore.get(goalId) || 0), edges };
    }

    open.delete(currentId);
    const currentG = gScore.get(currentId) || 0;

    for (const { neighborId, edge: e } of adjacency.get(currentId) || []) {
      const tentativeG = currentG + e.distance;
      if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
        parentMap.set(neighborId, { parent: currentId, edge: e });
        gScore.set(neighborId, tentativeG);
        const h = haversine(CAMPUS_NODES.find(n => n.id === neighborId)!.gps, goalNode.gps);
        open.set(neighborId, tentativeG + h);
      }
    }
  }

  return null;
}

// ────────────────── Exports ──────────────────

export { bearing, bearingToCardinal, haversine, gridToGPS };
