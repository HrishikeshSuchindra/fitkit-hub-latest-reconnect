import { Home, MapPin, Calendar, Users, ArrowLeft, Heart, Laptop, MessageCircle, Globe, Flower2, Disc3 } from "lucide-react";
import { NavLink } from "./NavLink";

type NavMode = "home" | "venues" | "events" | "social";

interface BottomNavProps {
  mode: NavMode;
}

export const BottomNav = ({ mode }: BottomNavProps) => {
  const homeNav = [
    { to: "/", label: "Home", icon: Home },
    { to: "/venues", label: "Venues", icon: MapPin },
    { to: "/events", label: "Events", icon: Calendar },
    { to: "/social", label: "Social", icon: Users },
  ];

  const venuesNav = [
    { to: "/", label: "Home", icon: Home },
    { to: "/venues/courts", label: "Courts", icon: Disc3 },
    { to: "/venues/recovery", label: "Recovery", icon: Heart },
    { to: "/venues/studio", label: "Studio", icon: Flower2 },
  ];

  const eventsNav = [
    { to: "/", label: "Home", icon: Home },
    { to: "/events/workshop", label: "Workshop", icon: Laptop },
  ];

  const socialNav = [
    { to: "/", label: "Home", icon: Home },
    { to: "/social/games", label: "Games", icon: Users },
    { to: "/social/chat", label: "Chat", icon: MessageCircle },
    { to: "/social/community", label: "Community", icon: Globe },
  ];

  const navItems = mode === "home" ? homeNav : 
                   mode === "venues" ? venuesNav : 
                   mode === "events" ? eventsNav : socialNav;

  return (
    <nav className="h-16 bg-card border-t border-divider fixed bottom-0 left-0 right-0 z-50">
      <div className="h-full flex items-center justify-around px-2">
        {navItems.map((item, index) => (
          <>
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-colors"
              activeClassName="text-brand-green"
            >
              {({ isActive }) => (
                <>
                  {mode !== "home" && item.to === "/" ? (
                    <ArrowLeft className={`w-5 h-5 ${isActive ? "text-brand-green" : "text-text-secondary"}`} />
                  ) : (
                    <item.icon className={`w-5 h-5 ${isActive ? "text-brand-green" : "text-text-secondary"}`} />
                  )}
                  <span className={`text-xs font-medium ${isActive ? "text-brand-green" : "text-text-secondary"}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
            {mode !== "home" && index === 0 && (
              <div className="h-10 w-px bg-divider mx-1" />
            )}
          </>
        ))}
      </div>
    </nav>
  );
};
