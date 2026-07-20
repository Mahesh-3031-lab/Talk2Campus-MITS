import { useNavigate } from "react-router-dom";
import { Bell, BookOpen, UtensilsCrossed } from "lucide-react";
import { useTimetable } from "@/hooks/useTimetable";
import mitsLogo from "@/assets/mits-logo.jpeg";
import { useNewUpdatesCount } from "@/hooks/useNewUpdatesCount";

const Navbar = () => {
  const navigate = useNavigate();
  const newCount = useNewUpdatesCount();

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="glass mx-4 mt-4 rounded-2xl px-6 py-4 md:mx-8 md:px-8">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Title */}
          <div className="flex items-center gap-3">
            <img 
              src={mitsLogo} 
              alt="MITS Logo" 
              className="h-10 w-10 object-contain md:h-12 md:w-12"
            />
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                Talk2Campus
              </span>
              <span className="text-xs font-medium text-primary md:text-sm">
                MITS
              </span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Canteen */}
            <button
              onClick={() => navigate('/canteen')}
              className="relative p-2 rounded-full hover:bg-primary/10 transition-colors"
              aria-label="Canteen orders"
            >
              <UtensilsCrossed className="w-5 h-5 text-orange-500" />
            </button>

            {/* Timetable */}
            <button
              onClick={() => navigate('/timetable')}
              className="relative p-2 rounded-full hover:bg-primary/10 transition-colors"
              aria-label="My timetable"
            >
              <BookOpen className="w-5 h-5 text-foreground" />
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => navigate('/updates')}
              className="relative p-2 rounded-full hover:bg-primary/10 transition-colors"
              aria-label="View updates"
            >
              <Bell className="w-5 h-5 text-foreground" />
              {newCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm">
                  {newCount > 9 ? '9+' : newCount}
                </span>
              )}
            </button>

            {/* College Name - Desktop */}
            <div className="hidden text-right md:block">
              <h2 className="font-display text-lg font-semibold tracking-tight text-foreground lg:text-xl">
                Madanapalle Institute of Technology and Science
              </h2>
              <p className="text-xs text-muted-foreground">
                Deemed to be{" "}
                <span className="text-sm font-medium text-foreground">
                  University
                </span>
              </p>
            </div>

            {/* Mobile - Abbreviated */}
            <div className="text-right md:hidden">
              <h2 className="font-display text-sm font-semibold text-foreground">
                MITS
              </h2>
              <p className="text-xs text-muted-foreground">University</p>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
