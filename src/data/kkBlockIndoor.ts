/**
 * KK Block Indoor Navigation Graph
 * Departments: MCA & MBA
 * 4 floors: Ground + 3 upper floors
 * Vertical movement: Lift & Stairs
 */

import { SupportedLanguage } from '@/lib/language';

// ────────────────── Types ──────────────────

export interface IndoorNode {
  id: string;
  name: string;
  floor: number;
  type: 'room' | 'corridor' | 'lift' | 'stairs' | 'entrance';
  position: { x: number; y: number }; // 0-100 grid per floor
  department?: string;
  roomType?: string;
}

export interface IndoorEdge {
  from: string;
  to: string;
  distance: number; // in seconds of walk
  type: 'corridor' | 'vertical-lift' | 'vertical-stairs';
}

export interface IndoorPath {
  nodes: IndoorNode[];
  edges: IndoorEdge[];
  totalTime: number; // seconds
}

export interface IndoorStep {
  instruction: string;
  floor: number;
  nodeId: string;
  isStart?: boolean;
  isEnd?: boolean;
}

// ────────────────── Nodes ──────────────────

export const KK_INDOOR_NODES: IndoorNode[] = [
  // Ground Floor
  { id: 'kk-g-entrance', name: 'Main Entrance', floor: 0, type: 'entrance', position: { x: 50, y: 90 } },
  { id: 'kk-g-lobby',    name: 'Lobby',          floor: 0, type: 'corridor', position: { x: 50, y: 70 } },
  { id: 'kk-g-btech',    name: 'B.Tech Classroom Area', floor: 0, type: 'room', position: { x: 20, y: 50 }, roomType: 'classroom' },
  { id: 'kk-g-audi',     name: 'Auditorium Entrance',   floor: 0, type: 'room', position: { x: 80, y: 50 }, roomType: 'common' },
  { id: 'kk-g-lift',     name: 'Lift',           floor: 0, type: 'lift',  position: { x: 50, y: 30 } },
  { id: 'kk-g-stairs',   name: 'Staircase',      floor: 0, type: 'stairs', position: { x: 70, y: 30 } },

  // First Floor
  { id: 'kk-1-landing',  name: 'First Floor Landing', floor: 1, type: 'corridor', position: { x: 50, y: 70 } },
  { id: 'kk-1-mca1',     name: 'MCA First Year Classroom', floor: 1, type: 'room', position: { x: 20, y: 50 }, department: 'MCA', roomType: 'classroom' },
  { id: 'kk-1-lab',      name: 'Computer Lab',   floor: 1, type: 'room', position: { x: 50, y: 40 }, department: 'MCA', roomType: 'lab' },
  { id: 'kk-1-hod',      name: 'HOD Office',     floor: 1, type: 'room', position: { x: 80, y: 50 }, department: 'MCA', roomType: 'office' },
  { id: 'kk-1-lift',     name: 'Lift',           floor: 1, type: 'lift',  position: { x: 50, y: 30 } },
  { id: 'kk-1-stairs',   name: 'Staircase',      floor: 1, type: 'stairs', position: { x: 70, y: 30 } },

  // Second Floor
  { id: 'kk-2-landing',  name: 'Second Floor Landing', floor: 2, type: 'corridor', position: { x: 50, y: 70 } },
  { id: 'kk-2-mca2',     name: 'MCA Second Year Classroom', floor: 2, type: 'room', position: { x: 20, y: 50 }, department: 'MCA', roomType: 'classroom' },
  { id: 'kk-2-mba2',     name: 'MBA Second Year Classroom', floor: 2, type: 'room', position: { x: 20, y: 30 }, department: 'MBA', roomType: 'classroom' },
  { id: 'kk-2-staff',    name: 'Staff Room',     floor: 2, type: 'room', position: { x: 80, y: 40 }, roomType: 'office' },
  { id: 'kk-2-vp',       name: 'Vice Principal Office', floor: 2, type: 'room', position: { x: 80, y: 55 }, roomType: 'office' },
  { id: 'kk-2-lift',     name: 'Lift',           floor: 2, type: 'lift',  position: { x: 50, y: 30 } },
  { id: 'kk-2-stairs',   name: 'Staircase',      floor: 2, type: 'stairs', position: { x: 70, y: 30 } },

  // Third Floor
  { id: 'kk-3-landing',  name: 'Third Floor Landing', floor: 3, type: 'corridor', position: { x: 50, y: 70 } },
  { id: 'kk-3-mba1',     name: 'MBA First Year Classroom', floor: 3, type: 'room', position: { x: 20, y: 50 }, department: 'MBA', roomType: 'classroom' },
  { id: 'kk-3-faculty',  name: 'Faculty Rooms',  floor: 3, type: 'room', position: { x: 80, y: 50 }, roomType: 'office' },
  { id: 'kk-3-lift',     name: 'Lift',           floor: 3, type: 'lift',  position: { x: 50, y: 30 } },
  { id: 'kk-3-stairs',   name: 'Staircase',      floor: 3, type: 'stairs', position: { x: 70, y: 30 } },
];

