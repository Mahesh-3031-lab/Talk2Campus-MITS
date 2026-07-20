import { useState, useCallback } from "react";
import SEOHead from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import AttendanceLogin from "@/components/attendance/AttendanceLogin";
import AttendanceDisplay, { AttendanceData } from "@/components/attendance/AttendanceDisplay";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { checkRateLimit, sanitizeRollNumber } from "@/lib/security";

type AttendanceView = "login" | "display";

const AttendancePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [view, setView] = useState<AttendanceView>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);

  const handleLogin = useCallback(async (rollNumber: string, password: string) => {
    if (!checkRateLimit('attendance_login', 5, 60_000)) {
      setError('Too many login attempts. Please wait a minute before trying again.');
      return;
    }
    const cleanRoll = sanitizeRollNumber(rollNumber);
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('gems-attendance', {
        body: { 
          action: 'login',
          rollNumber: cleanRoll,
          password,
        },
      });

      if (fnError) {
        // For non-2xx responses, data may still contain the error message from the edge function
        const errorMessage = data?.error || fnError.message || 'Authentication failed';
        setError(errorMessage);
        return;
      }

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.success && data.sessionToken && data.attendance) {
        setSessionToken(data.sessionToken);
        setAttendanceData(data.attendance);
        setView("display");
        toast({
          title: data.isDemo ? "Demo Mode" : "Login Successful",
          description: data.isDemo
            ? "Portal is offline. Showing sample data."
            : `Welcome, ${data.attendance.studentName}!`,
        });
      } else {
        setError("Invalid response from server. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Failed to authenticate. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleRefresh = useCallback(async () => {
    if (!sessionToken) return;
    
    setIsRefreshing(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('gems-attendance', {
        body: { 
          action: 'refresh',
          sessionToken,
        },
      });

      if (fnError) throw fnError;

      if (data.attendance) {
        setAttendanceData(data.attendance);
        toast({
          title: "Refreshed",
          description: "Attendance data updated.",
        });
      }
    } catch (err) {
      console.error("Refresh error:", err);
      toast({
        title: "Refresh Failed",
        description: "Could not update attendance. Please try logging in again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [sessionToken, toast]);

  const handleLogout = useCallback(() => {
    setSessionToken(null);
    setAttendanceData(null);
    setView("login");
    setError(null);
    toast({
      title: "Logged Out",
      description: "Your session has been cleared.",
    });
  }, [toast]);

  const handleBack = useCallback(() => {
    if (view === "display") {
      handleLogout();
    } else {
      navigate(-1);
    }
  }, [view, navigate, handleLogout]);

  const seo = <SEOHead title="Attendance – Track Your Classes at MITS" description="Check your attendance records and track class participation at MITS." path="/attendance" />;

  if (view === "display" && attendanceData) {
    return (
      <>
        {seo}
        <AttendanceDisplay
          data={attendanceData}
          onLogout={handleLogout}
          onRefresh={handleRefresh}
          onBack={handleBack}
          isRefreshing={isRefreshing}
        />
      </>
    );
  }

  return (
    <>
      {seo}
      <AttendanceLogin
        onLogin={handleLogin}
        onBack={() => navigate(-1)}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
};

export default AttendancePage;
