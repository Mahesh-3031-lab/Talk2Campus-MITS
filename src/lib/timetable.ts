/**
 * Timetable data model and localStorage persistence.
 * Offline-first — no auth required.
 */

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface TimetableEntry {
  id: string;
  day: DayOfWeek;
  startTime: string;   // "09:00" 24h format
  endTime: string;      // "10:00"
  subject: string;
  room: string;         // e.g. "Room 305"
  building: string;     // e.g. "KK Block"
  teacher?: string;
}

export interface Timetable {
  entries: TimetableEntry[];
  lastUpdated: number;
}

const STORAGE_KEY = 'campus-timetable';

export function loadTimetable(): Timetable {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { entries: [], lastUpdated: Date.now() };
    return JSON.parse(raw);
  } catch {
    return { entries: [], lastUpdated: Date.now() };
  }
}

export function saveTimetable(timetable: Timetable): void {
  timetable.lastUpdated = Date.now();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timetable));
  } catch {
    // localStorage full
  }
}

export function addEntry(entry: Omit<TimetableEntry, 'id'>): TimetableEntry {
  const tt = loadTimetable();
  const newEntry: TimetableEntry = { ...entry, id: crypto.randomUUID() };
  tt.entries.push(newEntry);
  saveTimetable(tt);
  return newEntry;
}

export function removeEntry(id: string): void {
  const tt = loadTimetable();
  tt.entries = tt.entries.filter(e => e.id !== id);
  saveTimetable(tt);
}

export function updateEntry(id: string, updates: Partial<Omit<TimetableEntry, 'id'>>): void {
  const tt = loadTimetable();
  const entry = tt.entries.find(e => e.id === id);
  if (entry) {
    Object.assign(entry, updates);
    saveTimetable(tt);
  }
}

export function clearTimetable(): void {
  saveTimetable({ entries: [], lastUpdated: Date.now() });
}

/** Get today's day name */
export function getTodayDay(): DayOfWeek {
  const days: DayOfWeek[] = ['Sunday' as DayOfWeek, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = days[new Date().getDay()];
  return DAYS.includes(d) ? d : 'Monday';
}

/** Parse "HH:MM" to minutes since midnight */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Get current time in minutes since midnight */
function nowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export interface UpcomingClass {
  entry: TimetableEntry;
  minutesUntil: number;
  isOngoing: boolean;
}

/** Get upcoming classes for today, sorted by start time */
export function getUpcomingClasses(limit = 3): UpcomingClass[] {
  const tt = loadTimetable();
  const today = getTodayDay();
  const now = nowMinutes();

  const todayEntries = tt.entries
    .filter(e => e.day === today)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const results: UpcomingClass[] = [];

  for (const entry of todayEntries) {
    const start = timeToMinutes(entry.startTime);
    const end = timeToMinutes(entry.endTime);
    const isOngoing = now >= start && now < end;
    const minutesUntil = start - now;

    // Show ongoing or upcoming (within next 4 hours)
    if (isOngoing || (minutesUntil > 0 && minutesUntil <= 240)) {
      results.push({ entry, minutesUntil: isOngoing ? 0 : minutesUntil, isOngoing });
    }

    if (results.length >= limit) break;
  }

  return results;
}

/** Build AI context string from timetable */
export function buildTimetableContext(): string {
  const upcoming = getUpcomingClasses(3);
  if (upcoming.length === 0) return '';

  const parts: string[] = ['STUDENT SCHEDULE CONTEXT:'];

  for (const { entry, minutesUntil, isOngoing } of upcoming) {
    if (isOngoing) {
      parts.push(`Currently in: ${entry.subject} at ${entry.room}, ${entry.building} (until ${entry.endTime})`);
    } else {
      parts.push(`Next class in ${minutesUntil} min: ${entry.subject} at ${entry.room}, ${entry.building} (${entry.startTime})`);
    }
  }

  return parts.join('\n');
}

/** Format time for display */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

// ─── Cloud Sync (additive) ───────────────────────────────────────────────────
import { supabase } from '@/integrations/supabase/client';

export async function syncTimetableToCloud(rollNumber: string): Promise<void> {
  if (!rollNumber?.trim()) return;
  const local = loadTimetable();
  try {
    await supabase.from('student_timetables' as any).upsert({
      roll_number: rollNumber.toUpperCase(),
      entries: local.entries,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'roll_number' });
  } catch (err) {
    console.warn('[timetable] Cloud sync failed (non-critical):', err);
  }
}

export async function loadTimetableFromCloud(rollNumber: string): Promise<void> {
  if (!rollNumber?.trim()) return;
  try {
    const { data } = await supabase
      .from('student_timetables' as any)
      .select('entries, updated_at')
      .eq('roll_number', rollNumber.toUpperCase())
      .maybeSingle();

    if (!data || !(data as any).entries) return;

    const local = loadTimetable();
    const cloudUpdatedAt = new Date((data as any).updated_at as string).getTime();

    if (cloudUpdatedAt > local.lastUpdated) {
      saveTimetable({
        entries: (data as any).entries as TimetableEntry[],
        lastUpdated: cloudUpdatedAt,
      });
    }
  } catch (err) {
    console.warn('[timetable] Cloud load failed (non-critical):', err);
  }
}