// ────────────────── Edges ──────────────────

const FLOOR_CHANGE_LIFT = 15;   // seconds per floor via lift
const FLOOR_CHANGE_STAIRS = 25; // seconds per floor via stairs

export const KK_INDOOR_EDGES: IndoorEdge[] = [
  // Ground Floor corridors
  { from: 'kk-g-entrance', to: 'kk-g-lobby',  distance: 5,  type: 'corridor' },
  { from: 'kk-g-lobby',    to: 'kk-g-btech',  distance: 10, type: 'corridor' },
  { from: 'kk-g-lobby',    to: 'kk-g-audi',   distance: 10, type: 'corridor' },
  { from: 'kk-g-lobby',    to: 'kk-g-lift',   distance: 8,  type: 'corridor' },
  { from: 'kk-g-lobby',    to: 'kk-g-stairs', distance: 8,  type: 'corridor' },

  // First Floor corridors
  { from: 'kk-1-landing', to: 'kk-1-mca1',   distance: 10, type: 'corridor' },
  { from: 'kk-1-landing', to: 'kk-1-lab',    distance: 8,  type: 'corridor' },
  { from: 'kk-1-landing', to: 'kk-1-hod',    distance: 12, type: 'corridor' },
  { from: 'kk-1-landing', to: 'kk-1-lift',   distance: 5,  type: 'corridor' },
  { from: 'kk-1-landing', to: 'kk-1-stairs', distance: 5,  type: 'corridor' },
  { from: 'kk-1-lab',     to: 'kk-1-hod',    distance: 8,  type: 'corridor' },

  // Second Floor corridors
  { from: 'kk-2-landing', to: 'kk-2-mca2',   distance: 10, type: 'corridor' },
  { from: 'kk-2-landing', to: 'kk-2-mba2',   distance: 12, type: 'corridor' },
  { from: 'kk-2-landing', to: 'kk-2-staff',  distance: 10, type: 'corridor' },
  { from: 'kk-2-landing', to: 'kk-2-vp',     distance: 12, type: 'corridor' },
  { from: 'kk-2-landing', to: 'kk-2-lift',   distance: 5,  type: 'corridor' },
  { from: 'kk-2-landing', to: 'kk-2-stairs', distance: 5,  type: 'corridor' },
  { from: 'kk-2-staff',   to: 'kk-2-vp',     distance: 5,  type: 'corridor' },

  // Third Floor corridors
  { from: 'kk-3-landing', to: 'kk-3-mba1',    distance: 10, type: 'corridor' },
  { from: 'kk-3-landing', to: 'kk-3-faculty', distance: 10, type: 'corridor' },
  { from: 'kk-3-landing', to: 'kk-3-lift',    distance: 5,  type: 'corridor' },
  { from: 'kk-3-landing', to: 'kk-3-stairs',  distance: 5,  type: 'corridor' },

  // Vertical: Lift connections (floor to floor)
  { from: 'kk-g-lift', to: 'kk-1-lift', distance: FLOOR_CHANGE_LIFT, type: 'vertical-lift' },
  { from: 'kk-1-lift', to: 'kk-2-lift', distance: FLOOR_CHANGE_LIFT, type: 'vertical-lift' },
  { from: 'kk-2-lift', to: 'kk-3-lift', distance: FLOOR_CHANGE_LIFT, type: 'vertical-lift' },

  // Vertical: Stairs connections
  { from: 'kk-g-stairs', to: 'kk-1-stairs', distance: FLOOR_CHANGE_STAIRS, type: 'vertical-stairs' },
  { from: 'kk-1-stairs', to: 'kk-2-stairs', distance: FLOOR_CHANGE_STAIRS, type: 'vertical-stairs' },
  { from: 'kk-2-stairs', to: 'kk-3-stairs', distance: FLOOR_CHANGE_STAIRS, type: 'vertical-stairs' },

  // Lift landing to floor landing
  { from: 'kk-1-lift',   to: 'kk-1-landing', distance: 3, type: 'corridor' },
  { from: 'kk-2-lift',   to: 'kk-2-landing', distance: 3, type: 'corridor' },
  { from: 'kk-3-lift',   to: 'kk-3-landing', distance: 3, type: 'corridor' },
  { from: 'kk-1-stairs', to: 'kk-1-landing', distance: 3, type: 'corridor' },
  { from: 'kk-2-stairs', to: 'kk-2-landing', distance: 3, type: 'corridor' },
  { from: 'kk-3-stairs', to: 'kk-3-landing', distance: 3, type: 'corridor' },
];

