import { GraduationCap, BookOpen, Building2, Users, Calendar, HelpCircle, LucideIcon, ClipboardCheck, Bell, Clock, UtensilsCrossed } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TopicId } from "@/lib/topicContext";
import AttendanceIcon from "@/components/attendance/AttendanceIcon";

interface Feature {
  icon: LucideIcon | null;
  customIcon?: boolean;
  title: string;
  description: string;
  topicId?: TopicId;
  route?: string;
  highlighted?: boolean;
}

const features: Feature[] = [
  {
    icon: null,
    customIcon: true,
    title: "Attendance Tracker",
    description: "Check your GEMS-MITS attendance, subject-wise breakdown, and exam eligibility status.",
    route: "/attendance",
    highlighted: true,
  },
  {
    icon: UtensilsCrossed,
    title: "Canteen Orders",
    description: "Order food from campus canteens, track your order in real-time, and pick up when ready.",
    route: "/canteen",
    highlighted: true,
  },
  {
    icon: GraduationCap,
    title: "Admissions",
    description: "Get instant answers about admission procedures, eligibility criteria, and application deadlines.",
    topicId: "admissions",
  },
  {
    icon: BookOpen,
    title: "Courses & Programs",
    description: "Explore available courses, curriculum details, and specialization options across departments.",
    topicId: "courses",
  },
  {
    icon: Building2,
    title: "Campus Info",
    description: "Discover campus facilities, hostels, labs, libraries, and amenities available at MITS.",
    topicId: "campus",
  },
  {
    icon: Users,
    title: "Faculty & Staff",
    description: "Find information about faculty members, departments, and administrative contacts.",
    topicId: "faculty",
  },
  {
    icon: Calendar,
    title: "Events & Updates",
    description: "Live updates, notices, events, and announcements scraped directly from the official MITS website.",
    route: "/updates",
    highlighted: true,
  },
  {
    icon: HelpCircle,
    title: "Student Support",
    description: "Access guidance on scholarships, placements, internships, and student services.",
    topicId: "support",
  },
  {
    icon: Clock,
    title: "My Timetable",
    description: "Manage your class schedule and get proactive reminders before your next class.",
    route: "/timetable",
    highlighted: true,
  },
];

const FeaturesSection = () => {
  const navigate = useNavigate();

  const handleFeatureClick = (feature: Feature) => {
    if (feature.route) {
      navigate(feature.route);
    } else if (feature.topicId) {
      navigate(`/chat?topic=${feature.topicId}`);
    }
  };

  return (
    <section className="relative py-20 px-4 bg-gradient-to-b from-background to-muted/30">
      {/* Section Header */}
      <div className="text-center mb-16">
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
          How Can Talk2Campus Help You?
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Tap any topic below to start a conversation with your AI campus assistant
        </p>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <button
            key={feature.title}
            onClick={() => handleFeatureClick(feature)}
            className={`group glass rounded-2xl p-6 transition-all duration-300 hover:shadow-elegant hover:-translate-y-1 text-left cursor-pointer border ${
              feature.highlighted 
                ? 'border-primary/40 bg-gradient-to-br from-primary/10 to-primary-light/5 shadow-lg' 
                : 'border-transparent hover:border-primary/20 hover:bg-primary/5'
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Icon */}
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300 ${
              feature.highlighted 
                ? 'bg-gradient-to-br from-primary/20 to-primary-light/30' 
                : 'bg-primary/10 group-hover:bg-primary/20'
            }`}>
              {feature.customIcon ? (
                <AttendanceIcon className="w-8 h-8" />
              ) : feature.icon && (
                <feature.icon className="w-7 h-7 text-primary" />
              )}
            </div>

            {/* Content */}
            <h3 className="font-display text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
              {feature.title}
              {feature.highlighted && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                  New
                </span>
              )}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {feature.description}
            </p>

            {/* Tap hint */}
            <div className="mt-4 flex items-center gap-2 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Tap to explore</span>
              <span className="animate-bounce">→</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
