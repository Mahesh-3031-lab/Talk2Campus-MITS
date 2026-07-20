import { useState } from "react";
import { Eye, EyeOff, Lock, User, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AttendanceIcon from "./AttendanceIcon";

interface AttendanceLoginProps {
  onLogin: (rollNumber: string, password: string) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

const AttendanceLogin = ({ onLogin, onBack, isLoading, error }: AttendanceLoginProps) => {
  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rollNumber.trim() && password) {
      await onLogin(rollNumber.trim(), password);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="glass rounded-full p-3 hover:bg-primary/10 transition-all duration-300 group"
        >
          <ArrowLeft className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
        </button>
        <h1 className="font-display text-xl font-semibold text-foreground">Attendance Tracker</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo/Icon */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary-light/20 flex items-center justify-center shadow-elegant">
              <AttendanceIcon className="w-16 h-16" />
            </div>
            <div className="text-center">
              <h2 className="font-display text-2xl font-semibold text-foreground">GEMS-MITS Login</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Enter your credentials to view attendance
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Roll Number Field */}
            <div className="space-y-2">
              <Label htmlFor="rollNumber" className="text-foreground font-medium">
                Roll Number
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="rollNumber"
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                  placeholder="e.g., 21BD1A0501"
                  className="pl-12 h-12 rounded-xl border-input bg-background/80 backdrop-blur-sm focus:ring-2 focus:ring-primary"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your GEMS password"
                  className="pl-12 pr-12 h-12 rounded-xl border-input bg-background/80 backdrop-blur-sm focus:ring-2 focus:ring-primary"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-destructive text-sm text-center">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !rollNumber.trim() || !password}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-button transition-all duration-300"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                "View My Attendance"
              )}
            </Button>
          </form>

          {/* Privacy Notice */}
          <div className="glass rounded-xl p-4 border border-glass-border/30">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              🔒 <strong>Your privacy is protected.</strong> Credentials are sent securely and discarded immediately after authentication. We never store your password.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AttendanceLogin;
