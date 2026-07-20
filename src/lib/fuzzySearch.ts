/**
 * Fuzzy Search Engine for Campus Navigation
 * Supports all MITS campus buildings from the sketch layout.
 */

import { CAMPUS_NODES, GraphNode } from '@/lib/campusGraph';
import { campusBuildings, Building, Floor, Room } from '@/data/campusData';

export interface SearchResult {
  type: 'node' | 'building' | 'room';
  nodeId?: string;
  node?: GraphNode;
  building?: Building;
  floor?: Floor;
  room?: Room;
  score: number;
  matchedOn: string;
}

const SYNONYMS: Record<string, string[]> = {
  'main block':       ['main building', 'mab', 'main academic', 'administration', 'principal office', 'main'],
  'npn block':        ['npn', 'npn building'],
  'civil industrial block': ['civil industrial', 'civil block', 'civil'],
  'lakshmi block':    ['lakshmi', 'laxmi block', 'laxmi'],
  'placement cell':   ['placement', 'tpo', 'training'],
  'industrial block': ['industrial', 'industry block'],
  'auditorium':       ['audi', 'hall', 'seminar hall'],
  'saraswathi block': ['saraswathi', 'saraswati', 'saraswati block'],
  'circular block':   ['circular', 'round block'],
  'central library':  ['library', 'central lib', 'reading room', 'book'],
  'west block':       ['west', 'west building'],
  'kk block':        ['kk', 'kk building', 'mca block', 'mba block', 'mca department', 'mba department'],
  "ekadant's cafe":   ["ekadant's", 'ekadants', 'ekadant', 'cafe', 'ekadants cafe'],
  'lickies ice creams and cool drinks': ['lickies', 'ice cream', 'cool drinks', 'ice creams', 'licky'],
  'main canteen':     ['main canteen', 'canteen', 'cafeteria', 'food court', 'mess', 'dining', 'food'],
  'i love mits park': ['i love mits', 'park', 'garden', 'mits park'],
  'parking':          ['parking area', 'bus parking', 'vehicle', 'bike', 'car parking', 'college bus'],
  'ground':           ['mits ground', 'sports', 'playground', 'field', 'cricket', 'football'],
  'gate':             ['main gate', 'entrance', 'entry', 'security gate', 'security'],
  // KK Block indoor rooms
  'hod office':       ['head of department', 'hod', 'hod room'],
  'computer lab':     ['mca lab', 'lab'],
  'vice principal office': ['vp office', 'vice principal', 'vp'],
  'staff room':       ['staff', 'teachers room'],
  'mca first year':   ['mca 1st year', 'mca classroom'],
  'mca second year':  ['mca 2nd year'],
  'mba first year':   ['mba 1st year', 'mba classroom'],
  'mba second year':  ['mba 2nd year'],
  'faculty rooms':    ['faculty', 'faculty office'],
  // Admin Block indoor rooms
  'reception':        ['front desk', 'help desk'],
  'chairman office':  ['chairman', 'chairman room'],
  'accounts section': ['accounts', 'fee counter', 'finance'],
  'student welfare office': ['student welfare', 'welfare', 'welfare office'],
  'international affairs office': ['international affairs', 'international office', 'foreign affairs'],
  'stationery room':  ['stationery', 'stationery store'],
};

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  if (q === t) return 0;
  if (t.includes(q)) return 0.5;
  if (q.includes(t)) return 0.8;
  if (t.startsWith(q)) return 0.3;
  return levenshtein(q, t) / Math.max(q.length, t.length);
}

function expandWithSynonyms(query: string): string[] {
  const q = query.toLowerCase().trim();
  const results = [q];
  for (const [canonical, synonyms] of Object.entries(SYNONYMS)) {
    if (synonyms.some(s => q.includes(s)) || q.includes(canonical)) {
      results.push(canonical);
      results.push(...synonyms);
    }
  }
  return [...new Set(results)];
}

export function searchCampusGraph(query: string, maxResults = 10): SearchResult[] {
  if (!query.trim()) return [];
  const expandedQueries = expandWithSynonyms(query);
  const results: SearchResult[] = [];
  const threshold = 0.6;

  for (const node of CAMPUS_NODES) {
    let bestScore = Infinity;
    let matchField = '';
    for (const q of expandedQueries) {
      const fields = [
        { value: node.name, field: 'name' },
        { value: node.shortName || '', field: 'shortName' },
        ...(node.landmarks || []).map(l => ({ value: l, field: 'landmark' })),
      ];
      for (const { value, field } of fields) {
        if (!value) continue;
        const score = fuzzyScore(q, value);
        if (score < bestScore) {
          bestScore = score;
          matchField = field;
        }
      }
    }
    if (bestScore <= threshold) {
      results.push({ type: 'node', nodeId: node.id, node, score: bestScore, matchedOn: matchField });
    }
  }

  for (const building of campusBuildings) {
    for (const q of expandedQueries) {
      const buildingScore = Math.min(
        fuzzyScore(q, building.name),
        fuzzyScore(q, building.shortName),
      );
      if (buildingScore <= threshold && !results.some(r => r.nodeId === building.id)) {
        results.push({ type: 'building', building, score: buildingScore, matchedOn: 'building' });
      }
    }
  }

  results.sort((a, b) => a.score - b.score);
  return results.slice(0, maxResults);
}

export function resolveLocationToNodeId(query: string): string | null {
  if (!query.trim()) return null;
  const directNode = CAMPUS_NODES.find(n => n.id === query);
  if (directNode) return directNode.id;

  const results = searchCampusGraph(query, 1);
  if (results.length === 0) return null;

  const best = results[0];
  if (best.nodeId) return best.nodeId;

  if (best.building) {
    const node = CAMPUS_NODES.find(n => n.buildingId === best.building?.id);
    if (node) return node.id;
  }

  return null;
}
