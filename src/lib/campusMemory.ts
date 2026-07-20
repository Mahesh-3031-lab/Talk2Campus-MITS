/**
 * Campus Context Graph Memory
 * 
 * A lightweight, offline-first graph memory system that tracks
 * relationships between users, locations, buildings, routes, and conversations.
 * Persisted in localStorage for offline support.
 */

// ────────────── Types ──────────────

export type NodeType = 'user' | 'building' | 'room' | 'floor' | 'route' | 'department' | 'landmark' | 'office' | 'facility';

export type RelationType =
  | 'visited'
  | 'searched'
  | 'navigated_to'
  | 'located_in'
  | 'near'
  | 'route_to'
  | 'frequently_goes_to'
  | 'connected_to'
  | 'on_floor'
  | 'part_of';

export interface MemoryNode {
  id: string;
  type: NodeType;
  name: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface MemoryEdge {
  from: string;
  to: string;
  relation: RelationType;
  weight: number;       // frequency / importance
  timestamp: number;    // last interaction time
  metadata?: Record<string, string | number>;
}

export interface GraphMemory {
  nodes: MemoryNode[];
  edges: MemoryEdge[];
  version: number;
  lastUpdated: number;
}

// ────────────── Constants ──────────────

const STORAGE_KEY = 'campus-graph-memory';
const CURRENT_VERSION = 1;
const USER_NODE_ID = 'user_current';
const MAX_EDGES = 200;
const DECAY_DAYS = 30;

// ────────────── Static Campus Relationships ──────────────

const STATIC_EDGES: Omit<MemoryEdge, 'weight' | 'timestamp'>[] = [
  { from: 'placement_cell', to: 'lakshmi_block', relation: 'located_in' },
  { from: 'lakshmi_block', to: 'industrial_block', relation: 'near' },
  { from: 'lakshmi_block', to: 'main_block', relation: 'near' },
  { from: 'main_block', to: 'npn_block', relation: 'near' },
  { from: 'kk_block', to: 'ekadants_cafe', relation: 'near' },
  { from: 'ekadants_cafe', to: 'lickies', relation: 'near' },
  { from: 'kk_block', to: 'circular_block', relation: 'near' },
  { from: 'library', to: 'circular_block', relation: 'near' },
  { from: 'auditorium', to: 'saraswathi_block', relation: 'near' },
  { from: 'main_gate', to: 'security_gate', relation: 'connected_to' },
  { from: 'main_canteen', to: 'npn_block', relation: 'near' },
  // Admin block rooms
  { from: 'reception', to: 'main_block', relation: 'located_in' },
  { from: 'chairman_office', to: 'main_block', relation: 'located_in' },
  { from: 'accounts_section', to: 'main_block', relation: 'located_in' },
  { from: 'vice_principal_office', to: 'main_block', relation: 'located_in' },
  { from: 'student_welfare', to: 'main_block', relation: 'located_in' },
  { from: 'international_affairs', to: 'main_block', relation: 'located_in' },
  { from: 'stationery_room', to: 'main_block', relation: 'located_in' },
  { from: 'stationery_room', to: 'lakshmi_block', relation: 'near' },
  // KK Block rooms
  { from: 'hod_office_mca', to: 'kk_block', relation: 'located_in' },
  { from: 'computer_lab', to: 'kk_block', relation: 'located_in' },
  { from: 'mca_classroom', to: 'kk_block', relation: 'located_in' },
  { from: 'mba_classroom', to: 'kk_block', relation: 'located_in' },
];

const STATIC_NODES: MemoryNode[] = [
  { id: USER_NODE_ID, type: 'user', name: 'Current User' },
  { id: 'main_gate', type: 'landmark', name: 'Main Gate' },
  { id: 'security_gate', type: 'landmark', name: 'Security Gate' },
  { id: 'main_block', type: 'building', name: 'Main Block' },
  { id: 'kk_block', type: 'building', name: 'KK Block' },
  { id: 'lakshmi_block', type: 'building', name: 'Lakshmi Block' },
  { id: 'circular_block', type: 'building', name: 'Circular Block' },
  { id: 'library', type: 'facility', name: 'Library' },
  { id: 'auditorium', type: 'facility', name: 'Auditorium' },
  { id: 'ekadants_cafe', type: 'facility', name: "Ekadant's Cafe" },
  { id: 'lickies', type: 'facility', name: 'Lickies Ice Creams and Cool Drinks' },
  { id: 'main_canteen', type: 'facility', name: 'Main Canteen' },
  { id: 'placement_cell', type: 'office', name: 'Placement Cell' },
  { id: 'npn_block', type: 'building', name: 'NPN Block' },
  { id: 'industrial_block', type: 'building', name: 'Industrial Block' },
  { id: 'saraswathi_block', type: 'building', name: 'Saraswathi Block' },
  { id: 'west_block', type: 'building', name: 'West Block' },
  { id: 'reception', type: 'room', name: 'Reception' },
  { id: 'chairman_office', type: 'room', name: 'Chairman Office' },
  { id: 'accounts_section', type: 'room', name: 'Accounts Section' },
  { id: 'vice_principal_office', type: 'room', name: 'Vice Principal Office' },
  { id: 'student_welfare', type: 'room', name: 'Student Welfare Office' },
  { id: 'international_affairs', type: 'room', name: 'International Affairs Office' },
  { id: 'stationery_room', type: 'room', name: 'Stationery Room' },
  { id: 'hod_office_mca', type: 'room', name: 'HOD Office (MCA)' },
  { id: 'computer_lab', type: 'room', name: 'Computer Lab' },
  { id: 'mca_classroom', type: 'room', name: 'MCA Classroom' },
  { id: 'mba_classroom', type: 'room', name: 'MBA Classroom' },
];

// ────────────── Core Engine ──────────────

function createEmptyGraph(): GraphMemory {
  return {
    nodes: [...STATIC_NODES],
    edges: STATIC_EDGES.map(e => ({ ...e, weight: 1, timestamp: Date.now() })),
    version: CURRENT_VERSION,
    lastUpdated: Date.now(),
  };
}

function loadGraph(): GraphMemory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyGraph();
    const graph: GraphMemory = JSON.parse(raw);
    if (graph.version !== CURRENT_VERSION) return createEmptyGraph();
    return graph;
  } catch {
    return createEmptyGraph();
  }
}