// ────────────────── A* Pathfinding ──────────────────

function buildIndoorAdj(edges: IndoorEdge[], preferLift: boolean): Map<string, { neighborId: string; cost: number; edge: IndoorEdge }[]> {
  const adj = new Map<string, { neighborId: string; cost: number; edge: IndoorEdge }[]>();
  for (const e of edges) {
    // Apply preference: penalize non-preferred vertical
    let cost = e.distance;
    if (e.type === 'vertical-lift' && !preferLift) cost += 10;
    if (e.type === 'vertical-stairs' && preferLift) cost += 10;

    if (!adj.has(e.from)) adj.set(e.from, []);
    if (!adj.has(e.to)) adj.set(e.to, []);
    adj.get(e.from)!.push({ neighborId: e.to, cost, edge: e });
    adj.get(e.to)!.push({ neighborId: e.from, cost, edge: e });
  }
  return adj;
}

function indoorHeuristic(a: IndoorNode, b: IndoorNode): number {
  const dx = Math.abs(a.position.x - b.position.x);
  const dy = Math.abs(a.position.y - b.position.y);
  const floorPenalty = Math.abs(a.floor - b.floor) * 15;
  return (dx + dy) * 0.1 + floorPenalty;
}

export function findIndoorPath(startId: string, goalId: string, preferLift = true): IndoorPath | null {
  const startNode = KK_INDOOR_NODES.find(n => n.id === startId);
  const goalNode = KK_INDOOR_NODES.find(n => n.id === goalId);
  if (!startNode || !goalNode) return null;
  if (startId === goalId) return { nodes: [startNode], edges: [], totalTime: 0 };

  const adj = buildIndoorAdj(KK_INDOOR_EDGES, preferLift);
  const parentMap = new Map<string, { parent: string; edge: IndoorEdge }>();
  const gScore = new Map<string, number>();
  const open = new Map<string, number>();

  gScore.set(startId, 0);
  open.set(startId, indoorHeuristic(startNode, goalNode));

  while (open.size > 0) {
    let currentId = '';
    let minF = Infinity;
    for (const [id, f] of open) {
      if (f < minF) { minF = f; currentId = id; }
    }

    if (currentId === goalId) {
      const nodes: IndoorNode[] = [];
      const edges: IndoorEdge[] = [];
      let id = goalId;
      while (id) {
        nodes.unshift(KK_INDOOR_NODES.find(n => n.id === id)!);
        const info = parentMap.get(id);
        if (info) {
          edges.unshift(info.edge);
          id = info.parent;
        } else break;
      }
      return { nodes, edges, totalTime: Math.round(gScore.get(goalId) || 0) };
    }

    open.delete(currentId);
    const currentG = gScore.get(currentId) || 0;

    for (const { neighborId, cost, edge } of adj.get(currentId) || []) {
      const tentativeG = currentG + cost;
      if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
        parentMap.set(neighborId, { parent: currentId, edge });
        gScore.set(neighborId, tentativeG);
        const h = indoorHeuristic(KK_INDOOR_NODES.find(n => n.id === neighborId)!, goalNode);
        open.set(neighborId, tentativeG + h);
      }
    }
  }

  return null;
}

// ────────────────── Voice Step Generation ──────────────────

const FLOOR_NAMES: Record<SupportedLanguage, string[]> = {
  'en-IN': ['ground floor', 'first floor', 'second floor', 'third floor'],
  'hi-IN': ['भूतल', 'पहली मंज़िल', 'दूसरी मंज़िल', 'तीसरी मंज़िल'],
  'te-IN': ['భూ అంతస్తు', 'మొదటి అంతస్తు', 'రెండవ అంతస్తు', 'మూడవ అంతస్తు'],
  'ta-IN': ['தரை தளம்', 'முதல் தளம்', 'இரண்டாம் தளம்', 'மூன்றாம் தளம்'],
  'kn-IN': ['ನೆಲ ಮಹಡಿ', 'ಮೊದಲ ಮಹಡಿ', 'ಎರಡನೇ ಮಹಡಿ', 'ಮೂರನೇ ಮಹಡಿ'],
  'ml-IN': ['ഗ്രൗണ്ട് ഫ്ലോർ', 'ഒന്നാം നില', 'രണ്ടാം നില', 'മൂന്നാം നില'],
};

