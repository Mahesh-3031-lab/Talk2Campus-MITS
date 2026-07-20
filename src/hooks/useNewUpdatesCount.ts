import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useNewUpdatesCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Initial fetch
    const fetchCount = async () => {
      try {
        const { count: total, error } = await supabase
          .from('mits_updates')
          .select('*', { count: 'exact', head: true })
          .eq('is_new', true);
        if (!error && total !== null) setCount(total);
      } catch {
        // silently fail
      }
    };

    fetchCount();

    // Realtime: increment on INSERT, re-fetch on UPDATE
    const channel = supabase
      .channel('new-updates-count')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mits_updates' },
        () => setCount(prev => prev + 1)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'mits_updates' },
        () => fetchCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return count;
}