function saveGraph(graph: GraphMemory): void {
  graph.lastUpdated = Date.now();
  // Prune old edges
  if (graph.edges.length > MAX_EDGES) {
    graph.edges.sort((a, b) => b.timestamp - a.timestamp);
    graph.edges = graph.edges.slice(0, MAX_EDGES);
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(graph));
  } catch {
    // localStorage full — silently fail
  }
}

// ────────────── Public API ──────────────

/** Ensure a node exists in the graph */
export function ensureNode(id: string, type: NodeType, name: string, metadata?: Record<string, string | number | boolean>): void {
  const graph = loadGraph();
  const existing = graph.nodes.find(n => n.id === id);
  if (!existing) {
    graph.nodes.push({ id, type, name, metadata });
    saveGraph(graph);
  }
}

/** Add or strengthen a relationship */
export function addEdge(from: string, to: string, relation: RelationType, metadata?: Record<string, string | number>): void {
  const graph = loadGraph();
  const existing = graph.edges.find(e => e.from === from && e.to === to && e.relation === relation);
  if (existing) {
    existing.weight += 1;
    existing.timestamp = Date.now();
    if (metadata) existing.metadata = { ...existing.metadata, ...metadata };
  } else {
    graph.edges.push({ from, to, relation, weight: 1, timestamp: Date.now(), metadata });
  }
  saveGraph(graph);
}

/** Record a user action (visited, searched, navigated_to) */
export function recordUserAction(relation: 'visited' | 'searched' | 'navigated_to', targetId: string, targetName: string, targetType: NodeType = 'building'): void {
  ensureNode(targetId, targetType, targetName);
  addEdge(USER_NODE_ID, targetId, relation);

  // Auto-promote to frequently_goes_to if weight ≥ 3
  const graph = loadGraph();
  const edge = graph.edges.find(e => e.from === USER_NODE_ID && e.to === targetId && (e.relation === 'visited' || e.relation === 'navigated_to'));
  if (edge && edge.weight >= 3) {
    const freqExists = graph.edges.find(e => e.from === USER_NODE_ID && e.to === targetId && e.relation === 'frequently_goes_to');
    if (!freqExists) {
      graph.edges.push({ from: USER_NODE_ID, to: targetId, relation: 'frequently_goes_to', weight: edge.weight, timestamp: Date.now() });
      saveGraph(graph);
    }
  }
}

/** Get all nodes related to a given node by relation type */
export function getRelated(nodeId: string, relation?: RelationType): { node: MemoryNode; edge: MemoryEdge }[] {
  const graph = loadGraph();
  const edges = graph.edges.filter(e =>
    (e.from === nodeId || e.to === nodeId) &&
    (!relation || e.relation === relation)
  );
  return edges.map(edge => {
    const relatedId = edge.from === nodeId ? edge.to : edge.from;
    const node = graph.nodes.find(n => n.id === relatedId);
    return { node: node || { id: relatedId, type: 'building', name: relatedId }, edge };
  });
}

