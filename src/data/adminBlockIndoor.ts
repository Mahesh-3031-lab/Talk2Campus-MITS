/**
 * Admin Block (Main Block) Indoor Navigation Graph
 * Layout: Straight corridor with rooms in sequential order
 * Adjacent building: Lakshmi Block
 */

import { SupportedLanguage } from '@/lib/language';
import { IndoorNode, IndoorEdge, IndoorPath, IndoorStep } from '@/data/kkBlockIndoor';

// ────────────────── Nodes ──────────────────

export const ADMIN_INDOOR_NODES: IndoorNode[] = [
  { id: 'admin-entrance',      name: 'Main Entrance',               floor: 0, type: 'entrance',  position: { x: 10, y: 50 } },
  { id: 'admin-corridor-1',    name: 'Corridor',                    floor: 0, type: 'corridor',  position: { x: 20, y: 50 } },
  { id: 'admin-reception',     name: 'Reception',                   floor: 0, type: 'room',      position: { x: 20, y: 30 }, roomType: 'office' },
  { id: 'admin-corridor-2',    name: 'Corridor',                    floor: 0, type: 'corridor',  position: { x: 30, y: 50 } },
  { id: 'admin-chairman',      name: 'Chairman Office',             floor: 0, type: 'room',      position: { x: 30, y: 30 }, roomType: 'office' },
  { id: 'admin-corridor-3',    name: 'Corridor',                    floor: 0, type: 'corridor',  position: { x: 40, y: 50 } },
  { id: 'admin-accounts',      name: 'Accounts Section',            floor: 0, type: 'room',      position: { x: 40, y: 30 }, roomType: 'office' },
  { id: 'admin-corridor-4',    name: 'Corridor',                    floor: 0, type: 'corridor',  position: { x: 50, y: 50 } },
  { id: 'admin-vp',            name: 'Vice Principal Office',       floor: 0, type: 'room',      position: { x: 50, y: 30 }, roomType: 'office' },
  { id: 'admin-corridor-5',    name: 'Corridor',                    floor: 0, type: 'corridor',  position: { x: 60, y: 50 } },
  { id: 'admin-welfare',       name: 'Student Welfare Office',      floor: 0, type: 'room',      position: { x: 60, y: 30 }, roomType: 'office' },
  { id: 'admin-corridor-6',    name: 'Corridor',                    floor: 0, type: 'corridor',  position: { x: 70, y: 50 } },
  { id: 'admin-international', name: 'International Affairs Office', floor: 0, type: 'room',     position: { x: 70, y: 30 }, roomType: 'office' },
  { id: 'admin-corridor-7',    name: 'Corridor',                    floor: 0, type: 'corridor',  position: { x: 80, y: 50 } },
  { id: 'admin-restroom',      name: "Men's Restroom",              floor: 0, type: 'room',      position: { x: 80, y: 30 }, roomType: 'washroom' },
  { id: 'admin-corridor-8',    name: 'Corridor',                    floor: 0, type: 'corridor',  position: { x: 90, y: 50 } },
  { id: 'admin-stationery',    name: 'Stationery Room',             floor: 0, type: 'room',      position: { x: 90, y: 30 }, roomType: 'office' },
];

// ────────────────── Edges ──────────────────

export const ADMIN_INDOOR_EDGES: IndoorEdge[] = [
  // Corridor spine (entrance → end)
  { from: 'admin-entrance',   to: 'admin-corridor-1', distance: 5,  type: 'corridor' },
  { from: 'admin-corridor-1', to: 'admin-corridor-2', distance: 8,  type: 'corridor' },
  { from: 'admin-corridor-2', to: 'admin-corridor-3', distance: 8,  type: 'corridor' },
  { from: 'admin-corridor-3', to: 'admin-corridor-4', distance: 8,  type: 'corridor' },
  { from: 'admin-corridor-4', to: 'admin-corridor-5', distance: 8,  type: 'corridor' },
  { from: 'admin-corridor-5', to: 'admin-corridor-6', distance: 8,  type: 'corridor' },
  { from: 'admin-corridor-6', to: 'admin-corridor-7', distance: 8,  type: 'corridor' },
  { from: 'admin-corridor-7', to: 'admin-corridor-8', distance: 8,  type: 'corridor' },

  // Rooms branch off corridor
  { from: 'admin-corridor-1', to: 'admin-reception',     distance: 3, type: 'corridor' },
  { from: 'admin-corridor-2', to: 'admin-chairman',      distance: 3, type: 'corridor' },
  { from: 'admin-corridor-3', to: 'admin-accounts',      distance: 3, type: 'corridor' },
  { from: 'admin-corridor-4', to: 'admin-vp',            distance: 3, type: 'corridor' },
  { from: 'admin-corridor-5', to: 'admin-welfare',       distance: 3, type: 'corridor' },
  { from: 'admin-corridor-6', to: 'admin-international', distance: 3, type: 'corridor' },
  { from: 'admin-corridor-7', to: 'admin-restroom',      distance: 3, type: 'corridor' },
  { from: 'admin-corridor-8', to: 'admin-stationery',    distance: 3, type: 'corridor' },
];

