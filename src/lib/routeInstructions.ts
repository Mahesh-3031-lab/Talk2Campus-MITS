/**
 * Multilingual Route Instruction Engine
 * 
 * Converts a RouteResult into human-friendly, voice-optimised
 * step-by-step directions in 6 languages.
 * 
 * Rules:
 * - Each step ≤ 15 words
 * - Landmark-based (no "walk 47.3m NNE")
 * - Matches user language automatically
 */

import { SupportedLanguage } from '@/lib/language';
import { RouteResult, GraphNode, GraphEdge, relativeTurn, bearing } from '@/lib/campusGraph';
import { Waypoint, GPSCoordinate } from '@/data/campusData';

// ────────────────── Types ──────────────────

export interface NavigationStep {
  instruction: string;
  /** Distance in metres to next waypoint */
  distance: number;
  /** Waypoint for GPS tracking */
  waypoint: Waypoint;
  /** Step index */
  index: number;
  isStart?: boolean;
  isEnd?: boolean;
}

// ────────────────── Templates ──────────────────

type TemplateKey =
  | 'start'
  | 'arrive'
  | 'walkStraight'
  | 'turnLeft'
  | 'turnRight'
  | 'slightLeft'
  | 'slightRight'
  | 'continueStraight'
  | 'lookFor'
  | 'passBy'
  | 'distanceAway';

const TEMPLATES: Record<SupportedLanguage, Record<TemplateKey, string>> = {
  'en-IN': {
    start:            'Start from {place}.',
    arrive:           'You have arrived at {place}.',
    walkStraight:     'Walk straight for {distance} metres.',
    turnLeft:         'Turn left near {landmark}.',
    turnRight:        'Turn right near {landmark}.',
    slightLeft:       'Bear slightly left near {landmark}.',
    slightRight:      'Bear slightly right near {landmark}.',
    continueStraight:  'Continue straight past {landmark}.',
    lookFor:          'Look for {landmark} on your {side}.',
    passBy:           'Pass by {landmark}.',
    distanceAway:     '{place} is {distance} metres ahead.',
  },
  'hi-IN': {
    start:            '{place} से शुरू करें।',
    arrive:           'आप {place} पहुंच गए हैं।',
    walkStraight:     '{distance} मीटर सीधे चलें।',
    turnLeft:         '{landmark} के पास बाएं मुड़ें।',
    turnRight:        '{landmark} के पास दाएं मुड़ें।',
    slightLeft:       '{landmark} के पास थोड़ा बाएं जाएं।',
    slightRight:      '{landmark} के पास थोड़ा दाएं जाएं।',
    continueStraight:  '{landmark} को पार करके सीधे चलें।',
    lookFor:          '{landmark} आपके {side} तरफ देखें।',
    passBy:           '{landmark} के बगल से निकलें।',
    distanceAway:     '{place} {distance} मीटर आगे है।',
  },
  'te-IN': {
    start:            '{place} నుండి ప్రారంభించండి.',
    arrive:           'మీరు {place} చేరుకున్నారు.',
    walkStraight:     '{distance} మీటర్లు నేరుగా నడవండి.',
    turnLeft:         '{landmark} దగ్గర ఎడమవైపు తిరగండి.',
    turnRight:        '{landmark} దగ్గర కుడివైపు తిరగండి.',
    slightLeft:       '{landmark} దగ్గర కొద్దిగా ఎడమవైపు వెళ్ళండి.',
    slightRight:      '{landmark} దగ్గర కొద్దిగా కుడివైపు వెళ్ళండి.',
    continueStraight:  '{landmark} దాటి నేరుగా వెళ్ళండి.',
    lookFor:          '{landmark} మీ {side} వైపు చూడండి.',
    passBy:           '{landmark} పక్కగా వెళ్ళండి.',
    distanceAway:     '{place} {distance} మీటర్లు ముందు ఉంది.',
  },
  'ta-IN': {
    start:            '{place} இல் இருந்து தொடங்கவும்.',
    arrive:           'நீங்கள் {place} அடைந்துவிட்டீர்கள்.',
    walkStraight:     '{distance} மீட்டர் நேராக நடக்கவும்.',
    turnLeft:         '{landmark} அருகில் இடதுபுறம் திரும்பவும்.',
    turnRight:        '{landmark} அருகில் வலதுபுறம் திரும்பவும்.',
    slightLeft:       '{landmark} அருகில் சற்று இடதுபுறம் செல்லவும்.',
    slightRight:      '{landmark} அருகில் சற்று வலதுபுறம் செல்லவும்.',
    continueStraight:  '{landmark} கடந்து நேராக செல்லவும்.',
    lookFor:          '{landmark} உங்கள் {side} பக்கம் பாருங்கள்.',
    passBy:           '{landmark} பக்கமாக செல்லவும்.',
    distanceAway:     '{place} {distance} மீட்டர் முன்னால் உள்ளது.',
  },
  'kn-IN': {
    start:            '{place} ಇಂದ ಪ್ರಾರಂಭಿಸಿ.',
    arrive:           'ನೀವು {place} ತಲುಪಿದ್ದೀರಿ.',
    walkStraight:     '{distance} ಮೀಟರ್ ನೇರವಾಗಿ ನಡೆಯಿರಿ.',
    turnLeft:         '{landmark} ಬಳಿ ಎಡಕ್ಕೆ ತಿರುಗಿ.',
    turnRight:        '{landmark} ಬಳಿ ಬಲಕ್ಕೆ ತಿರುಗಿ.',
    slightLeft:       '{landmark} ಬಳಿ ಸ್ವಲ್ಪ ಎಡಕ್ಕೆ ಹೋಗಿ.',
    slightRight:      '{landmark} ಬಳಿ ಸ್ವಲ್ಪ ಬಲಕ್ಕೆ ಹೋಗಿ.',
    continueStraight:  '{landmark} ದಾಟಿ ನೇರವಾಗಿ ಹೋಗಿ.',
    lookFor:          '{landmark} ನಿಮ್ಮ {side} ಕಡೆ ನೋಡಿ.',
    passBy:           '{landmark} ಪಕ್ಕದಲ್ಲಿ ಹೋಗಿ.',
    distanceAway:     '{place} {distance} ಮೀಟರ್ ಮುಂದೆ ಇದೆ.',
  },
  'ml-IN': {
    start:            '{place} ൽ നിന്ന് ആരംഭിക്കുക.',
    arrive:           'നിങ്ങൾ {place} എത്തിയിരിക്കുന്നു.',
    walkStraight:     '{distance} മീറ്റർ നേരെ നടക്കുക.',
    turnLeft:         '{landmark} ന് സമീപം ഇടത്തോട്ട് തിരിയുക.',
    turnRight:        '{landmark} ന് സമീപം വലത്തോട്ട് തിരിയുക.',
    slightLeft:       '{landmark} ന് സമീപം ചെറുതായി ഇടത്തോട്ട് പോകുക.',
    slightRight:      '{landmark} ന് സമീപം ചെറുതായി വലത്തോട്ട് പോകുക.',
    continueStraight:  '{landmark} കടന്ന് നേരെ പോകുക.',
    lookFor:          '{landmark} നിങ്ങളുടെ {side} ഭാഗത്ത് നോക്കുക.',
    passBy:           '{landmark} ന് അടുത്തുകൂടി പോകുക.',
    distanceAway:     '{place} {distance} മീറ്റർ മുന്നിലാണ്.',
  },
};