/** Get user's recent places (sorted by recency) */
export function getRecentPlaces(limit = 5): { id: string; name: string; type: NodeType; lastVisited: number; visitCount: number }[] {
  const graph = loadGraph();
  const userEdges = graph.edges
    .filter(e => e.from === USER_NODE_ID && (e.relation === 'visited' || e.relation === 'navigated_to' || e.relation === 'searched'))
    .sort((a, b) => b.timestamp - a.timestamp);

  const seen = new Set<string>();
  const results: { id: string; name: string; type: NodeType; lastVisited: number; visitCount: number }[] = [];

  for (const edge of userEdges) {
    if (seen.has(edge.to)) continue;
    seen.add(edge.to);
    const node = graph.nodes.find(n => n.id === edge.to);
    if (node) {
      results.push({
        id: node.id,
        name: node.name,
        type: node.type,
        lastVisited: edge.timestamp,
        visitCount: edge.weight,
      });
    }
    if (results.length >= limit) break;
  }

  return results;
}

/** Get user's frequently visited places */
export function getFrequentPlaces(limit = 5): { id: string; name: string; type: NodeType; visitCount: number }[] {
  const graph = loadGraph();
  const userEdges = graph.edges
    .filter(e => e.from === USER_NODE_ID && (e.relation === 'visited' || e.relation === 'navigated_to'))
    .sort((a, b) => b.weight - a.weight);

  const seen = new Set<string>();
  const results: { id: string; name: string; type: NodeType; visitCount: number }[] = [];

  for (const edge of userEdges) {
    if (seen.has(edge.to)) continue;
    seen.add(edge.to);
    const node = graph.nodes.find(n => n.id === edge.to);
    if (node && edge.weight >= 2) {
      results.push({
        id: node.id,
        name: node.name,
        type: node.type,
        visitCount: edge.weight,
      });
    }
    if (results.length >= limit) break;
  }

  return results;
}

/** Generate contextual suggestions based on graph patterns */
export function getPredictiveSuggestions(limit = 3): string[] {
  const suggestions: string[] = [];
  const recent = getRecentPlaces(3);
  const frequent = getFrequentPlaces(3);

  // Suggest resuming recent navigation
  if (recent.length > 0) {
    const last = recent[0];
    const timeDiff = Date.now() - last.lastVisited;
    if (timeDiff < 24 * 60 * 60 * 1000) { // within last 24h
      suggestions.push(`Resume route to ${last.name}`);
    }
  }

  // Suggest frequently visited places
  for (const place of frequent) {
    if (suggestions.length >= limit) break;
    suggestions.push(`Navigate to ${place.name}`);
  }

  // Suggest nearby places based on graph relationships
  if (recent.length > 0) {
    const lastPlace = recent[0];
    const nearby = getRelated(lastPlace.id, 'near');
    for (const { node } of nearby) {
      if (suggestions.length >= limit) break;
      if (!suggestions.some(s => s.includes(node.name))) {
        suggestions.push(`Explore nearby ${node.name}`);
      }
    }
  }

  return suggestions.slice(0, limit);
}

/** Build a context string for the AI from graph memory */
export function buildMemoryContext(): string {
  const recent = getRecentPlaces(5);
  const frequent = getFrequentPlaces(3);

  if (recent.length === 0 && frequent.length === 0) return '';

  const parts: string[] = ['USER MEMORY CONTEXT:'];

  if (recent.length > 0) {
    parts.push(`Recently interacted: ${recent.map(r => r.name).join(', ')}`);
  }

  if (frequent.length > 0) {
    parts.push(`Frequently visits: ${frequent.map(f => `${f.name} (${f.visitCount}x)`).join(', ')}`);
  }

  // Add location relationship context for recent places
  for (const place of recent.slice(0, 3)) {
    const related = getRelated(place.id);
    const relStrings = related
      .filter(r => r.edge.relation === 'located_in' || r.edge.relation === 'near')
      .map(r => `${r.edge.relation === 'located_in' ? 'inside' : 'near'} ${r.node.name}`);
    if (relStrings.length > 0) {
      parts.push(`${place.name} is ${relStrings.join(', ')}`);
    }
  }

  return parts.join('\n');
}

/** Resolve a location name to its graph node ID */
export function resolveToGraphNodeId(name: string): string {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  const graph = loadGraph();
  // Exact match
  const exact = graph.nodes.find(n => n.id === normalized);
  if (exact) return exact.id;
  // Name match
  const byName = graph.nodes.find(n => n.name.toLowerCase() === name.toLowerCase());
  if (byName) return byName.id;
  // Fuzzy
  const fuzzy = graph.nodes.find(n => n.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(n.name.toLowerCase()));
  if (fuzzy) return fuzzy.id;
  return normalized;
}

/** Get the full graph for debugging */
export function getFullGraph(): GraphMemory {
  return loadGraph();
}

/** Clear all user-specific memory (keep static relationships) */
export function clearUserMemory(): void {
  const graph = createEmptyGraph();
  saveGraph(graph);
}
