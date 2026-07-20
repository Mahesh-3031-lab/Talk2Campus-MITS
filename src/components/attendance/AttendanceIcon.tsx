import { cn } from "@/lib/utils";

interface AttendanceIconProps {
  className?: string;
  percentage?: number;
}

const AttendanceIcon = ({ className, percentage }: AttendanceIconProps) => {
  const strokeDasharray = 100;
  const strokeDashoffset = percentage !== undefined ? 100 - percentage : 25;

  return (
    <div className={cn("relative", className)}>
      {/* Circular Progress Ring */}
      <svg 
        viewBox="0 0 36 36" 
        className="w-full h-full transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx="18"
          cy="18"
          r="15.915"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx="18"
          cy="18"
          r="15.915"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="text-primary transition-all duration-500"
        />
      </svg>
      {/* Checkmark in center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg 
          viewBox="0 0 24 24" 
          className="w-1/2 h-1/2 text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      </div>
    </div>
  );
};

export default AttendanceIcon;
