import { Skeleton } from "@/components/ui/skeleton";
import { TopicId, getTopicConfig } from "@/lib/topicContext";
import { GraduationCap, BookOpen, Building2, Users, Calendar, HelpCircle, LucideIcon } from "lucide-react";

interface TopicLoadingSkeletonProps {
  topic: TopicId;
}

const topicIcons: Record<TopicId, LucideIcon> = {
  admissions: GraduationCap,
  courses: BookOpen,
  campus: Building2,
  faculty: Users,
  events: Calendar,
  support: HelpCircle,
};

const TopicLoadingSkeleton = ({ topic }: TopicLoadingSkeletonProps) => {
  const topicConfig = getTopicConfig(topic);
  const Icon = topicIcons[topic];

  return (
    <div className="w-full space-y-4 animate-fade-in">
      {/* Topic Header */}
      <div className="flex items-center gap-3 p-4 glass rounded-xl">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary animate-pulse" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{topicConfig.title}</p>
          <p className="text-xs text-muted-foreground">Fetching latest information...</p>
        </div>
      </div>

      {/* User Message Skeleton */}
      <div className="ml-8 p-3 rounded-2xl bg-primary/80">
        <Skeleton className="h-4 w-3/4 bg-primary-foreground/20" />
        <Skeleton className="h-4 w-1/2 mt-2 bg-primary-foreground/20" />
      </div>

      {/* AI Response Skeleton */}
      <div className="mr-8 p-4 rounded-2xl bg-muted space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>
          <span className="text-xs text-muted-foreground">Talk2Campus is typing...</span>
        </div>
        
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        
        {/* Shimmer effect */}
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>

      {/* Loading indicator */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full glass">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
          <span className="text-xs text-muted-foreground">Loading from MITS website...</span>
        </div>
      </div>
    </div>
  );
};

export default TopicLoadingSkeleton;