// ────────────────── A* Pathfinding ──────────────────

function buildAdminAdj(edges: IndoorEdge[]): Map<string, { neighborId: string; cost: number; edge: IndoorEdge }[]> {
  const adj = new Map<string, { neighborId: string; cost: number; edge: IndoorEdge }[]>();
  for (const e of edges) {
    if (!adj.has(e.from)) adj.set(e.from, []);
    if (!adj.has(e.to)) adj.set(e.to, []);
    adj.get(e.from)!.push({ neighborId: e.to, cost: e.distance, edge: e });
    adj.get(e.to)!.push({ neighborId: e.from, cost: e.distance, edge: e });
  }
  return adj;
}

function adminHeuristic(a: IndoorNode, b: IndoorNode): number {
  return (Math.abs(a.position.x - b.position.x) + Math.abs(a.position.y - b.position.y)) * 0.1;
}

export function findAdminIndoorPath(startId: string, goalId: string): IndoorPath | null {
  const startNode = ADMIN_INDOOR_NODES.find(n => n.id === startId);
  const goalNode = ADMIN_INDOOR_NODES.find(n => n.id === goalId);
  if (!startNode || !goalNode) return null;
  if (startId === goalId) return { nodes: [startNode], edges: [], totalTime: 0 };

  const adj = buildAdminAdj(ADMIN_INDOOR_EDGES);
  const parentMap = new Map<string, { parent: string; edge: IndoorEdge }>();
  const gScore = new Map<string, number>();
  const open = new Map<string, number>();

  gScore.set(startId, 0);
  open.set(startId, adminHeuristic(startNode, goalNode));

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
        nodes.unshift(ADMIN_INDOOR_NODES.find(n => n.id === id)!);
        const info = parentMap.get(id);
        if (info) { edges.unshift(info.edge); id = info.parent; }
        else break;
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
        const h = adminHeuristic(ADMIN_INDOOR_NODES.find(n => n.id === neighborId)!, goalNode);
        open.set(neighborId, tentativeG + h);
      }
    }
  }
  return null;
}

// ────────────────── Voice Step Generation ──────────────────

// Room order for "pass by" instructions
const ROOM_ORDER = [
  'admin-reception', 'admin-chairman', 'admin-accounts', 'admin-vp',
  'admin-welfare', 'admin-international', 'admin-restroom', 'admin-stationery',
];

const ADMIN_TEMPLATES: Record<SupportedLanguage, Record<string, string>> = {
  'en-IN': {
    enter: 'Enter Admin Block.',
    walkStraight: 'Walk straight along the corridor.',
    passBy: 'Pass {place}.',
    arrive: 'You have arrived at {place}.',
    lastRoom: '{place} is the last room near Lakshmi Block.',
    nextTo: '{place} is next.',
    onLeft: '{place} is on your left.',
  },
  'hi-IN': {
    enter: 'एडमिन ब्लॉक में प्रवेश करें।',
    walkStraight: 'कॉरिडोर में सीधे चलें।',
    passBy: '{place} के बगल से निकलें।',
    arrive: 'आप {place} पहुंच गए हैं।',
    lastRoom: '{place} लक्ष्मी ब्लॉक के पास अंतिम कमरा है।',
    nextTo: '{place} अगला है।',
    onLeft: '{place} आपके बाएं तरफ है।',
  },
  'te-IN': {
    enter: 'అడ్మిన్ బ్లాక్ లోకి ప్రవేశించండి.',
    walkStraight: 'కారిడార్ వెంట నేరుగా నడవండి.',
    passBy: '{place} పక్కగా వెళ్ళండి.',
    arrive: 'మీరు {place} చేరుకున్నారు.',
    lastRoom: '{place} లక్ష్మీ బ్లాక్ దగ్గర చివరి గది.',
    nextTo: '{place} తదుపరిది.',
    onLeft: '{place} మీ ఎడమ వైపు ఉంది.',
  },
  'ta-IN': {
    enter: 'அட்மின் பிளாக் உள்ளே நுழையுங்கள்.',
    walkStraight: 'நடைபாதையில் நேராக நடக்கவும்.',
    passBy: '{place} பக்கமாக செல்லவும்.',
    arrive: 'நீங்கள் {place} அடைந்துவிட்டீர்கள்.',
    lastRoom: '{place} லட்சுமி பிளாக் அருகில் கடைசி அறை.',
    nextTo: '{place} அடுத்தது.',
    onLeft: '{place} உங்கள் இடதுபுறம் உள்ளது.',
  },
  'kn-IN': {
    enter: 'ಅಡ್ಮಿನ್ ಬ್ಲಾಕ್ ಒಳಗೆ ಪ್ರವೇಶಿಸಿ.',
    walkStraight: 'ಕಾರಿಡಾರ್ ಉದ್ದಕ್ಕೂ ನೇರವಾಗಿ ನಡೆಯಿರಿ.',
    passBy: '{place} ಪಕ್ಕದಲ್ಲಿ ಹೋಗಿ.',
    arrive: 'ನೀವು {place} ತಲುಪಿದ್ದೀರಿ.',
    lastRoom: '{place} ಲಕ್ಷ್ಮೀ ಬ್ಲಾಕ್ ಬಳಿ ಕೊನೆಯ ಕೊಠಡಿ.',
    nextTo: '{place} ಮುಂದಿನದು.',
    onLeft: '{place} ನಿಮ್ಮ ಎಡಕ್ಕೆ ಇದೆ.',
  },
  'ml-IN': {
    enter: 'അഡ്മിൻ ബ്ലോക്കിൽ പ്രവേശിക്കുക.',
    walkStraight: 'ഇടനാഴിയിലൂടെ നേരെ നടക്കുക.',
    passBy: '{place} ന് അടുത്തുകൂടി പോകുക.',
    arrive: 'നിങ്ങൾ {place} എത്തിയിരിക്കുന്നു.',
    lastRoom: '{place} ലക്ഷ്മി ബ്ലോക്കിന് സമീപം അവസാന മുറിയാണ്.',
    nextTo: '{place} അടുത്തതാണ്.',
    onLeft: '{place} നിങ്ങളുടെ ഇടത്താണ്.',
  },
};

