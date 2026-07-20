import { useState, useCallback, useEffect } from 'react';
import {
  recordUserAction,
  getRecentPlaces,
  getFrequentPlaces,
  getPredictiveSuggestions,
  buildMemoryContext,
  resolveToGraphNodeId,
  clearUserMemory,
  NodeType,
} from '@/lib/campusMemory';

export interface MemoryPlace {
  id: string;
  name: string;
  type: NodeType;
  lastVisited?: number;
  visitCount: number;
}

export function useGraphMemory() {
  const [recentPlaces, setRecentPlaces] = useState<MemoryPlace[]>([]);
  const [frequentPlaces, setFrequentPlaces] = useState<MemoryPlace[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const refresh = useCallback(() => {
    setRecentPlaces(getRecentPlaces(5));
    setFrequentPlaces(getFrequentPlaces(5));
    setSuggestions(getPredictiveSuggestions(4));
  }, []);

  // Refresh on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  const recordVisit = useCallback((name: string, type: NodeType = 'building') => {
    const id = resolveToGraphNodeId(name);
    recordUserAction('visited', id, name, type);
    refresh();
  }, [refresh]);

  const recordSearch = useCallback((name: string, type: NodeType = 'building') => {
    const id = resolveToGraphNodeId(name);
    recordUserAction('searched', id, name, type);
    refresh();
  }, [refresh]);

  const recordNavigation = useCallback((name: string, type: NodeType = 'building') => {
    const id = resolveToGraphNodeId(name);
    recordUserAction('navigated_to', id, name, type);
    refresh();
  }, [refresh]);

  const getAIContext = useCallback(() => {
    return buildMemoryContext();
  }, []);

  const clearMemory = useCallback(() => {
    clearUserMemory();
    refresh();
  }, [refresh]);

  return {
    recentPlaces,
    frequentPlaces,
    suggestions,
    recordVisit,
    recordSearch,
    recordNavigation,
    getAIContext,
    clearMemory,
    refresh,
  };
}
