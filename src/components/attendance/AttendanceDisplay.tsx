import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, LogOut, RefreshCw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import AttendanceProgressRing from "./AttendanceProgressRing";
import SubjectAttendanceCard from "./SubjectAttendanceCard";

export interface SubjectAttendance {
  subjectCode: string;
  subjectName: string;
  attended: number;
  total: number;
  percentage: number;
}

export interface AttendanceData {
  studentName: string;
  rollNumber: string;
  branch: string;
  semester: string;
  overallPercentage: number;
  subjects: SubjectAttendance[];
  lastUpdated: string;
  isDemo?: boolean;
  voiceSummary?: string;
}

interface AttendanceDisplayProps {
  data: AttendanceData;
  onLogout: () => void;
  onRefresh: () => void;
  onBack: () => void;
  isRefreshing: boolean;
  requiredPercentage?: number;
}

const AttendanceDisplay = ({
  data,
  onLogout,
  onRefresh,
  onBack,
  isRefreshing,
  requiredPercentage = 75,
}: AttendanceDisplayProps) => {
  const isEligible = data.overallPercentage >= requiredPercentage;
  const lowAttendanceSubjects = data.subjects.filter(s => s.percentage < requiredPercentage);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between gap-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="glass rounded-full p-3 hover:bg-primary/10 transition-all duration-300 group"
          >
            <ArrowLeft className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
          </button>
          <div>
            <h1 className="font-display text-lg font-semibold text-foreground">Attendance</h1>
            <p className="text-xs text-muted-foreground">{data.studentName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="rounded-full"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Demo Mode Banner */}
          {data.isDemo && (
            <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-accent-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Demo Mode</p>
                <p className="text-xs text-muted-foreground mt-1">
                  College portal is currently unreachable. Showing sample data for demonstration.
                  Live data will appear automatically once the portal is back online.
                </p>
              </div>
            </div>
          )}
          <div className="glass rounded-2xl p-6 border border-glass-border/30 shadow-elegant">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Progress Ring */}
              <AttendanceProgressRing 
                percentage={data.overallPercentage} 
                size={140}
                strokeWidth={10}
              />
              
              {/* Info */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Overall Attendance
                </h2>
                <div className="text-muted-foreground text-sm space-y-1">
                  <p><strong>Roll No:</strong> {data.rollNumber}</p>
                  <p><strong>Branch:</strong> {data.branch}</p>
                  <p><strong>Semester:</strong> {data.semester}</p>
                </div>
                
                {/* Eligibility Status */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  isEligible 
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                    : 'bg-destructive/10 text-destructive'
                }`}>
                  {isEligible ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Eligible for Exams</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Below Required {requiredPercentage}%</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Low Attendance Warning */}
          {lowAttendanceSubjects.length > 0 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Attention Required
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You have {lowAttendanceSubjects.length} subject{lowAttendanceSubjects.length > 1 ? 's' : ''} below the required {requiredPercentage}% attendance. 
                  Please attend classes regularly to improve your attendance.
                </p>
              </div>
            </div>
          )}

          {/* Subject-wise Attendance */}
          <div className="space-y-3">
            <h3 className="font-display text-lg font-semibold text-foreground px-1">
              Subject-wise Attendance
            </h3>
            <div className="grid gap-3">
              {data.subjects.map((subject) => (
                <SubjectAttendanceCard 
                  key={subject.subjectCode}
                  subject={subject}
                  requiredPercentage={requiredPercentage}
                />
              ))}
            </div>
          </div>

          {/* Last Updated */}
          <p className="text-center text-xs text-muted-foreground">
            Last updated: {data.lastUpdated}
          </p>
        </div>
      </main>
    </div>
  );
};

export default AttendanceDisplay;
