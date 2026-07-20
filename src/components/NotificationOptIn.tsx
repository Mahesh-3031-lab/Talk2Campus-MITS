import { useState, useEffect, useCallback } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';

export default function NotificationOptIn() {
  const { permission, isSupported, requestPermission } = useNotificationPermission();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const prev = localStorage.getItem('notif-optin-dismissed');
    if (prev) setDismissed(true);
  }, []);

  const handleEnable = useCallback(async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      setDismissed(true);
      localStorage.setItem('notif-optin-dismissed', '1');
    }
  }, [requestPermission]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    localStorage.setItem('notif-optin-dismissed', '1');
  }, []);

  if (!isSupported || permission === 'granted' || permission === 'denied' || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-lg">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <BellRing className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Stay Updated</p>
          <p className="text-xs text-muted-foreground">Get notified about events, notices & announcements</p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-xs px-2">
            Later
          </Button>
          <Button size="sm" onClick={handleEnable} className="text-xs">
            Enable
          </Button>
        </div>
      </div>
    </div>
  );
}