function adminT(lang: SupportedLanguage, key: string, vars: Record<string, string> = {}): string {
  let text = ADMIN_TEMPLATES[lang]?.[key] || ADMIN_TEMPLATES['en-IN'][key] || '';
  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(`{${k}}`, v);
  }
  return text;
}

export function generateAdminIndoorSteps(path: IndoorPath, lang: SupportedLanguage = 'en-IN'): IndoorStep[] {
  if (!path || path.nodes.length === 0) return [];

  const steps: IndoorStep[] = [];
  const destNode = path.nodes[path.nodes.length - 1];
  const destIdx = ROOM_ORDER.indexOf(destNode.id);

  // Step 1: Enter
  steps.push({
    instruction: adminT(lang, 'enter'),
    floor: 0,
    nodeId: path.nodes[0].id,
    isStart: true,
  });

  // Step 2: Walk straight
  steps.push({
    instruction: adminT(lang, 'walkStraight'),
    floor: 0,
    nodeId: 'admin-corridor-1',
  });

  // Step 3: Pass by rooms before destination
  if (destIdx > 0) {
    const roomsToPpass = ROOM_ORDER.slice(0, destIdx);
    const passNames = roomsToPpass
      .map(id => ADMIN_INDOOR_NODES.find(n => n.id === id)?.name)
      .filter(Boolean);

    if (passNames.length > 0) {
      steps.push({
        instruction: adminT(lang, 'passBy', { place: passNames.join(', ') }),
        floor: 0,
        nodeId: roomsToPpass[roomsToPpass.length - 1],
      });
    }
  }

  // Step 4: Arrive
  const isLast = destNode.id === 'admin-stationery';
  steps.push({
    instruction: isLast
      ? adminT(lang, 'lastRoom', { place: destNode.name })
      : adminT(lang, 'arrive', { place: destNode.name }),
    floor: 0,
    nodeId: destNode.id,
    isEnd: true,
  });

  return steps;
}

// ────────────────── Search helper ──────────────────

export function searchAdminRooms(query: string): IndoorNode[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return ADMIN_INDOOR_NODES.filter(n =>
    n.type === 'room' && (
      n.name.toLowerCase().includes(q) ||
      (n.roomType && n.roomType.toLowerCase().includes(q))
    )
  );
}

export function resolveAdminNodeId(query: string): string | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  const direct = ADMIN_INDOOR_NODES.find(n => n.id === q);
  if (direct) return direct.id;

  const synonyms: Record<string, string> = {
    'reception': 'admin-reception',
    'chairman office': 'admin-chairman',
    'chairman': 'admin-chairman',
    'accounts section': 'admin-accounts',
    'accounts': 'admin-accounts',
    'vice principal office': 'admin-vp',
    'vice principal': 'admin-vp',
    'vp office': 'admin-vp',
    'vp': 'admin-vp',
    'student welfare': 'admin-welfare',
    'welfare office': 'admin-welfare',
    'welfare': 'admin-welfare',
    'international affairs': 'admin-international',
    'international office': 'admin-international',
    'international': 'admin-international',
    'restroom': 'admin-restroom',
    "men's restroom": 'admin-restroom',
    'mens restroom': 'admin-restroom',
    'washroom': 'admin-restroom',
    'stationery room': 'admin-stationery',
    'stationery': 'admin-stationery',
    'entrance': 'admin-entrance',
  };

  for (const [key, nodeId] of Object.entries(synonyms)) {
    if (q.includes(key)) return nodeId;
  }

  const results = searchAdminRooms(query);
  return results.length > 0 ? results[0].id : null;
}
