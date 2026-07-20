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
        className="bottom-auto right-auto top-24 left-4 border-primary bg-primary text-primary-foreground shadow-elegant ring-2 ring-primary/30 animate-pulse hover:bg-primary/90"
      />
    </div>
  );
};

export default StudentHome;
