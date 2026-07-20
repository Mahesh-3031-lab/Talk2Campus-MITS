import { cn } from "@/lib/utils";

interface AttendanceProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const AttendanceProgressRing = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  className,
}: AttendanceProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  // Color based on percentage
  const getColor = () => {
    if (percentage >= 75) return "text-green-500";
    if (percentage >= 60) return "text-yellow-500";
    return "text-destructive";
  };

  const getBgColor = () => {
    if (percentage >= 75) return "text-green-500/10";
    if (percentage >= 60) return "text-yellow-500/10";
    return "text-destructive/10";
  };

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={getBgColor()}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(getColor(), "transition-all duration-700 ease-out")}
        />
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-bold", getColor())}>
          {Math.round(percentage)}%
        </span>
        <span className="text-xs text-muted-foreground">Attendance</span>
      </div>
    </div>
  );
};

export default AttendanceProgressRing;
