import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

/**
 * Subscribes to realtime INSERT events on mits_updates.
 * Shows in-app toast + browser notification for each new update.
 */
export function useRealtimeUpdates() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const seenIds = useRef(new Set<string>());

  useEffect(() => {
    const channel = supabase
      .channel('live-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mits_updates',
        },
        (payload) => {
          const update = payload.new as {
            id: string;
            title: string;
            category: string;
            description?: string;
          };

          // Deduplicate
          if (seenIds.current.has(update.id)) return;
          seenIds.current.add(update.id);

          // Category label
          const categoryLabel = update.category === 'event' ? '🎉 Event'
            : update.category === 'notice' ? '📋 Notice'
            : update.category === 'circular' ? '📄 Circular'
            : update.category === 'academic' ? '📚 Academic'
            : '🔔 Update';

          // In-app toast
          toast({
            title: `${categoryLabel}: ${update.title}`,
            description: update.description?.slice(0, 100) || 'Tap to view details',
            action: undefined,
          });

          // Browser notification
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const notif = new Notification(`Talk2Campus - ${categoryLabel}`, {
              body: update.title,
              icon: '/pwa-192x192.png',
              tag: update.id,
            });
            notif.onclick = () => {
              window.focus();
              navigate('/updates');
            };
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast, navigate]);
}
