import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Lock, Eye, EyeOff, Loader2, UtensilsCrossed, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CanteenLoginProps {
  onLogin: (rollNumber: string, password: string) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

export default function CanteenLogin({ onLogin, onBack, isLoading, error }: CanteenLoginProps) {
  const navigate = useNavigate();
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rollNumber.trim() && password.trim()) {
      onLogin(rollNumber.trim(), password.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      <header className="p-4 flex items-center gap-3">
        <button onClick={onBack} className="glass rounded-full p-3 hover:bg-primary/10 transition-all group">
          <ArrowLeft className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
        </button>
        <h1 className="font-display text-lg font-semibold text-foreground">Canteen Orders</h1>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo */}
          <div className="text-center space-y-3">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
              <UtensilsCrossed className="w-10 h-10 text-orange-500" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">Campus Food</h2>
              <p className="text-sm text-muted-foreground">Login with your GEMS credentials</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Roll Number</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={rollNumber}
                  onChange={e => setRollNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. 22671A0501"
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="GEMS password"
                  className="w-full h-12 pl-10 pr-12 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !rollNumber.trim() || !password.trim()}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold text-base shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Authenticating...
                </>
              ) : (
                'Login & Order Food'
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            Your password is never stored. It&apos;s only used to verify your identity.
          </p>

          <button
            onClick={() => navigate('/canteen/vendor')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border hover:bg-muted/50 transition-colors text-sm text-muted-foreground hover:text-foreground"
          >
            <Store className="w-4 h-4" />
            Are you a vendor? Go to Vendor Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
