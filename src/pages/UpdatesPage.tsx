import { useState } from "react";
import SEOHead from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Bell, BellOff, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpdates } from "@/hooks/useUpdates";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import UpdateCard from "@/components/updates/UpdateCard";
import { useToast } from "@/hooks/use-toast";

const categories = [
  { key: 'all', label: 'All' },
  { key: 'event', label: 'Events' },
  { key: 'notice', label: 'Notices' },
  { key: 'academic', label: 'Academic' },
  { key: 'circular', label: 'Circulars' },
];

const UpdatesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updates, isLoading, isRefreshing, newCount, refreshUpdates, markAllSeen } = useUpdates();
  const { permission, isSupported, requestPermission } = useNotificationPermission();
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = activeFilter === 'all'
    ? updates
    : updates.filter(u => u.category === activeFilter);

  const handleNotificationToggle = async () => {
    if (permission === 'granted') {
      toast({ title: "Notifications Active", description: "You're already receiving notifications." });
      return;
    }
    const result = await requestPermission();
    if (result === 'granted') {
      toast({ title: "Notifications Enabled", description: "You'll be notified about new MITS updates." });
    } else {
      toast({ title: "Notifications Blocked", description: "Please enable notifications in your browser settings.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      <SEOHead title="Updates – MITS Campus News & Events" description="Stay updated with the latest events, notices, and academic updates from MITS campus." path="/updates" />
      {/* Header */}
      <header className="p-4 flex items-center justify-between gap-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="glass rounded-full p-3 hover:bg-primary/10 transition-all duration-300 group"
          >
            <ArrowLeft className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
          </button>
          <div>
            <h1 className="font-display text-lg font-semibold text-foreground">Updates & Events</h1>
            <p className="text-xs text-muted-foreground">
              {newCount > 0 ? `${newCount} new update${newCount > 1 ? 's' : ''}` : 'Latest from MITS'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSupported && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNotificationToggle}
              className="rounded-full"
              title={permission === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
            >
              {permission === 'granted' ? (
                <Bell className="w-5 h-5 text-primary" />
              ) : (
                <BellOff className="w-5 h-5" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshUpdates}
            disabled={isRefreshing}
            className="rounded-full"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      {/* Category Filters */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveFilter(cat.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeFilter === cat.key
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Mark all seen */}
      {newCount > 0 && (
        <div className="px-4 pb-2">
          <button
            onClick={markAllSeen}
            className="text-xs text-primary hover:underline"
          >
            Mark all as read
          </button>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="max-w-2xl mx-auto space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {activeFilter === 'all' 
                  ? 'No updates yet. Tap refresh to fetch the latest.' 
                  : `No ${activeFilter} updates found.`}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshUpdates}
                disabled={isRefreshing}
                className="mt-4 rounded-full"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Fetch Updates
              </Button>
            </div>
          ) : (
            filtered.map(update => (
              <UpdateCard key={update.id} update={update} />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default UpdatesPage;
