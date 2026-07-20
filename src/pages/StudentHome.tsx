import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import ModeSwitcher from "@/components/ModeSwitcher";
import { useAppMode } from "@/hooks/useAppMode";
import { useEffect } from "react";

const StudentHome = () => {
  const { setMode } = useAppMode();

  useEffect(() => {
    setMode('student');
  }, [setMode]);

  return (
    <div className="relative min-h-screen animate-fade-in">
      <SEOHead
        title="Talk2Campus – MITS | AI Campus Companion"
        description="Your AI-powered campus companion at MITS. Navigate campus, track attendance, order food, check timetables, and get instant answers with voice AI."
        path="/student"
      />
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
      </main>
      <Footer />

      <ModeSwitcher
        current="student"
        className="bottom-auto right-auto top-32 left-4 z-40 border-2 border-primary bg-primary px-5 py-3 text-base font-semibold text-primary-foreground shadow-xl ring-4 ring-primary/40 animate-pulse hover:scale-105 hover:bg-primary/90 hover:ring-primary/60 transition-all"
      />
    </div>
  );
};

export default StudentHome;