const SIDE_LABELS: Record<SupportedLanguage, { left: string; right: string }> = {
  'en-IN': { left: 'left',    right: 'right' },
  'hi-IN': { left: 'बाएं',    right: 'दाएं' },
  'te-IN': { left: 'ఎడమ',    right: 'కుడి' },
  'ta-IN': { left: 'இடது',   right: 'வலது' },
  'kn-IN': { left: 'ಎಡ',     right: 'ಬಲ' },
  'ml-IN': { left: 'ഇടത്',   right: 'വലത്' },
};

// ────────────────── Instruction Generator ──────────────────

function t(lang: SupportedLanguage, key: TemplateKey, vars: Record<string, string>): string {
  let text = TEMPLATES[lang]?.[key] || TEMPLATES['en-IN'][key];
  for (const [k, v] of Object.entries(vars)) {
    text = text.replace(`{${k}}`, v);
  }
  return text;
}

function nodeToWaypoint(node: GraphNode): Waypoint {
  return {
    id: node.id,
    name: node.name,
    gridPosition: node.position,
    gpsPosition: node.gps,
  };
}

/**
 * Convert a RouteResult into multilingual NavigationSteps.
 */
export function generateNavigationSteps(route: RouteResult, lang: SupportedLanguage = 'en-IN'): NavigationStep[] {
  const { path, edges } = route;
  if (path.length === 0) return [];
  if (path.length === 1) {
    return [{
      instruction: t(lang, 'arrive', { place: path[0].name }),
      distance: 0,
      waypoint: nodeToWaypoint(path[0]),
      index: 0,
      isStart: true,
      isEnd: true,
    }];
  }

  const steps: NavigationStep[] = [];

  // Start step
  steps.push({
    instruction: t(lang, 'start', { place: path[0].name }),
    distance: edges[0]?.distance || 0,
    waypoint: nodeToWaypoint(path[0]),
    index: 0,
    isStart: true,
  });

  // Intermediate steps
  for (let i = 1; i < path.length - 1; i++) {
    const prevEdge = edges[i - 1];
    const nextEdge = edges[i];
    const node = path[i];
    const distToNext = nextEdge?.distance || 0;

    // Determine landmark name
    const landmark = node.landmarks?.[0] || node.name;

    // Skip pure intersections with no turn (just keep walking)
    if (node.type === 'intersection' && prevEdge && nextEdge) {
      const prevB = prevEdge.bearing ?? bearing(path[i - 1].position, node.position);
      const nextB = nextEdge.bearing ?? bearing(node.position, path[i + 1].position);
      const turn = relativeTurn(prevB, nextB);

      let templateKey: TemplateKey;
      switch (turn) {
        case 'left':         templateKey = 'turnLeft'; break;
        case 'right':        templateKey = 'turnRight'; break;
        case 'slight-left':  templateKey = 'slightLeft'; break;
        case 'slight-right': templateKey = 'slightRight'; break;
        case 'straight':     templateKey = 'continueStraight'; break;
        default:             templateKey = 'continueStraight'; break;
      }

      // Only emit step if there's a meaningful turn or a named landmark
      if (turn !== 'straight' || node.landmarks?.length) {
        steps.push({
          instruction: t(lang, templateKey, { landmark, distance: String(distToNext) }),
          distance: distToNext,
          waypoint: nodeToWaypoint(node),
          index: steps.length,
        });
      }
    } else {
      // Named place — always mention it
      steps.push({
        instruction: t(lang, 'passBy', { landmark }),
        distance: distToNext,
        waypoint: nodeToWaypoint(node),
        index: steps.length,
      });
    }
  }

  // Arrival step
  const dest = path[path.length - 1];
  steps.push({
    instruction: t(lang, 'arrive', { place: dest.name }),
    distance: 0,
    waypoint: nodeToWaypoint(dest),
    index: steps.length,
    isEnd: true,
  });

  // Re-index
  steps.forEach((s, i) => { s.index = i; });

  return steps;
}
