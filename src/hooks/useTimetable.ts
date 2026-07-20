import { useState, useEffect, useCallback } from 'react';
import {
  loadTimetable,
  addEntry,
  removeEntry,
  updateEntry,
  clearTimetable,
  getUpcomingClasses,
  buildTimetableContext,
  TimetableEntry,
  DayOfWeek,
  UpcomingClass,
} from '@/lib/timetable';

export function useTimetable() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingClass[]>([]);

  const refresh = useCallback(() => {
    const tt = loadTimetable();
    setEntries(tt.entries);
    setUpcoming(getUpcomingClasses(3));
  }, []);

  // Refresh on mount and every minute for upcoming classes
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const add = useCallback((entry: Omit<TimetableEntry, 'id'>) => {
    addEntry(entry);
    refresh();
  }, [refresh]);

  const remove = useCallback((id: string) => {
    removeEntry(id);
    refresh();
  }, [refresh]);

  const update = useCallback((id: string, updates: Partial<Omit<TimetableEntry, 'id'>>) => {
    updateEntry(id, updates);
    refresh();
  }, [refresh]);

  const clear = useCallback(() => {
    clearTimetable();
    refresh();
  }, [refresh]);

  const getAIContext = useCallback(() => {
    return buildTimetableContext();
  }, []);

  return { entries, upcoming, add, remove, update, clear, getAIContext, refresh };
}
