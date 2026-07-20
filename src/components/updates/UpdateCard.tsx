import { Calendar, Megaphone, GraduationCap, Bell, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MitsUpdate } from "@/hooks/useUpdates";

const categoryConfig: Record<string, { icon: typeof Calendar; label: string; color: string }> = {
  event: { icon: Calendar, label: 'Event', color: 'bg-primary/10 text-primary' },
  notice: { icon: Megaphone, label: 'Notice', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  academic: { icon: GraduationCap, label: 'Academic', color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  circular: { icon: Bell, label: 'Circular', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  general: { icon: Megaphone, label: 'Update', color: 'bg-muted text-muted-foreground' },
};

interface UpdateCardProps {
  update: MitsUpdate;
}

const UpdateCard = ({ update }: UpdateCardProps) => {
  const config = categoryConfig[update.category] || categoryConfig.general;
  const Icon = config.icon;
  const timeAgo = getTimeAgo(update.published_at);

  return (
    <div className={cn(
      "glass rounded-xl p-4 border transition-all duration-300",
      update.is_new 
        ? "border-primary/30 bg-primary/5 shadow-md" 
        : "border-glass-border/30"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("rounded-lg p-2 flex-shrink-0", config.color)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", config.color)}>
              {config.label}
            </span>
            {update.is_new && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                NEW
              </span>
            )}
            <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo}</span>
          </div>
          <h4 className="font-medium text-sm text-foreground leading-snug">{update.title}</h4>
          {update.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{update.description}</p>
          )}
          {update.source_url && (
            <a
              href={update.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline mt-2"
            >
              <ExternalLink className="w-3 h-3" />
              View Source
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default UpdateCard;
