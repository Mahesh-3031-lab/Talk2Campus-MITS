import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const Index = () => {
  return (
    <div className="relative min-h-screen">
      <SEOHead
        title="Talk2Campus – MITS | AI Campus Companion"
        description="Your AI-powered campus companion at MITS. Navigate campus, track attendance, order food, check timetables, and get instant answers with voice AI."
        path="/"
      />
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