const INDOOR_TEMPLATES: Record<SupportedLanguage, Record<string, string>> = {
  'en-IN': {
    enter: 'Enter KK Block.',
    takeLift: 'Take lift to {floor}.',
    takeStairs: 'Take stairs to {floor}.',
    walkTo: 'Walk toward {place}.',
    beside: '{place} is beside {landmark}.',
    arrive: 'You have arrived at {place}.',
    onLeft: '{place} is on your left.',
    onRight: '{place} is on your right.',
  },
  'hi-IN': {
    enter: 'KK Block में प्रवेश करें।',
    takeLift: '{floor} तक लिफ्ट लें।',
    takeStairs: '{floor} तक सीढ़ियां लें।',
    walkTo: '{place} की ओर चलें।',
    beside: '{place} {landmark} के बगल में है।',
    arrive: 'आप {place} पहुंच गए हैं।',
    onLeft: '{place} आपके बाएं तरफ है।',
    onRight: '{place} आपके दाएं तरफ है।',
  },
  'te-IN': {
    enter: 'KK Block లోకి ప్రవేశించండి.',
    takeLift: '{floor} కి లిఫ్ట్ తీసుకోండి.',
    takeStairs: '{floor} కి మెట్లు ఎక్కండి.',
    walkTo: '{place} వైపు నడవండి.',
    beside: '{place} {landmark} పక్కన ఉంది.',
    arrive: 'మీరు {place} చేరుకున్నారు.',
    onLeft: '{place} మీ ఎడమ వైపు ఉంది.',
    onRight: '{place} మీ కుడి వైపు ఉంది.',
  },
  'ta-IN': {
    enter: 'KK Block உள்ளே நுழையுங்கள்.',
    takeLift: '{floor} க்கு லிஃப்ட் எடுங்கள்.',
    takeStairs: '{floor} க்கு படிகள் ஏறுங்கள்.',
    walkTo: '{place} பக்கம் நடக்கவும்.',
    beside: '{place} {landmark} அருகில் உள்ளது.',
    arrive: 'நீங்கள் {place} அடைந்துவிட்டீர்கள்.',
    onLeft: '{place} உங்கள் இடதுபுறம் உள்ளது.',
    onRight: '{place} உங்கள் வலதுபுறம் உள்ளது.',
  },
  'kn-IN': {
    enter: 'KK Block ಒಳಗೆ ಪ್ರವೇಶಿಸಿ.',
    takeLift: '{floor} ಗೆ ಲಿಫ್ಟ್ ತೆಗೆದುಕೊಳ್ಳಿ.',
    takeStairs: '{floor} ಗೆ ಮೆಟ್ಟಿಲು ಹತ್ತಿ.',
    walkTo: '{place} ಕಡೆಗೆ ನಡೆಯಿರಿ.',
    beside: '{place} {landmark} ಪಕ್ಕದಲ್ಲಿ ಇದೆ.',
    arrive: 'ನೀವು {place} ತಲುಪಿದ್ದೀರಿ.',
    onLeft: '{place} ನಿಮ್ಮ ಎಡಕ್ಕೆ ಇದೆ.',
    onRight: '{place} ನಿಮ್ಮ ಬಲಕ್ಕೆ ಇದೆ.',
  },
  'ml-IN': {
    enter: 'KK Block ൽ പ്രവേശിക്കുക.',
    takeLift: '{floor} ലേക്ക് ലിഫ്റ്റ് എടുക്കുക.',
    takeStairs: '{floor} ലേക്ക് പടികൾ കയറുക.',
    walkTo: '{place} ലേക്ക് നടക്കുക.',
    beside: '{place} {landmark} ന് അരികിൽ ഉണ്ട്.',
    arrive: 'നിങ്ങൾ {place} എത്തിയിരിക്കുന്നു.',
    onLeft: '{place} നിങ്ങളുടെ ഇടത്താണ്.',
    onRight: '{place} നിങ്ങളുടെ വലത്താണ്.',
  },
};

