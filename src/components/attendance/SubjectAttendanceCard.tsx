import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import type { SubjectAttendance } from "./AttendanceDisplay";

interface SubjectAttendanceCardProps {
  subject: SubjectAttendance;
  requiredPercentage?: number;
}

const SubjectAttendanceCard = ({ 
  subject, 
  requiredPercentage = 75 
}: SubjectAttendanceCardProps) => {
  const isLow = subject.percentage < requiredPercentage;
  
  // Calculate how many more classes needed to reach required percentage
  const classesNeeded = () => {
    if (!isLow) return 0;
    const { attended, total } = subject;
    // (attended + x) / (total + x) = requiredPercentage / 100
    // attended + x = (total + x) * requiredPercentage / 100
    // attended + x = total * requiredPercentage / 100 + x * requiredPercentage / 100
    // x - x * requiredPercentage / 100 = total * requiredPercentage / 100 - attended
    // x * (1 - requiredPercentage / 100) = total * requiredPercentage / 100 - attended
    // x = (total * requiredPercentage / 100 - attended) / (1 - requiredPercentage / 100)
    const x = (total * requiredPercentage / 100 - attended) / (1 - requiredPercentage / 100);
    return Math.ceil(Math.max(0, x));
  };

  return (
    <div className={cn(
      "glass rounded-xl p-4 border transition-all duration-300",
      isLow 
        ? "border-destructive/30 bg-destructive/5" 
        : "border-glass-border/30"
    )}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{subject.subjectName}</p>
          <p className="text-xs text-muted-foreground">{subject.subjectCode}</p>
        </div>
        <div className="text-right">
          <p className={cn(
            "text-lg font-bold",
            isLow ? "text-destructive" : "text-green-500"
          )}>
            {Math.round(subject.percentage)}%
          </p>
          <p className="text-xs text-muted-foreground">
            {subject.attended}/{subject.total} classes
          </p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="relative">
        <Progress 
          value={subject.percentage} 
          className={cn(
            "h-2.5",
            isLow ? "[&>div]:bg-destructive" : "[&>div]:bg-green-500"
          )}
        />
        {/* Required threshold marker */}
        <div 
          className="absolute top-0 h-2.5 w-0.5 bg-foreground/40"
          style={{ left: `${requiredPercentage}%` }}
        />
      </div>

      {/* Warning for low attendance */}
      {isLow && classesNeeded() > 0 && (
        <p className="text-xs text-destructive mt-2">
          ⚠️ Attend {classesNeeded()} more consecutive classes to reach {requiredPercentage}%
        </p>
      )}
    </div>
  );
};

export default SubjectAttendanceCard;
