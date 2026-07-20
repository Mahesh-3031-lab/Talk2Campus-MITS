import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GraduationCap, Users, ArrowRight } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { useAppMode } from "@/hooks/useAppMode";
import mitsLogo from "@/assets/mits-logo.jpeg";

const ModeLanding = () => {
  const navigate = useNavigate();
  const { mode, setMode, isLoaded } = useAppMode();
  const [params] = useSearchParams();
  const forceChoose = params.get('choose') === '1';

  // Auto-redirect returning users unless they explicitly want to choose
  useEffect(() => {
    if (!isLoaded || forceChoose) return;
    const stored = localStorage.getItem('t2c_app_mode');
    if (stored === 'student') navigate('/student', { replace: true });
    else if (stored === 'parent') navigate('/parent', { replace: true });
  }, [isLoaded, forceChoose, navigate]);

  const choose = (m: 'student' | 'parent') => {
    setMode(m);
    navigate(`/${m}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-primary/10">
      <SEOHead
        title="Talk2Campus — Choose Your Experience"
        description="Pick Student Mode for full campus tools or Parent Mode for a voice-first AI campus receptionist."
        path="/"
      />

      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16">
        <div className="mb-12 flex flex-col items-center text-center">
          <img src={mitsLogo} alt="MITS" className="mb-4 h-16 w-16 rounded-2xl object-contain shadow-elegant" />
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Welcome to Talk2Campus
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground md:text-lg">
            Choose how you'd like to experience the MITS campus.
          </p>
        </div>

        <div className="grid w-full gap-6 md:grid-cols-2">
          <button
            onClick={() => choose('parent')}
            className="group relative flex flex-col items-start gap-4 overflow-hidden rounded-3xl border border-primary/20 bg-card/70 p-8 text-left shadow-elegant backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground">Parent Mode</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Talk with an AI campus assistant in your language and get real-time campus guidance.
              </p>
            </div>
            <div className="mt-auto flex items-center gap-2 text-sm font-medium text-primary">
              Start talking <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </button>

          <button
            onClick={() => choose('student')}
            className="group relative flex flex-col items-start gap-4 overflow-hidden rounded-3xl border border-primary/20 bg-card/70 p-8 text-left shadow-elegant backdrop-blur transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground">Student Mode</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Access campus services, attendance, events, canteen, and student tools.
              </p>
            </div>
            <div className="mt-auto flex items-center gap-2 text-sm font-medium text-primary">
              Continue <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          Built by a student at MITS · kmaheshbabu733@gmail.com
        </p>
      </main>
    </div>
  );
};

export default ModeLanding;