function indoorT(lang: SupportedLanguage, key: string, vars: Record<string, string> = {}): string {
  let text = INDOOR_TEMPLATES[lang]?.[key] || INDOOR_TEMPLATES['en-IN'][key] || '';
  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(`{${k}}`, v);
  }
  return text;
}

export function generateIndoorSteps(path: IndoorPath, lang: SupportedLanguage = 'en-IN'): IndoorStep[] {
  if (!path || path.nodes.length === 0) return [];

  const steps: IndoorStep[] = [];
  const floorNames = FLOOR_NAMES[lang] || FLOOR_NAMES['en-IN'];

  // Start: enter building
  steps.push({
    instruction: indoorT(lang, 'enter'),
    floor: 0,
    nodeId: path.nodes[0].id,
    isStart: true,
  });

  let prevFloor = path.nodes[0].floor;

  for (let i = 1; i < path.nodes.length; i++) {
    const node = path.nodes[i];
    const edge = path.edges[i - 1];

    // Floor change
    if (node.floor !== prevFloor && edge) {
      const key = edge.type === 'vertical-lift' ? 'takeLift' : 'takeStairs';
      steps.push({
        instruction: indoorT(lang, key, { floor: floorNames[node.floor] || `floor ${node.floor}` }),
        floor: node.floor,
        nodeId: node.id,
      });
      prevFloor = node.floor;
      continue;
    }

    // Skip corridor/landing nodes (they're just waypoints)
    if (node.type === 'corridor' || node.type === 'lift' || node.type === 'stairs') continue;

    // Final destination
    if (i === path.nodes.length - 1) {
      // Check for nearby landmark
      const prevNode = path.nodes[i - 1];
      if (prevNode && prevNode.type === 'room' && prevNode.id !== node.id) {
        steps.push({
          instruction: indoorT(lang, 'beside', { place: node.name, landmark: prevNode.name }),
          floor: node.floor,
          nodeId: node.id,
          isEnd: true,
        });
      } else {
        steps.push({
          instruction: indoorT(lang, 'arrive', { place: node.name }),
          floor: node.floor,
          nodeId: node.id,
          isEnd: true,
        });
      }
    } else {
      // Intermediate room — walk toward
      steps.push({
        instruction: indoorT(lang, 'walkTo', { place: node.name }),
        floor: node.floor,
        nodeId: node.id,
      });
    }
  }

  return steps;
}

// ────────────────── Search helper ──────────────────

export function searchIndoorRooms(query: string): IndoorNode[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return KK_INDOOR_NODES.filter(n =>
    n.type === 'room' && (
      n.name.toLowerCase().includes(q) ||
      (n.department && n.department.toLowerCase().includes(q)) ||
      (n.roomType && n.roomType.toLowerCase().includes(q))
    )
  );
}

/** Resolve a query string to an indoor node ID, or null */
export function resolveIndoorNodeId(query: string): string | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  // Direct ID match
  const direct = KK_INDOOR_NODES.find(n => n.id === q);
  if (direct) return direct.id;

  // Synonym map
  const synonyms: Record<string, string> = {
    'hod office': 'kk-1-hod',
    'hod': 'kk-1-hod',
    'head of department': 'kk-1-hod',
    'computer lab': 'kk-1-lab',
    'mca lab': 'kk-1-lab',
    'lab': 'kk-1-lab',
    'vice principal': 'kk-2-vp',
    'vp office': 'kk-2-vp',
    'vice principal office': 'kk-2-vp',
    'staff room': 'kk-2-staff',
    'mca first year': 'kk-1-mca1',
    'mca 1st year': 'kk-1-mca1',
    'mca second year': 'kk-2-mca2',
    'mca 2nd year': 'kk-2-mca2',
    'mba first year': 'kk-3-mba1',
    'mba 1st year': 'kk-3-mba1',
    'mba second year': 'kk-2-mba2',
    'mba 2nd year': 'kk-2-mba2',
    'faculty': 'kk-3-faculty',
    'faculty rooms': 'kk-3-faculty',
    'btech classroom': 'kk-g-btech',
    'b.tech classroom': 'kk-g-btech',
    'auditorium entrance': 'kk-g-audi',
    'entrance': 'kk-g-entrance',
    'lobby': 'kk-g-lobby',
  };

  for (const [key, nodeId] of Object.entries(synonyms)) {
    if (q.includes(key)) return nodeId;
  }

  // Fuzzy name match
  const results = searchIndoorRooms(query);
  return results.length > 0 ? results[0].id : null;
}
