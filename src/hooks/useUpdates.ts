import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MitsUpdate {
  id: string;
  title: string;
  description: string | null;
  category: string;
  source_url: string | null;
  image_url: string | null;
  event_date: string | null;
  published_at: string;
  is_new: boolean;
  created_at: string;
}

const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useUpdates() {
  const { toast } = useToast();
  const [updates, setUpdates] = useState<MitsUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchUpdates = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('mits-events', {
        body: { action: 'fetch' },
      });
      if (error) throw error;
      if (data?.updates) {
        setUpdates(data.updates);
        setNewCount(data.updates.filter((u: MitsUpdate) => u.is_new).length);
      }
    } catch (err) {
      console.error('Failed to fetch updates:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUpdates = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('mits-events', {
        body: { action: 'refresh' },
      });
      if (error) throw error;
      if (data?.updates) {
        setUpdates(data.updates);
        setNewCount(data.updates.filter((u: MitsUpdate) => u.is_new).length);
        if (data.newCount > 0) {
          toast({
            title: "New Updates Available",
            description: `${data.newCount} new update${data.newCount > 1 ? 's' : ''} from MITS.`,
          });
          // Send browser notification if permitted
          if (Notification.permission === 'granted') {
            new Notification('MITS Talk2Campus', {
              body: `${data.newCount} new update${data.newCount > 1 ? 's' : ''} available`,
              icon: '/favicon.ico',
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to refresh updates:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [toast]);

  const markAllSeen = useCallback(async () => {
    try {
      await supabase.functions.invoke('mits-events', {
        body: { action: 'mark_seen' },
      });
      setUpdates(prev => prev.map(u => ({ ...u, is_new: false })));
      setNewCount(0);
    } catch (err) {
      console.error('Failed to mark seen:', err);
    }
  }, []);

  // Initial fetch + auto-refresh
  useEffect(() => {
    fetchUpdates();
    intervalRef.current = setInterval(refreshUpdates, AUTO_REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchUpdates, refreshUpdates]);

  return { updates, isLoading, isRefreshing, newCount, refreshUpdates, markAllSeen };
}
