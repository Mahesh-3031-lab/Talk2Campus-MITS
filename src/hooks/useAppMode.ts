import { useState, useEffect, useCallback } from 'react';

export type AppMode = 'student' | 'parent';
const STORAGE_KEY = 't2c_app_mode';

export const useAppMode = () => {
  const [mode, setModeState] = useState<AppMode>('student');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'parent' || stored === 'student') {
      setModeState(stored);
    }
    setIsLoaded(true);
  }, []);

  const setMode = useCallback((m: AppMode) => {
    setModeState(m);
    localStorage.setItem(STORAGE_KEY, m);
  }, []);

  return { mode, setMode, isLoaded };
};
