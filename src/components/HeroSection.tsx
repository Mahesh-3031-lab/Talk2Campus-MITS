import { Sparkles, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import mitsLogo from "@/assets/mits-logo.jpeg";
import { useNewUpdatesCount } from "@/hooks/useNewUpdatesCount";

const HeroSection = () => {
  const navigate = useNavigate();
  const newCount = useNewUpdatesCount();

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* Background gradient waves */}
      <div className="absolute inset-0 wave-bg" />
      
      {/* Animated glow orbs */}
      <div className="hero-glow -left-20 -top-20 h-96 w-96 animate-pulse-glow" />
      <div className="hero-glow -bottom-20 -right-20 h-80 w-80 animate-pulse-glow" style={{ animationDelay: '1s' }} />
      <div className="hero-glow left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 animate-pulse-glow" style={{ animationDelay: '2s' }} />

      {/* Wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 opacity-30">
        <svg
          viewBox="0 0 1440 320"
          className="absolute bottom-0 h-full w-full animate-wave"
          preserveAspectRatio="none"
        >
          <path
            fill="hsl(217 91% 50% / 0.1)"
            d="M0,192L48,176C96,160,192,128,288,133.3C384,139,480,181,576,186.7C672,192,768,160,864,154.7C960,149,1056,171,1152,181.3C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
        <svg
          viewBox="0 0 1440 320"
          className="absolute bottom-0 h-full w-full animate-wave"
          style={{ animationDelay: '2s' }}
          preserveAspectRatio="none"
        >
          <path
            fill="hsl(210 100% 60% / 0.08)"
            d="M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,181.3C672,181,768,171,864,181.3C960,192,1056,224,1152,234.7C1248,245,1344,235,1392,229.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Logo container with glow */}
        <div className="relative mb-8 animate-float">
          {/* Glow ring behind logo */}
          <div className="absolute -inset-4 rounded-full bg-primary/20 blur-2xl" />
          <div className="absolute -inset-8 rounded-full bg-primary-glow/10 blur-3xl" />
          
          {/* Logo circle */}
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-card shadow-elegant md:h-40 md:w-40">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/5 to-primary/10" />
            <div className="absolute inset-1 rounded-full border border-primary/10" />
            <img 
              src={mitsLogo} 
              alt="MITS College Logo" 
              className="h-24 w-24 object-contain md:h-32 md:w-32"
            />
          </div>
        </div>

        {/* College name */}
        <h1 className="mb-2 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl lg:text-4xl">
          Madanapalle Institute of Technology & Science
        </h1>
        <p className="mb-12 text-sm text-muted-foreground md:text-base">
          Deemed to be University
        </p>

        {/* Talk2Campus Button */}
        <button 
          onClick={() => navigate("/chat")}
          className="btn-talk2campus group flex items-center gap-3"
        >
          <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" />
          <span className="tracking-wide">TALK2CAMPUS</span>
          <Sparkles className="h-5 w-5 transition-transform group-hover:-rotate-12" />
        </button>

        {/* Subtitle */}
        <p className="mt-6 max-w-md text-sm text-muted-foreground">
          Your AI-powered campus companion for seamless university interactions
        </p>

        {/* Updates Banner */}
        {newCount > 0 && (
          <button
            onClick={() => navigate('/updates')}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm text-primary hover:bg-primary/20 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span>{newCount} new update{newCount > 1 ? 's' : ''} available</span>
            <span className="animate-bounce">→</span>
          </button>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
