import { Home, MapPin, Calendar, Users, ArrowLeft, Heart, Laptop, MessageCircle, Globe, Flower2, Gamepad2, Coffee, PartyPopper } from "lucide-react";
import { NavLink } from "./NavLink";
import { CourtsIcon } from "./icons/CourtsIcon";
import { RecoveryIcon } from "./icons/RecoveryIcon";

type NavMode = "home" | "venues" | "social" | "hub";

interface BottomNavProps {
  mode: NavMode;
}

export const BottomNav = ({ mode }: BottomNavProps) => {
  const homeNav = [
    { to: "/", label: "Home", icon: Home },
    { to: "/venues", label: "Venues", icon: MapPin },
    { to: "/social", label: "Social", icon: PartyPopper },
    { to: "/hub", label: "Hub", icon: Users },
  ];

  const venuesNav = [
    { to: "/", label: "Home", icon: Home },
    { to: "/venues/courts", label: "Courts", icon: CourtsIcon, isCustom: true },
    { to: "/venues/recovery", label: "Recovery", icon: RecoveryIcon, isCustom: true },
    { to: "/venues/studio", label: "Studio", icon: Flower2 },
  ];

  const socialNav = [
    { to: "/", label: "Home", icon: Home },
    { to: "/social", label: "Events", icon: PartyPopper },
    { to: "/social/host", label: "Host", icon: Coffee },
  ];

  const hubNav = [
    { to: "/", label: "Home", icon: Home },
    { to: "/hub/games", label: "Games", icon: Gamepad2 },
    { to: "/hub/chat", label: "Chat", icon: MessageCircle },
    { to: "/hub/community", label: "Community", icon: Globe },
  ];

  const navItems = mode === "home" ? homeNav : 
                   mode === "venues" ? venuesNav : 
                   mode === "social" ? socialNav : hubNav;

  // Determine default active route for each mode
  const getDefaultRoute = () => {
    switch (mode) {
      case "venues": return "/venues/courts";
      case "social": return "/social";
      case "hub": return "/hub/games";
      default: return "/";
    }
  };

  return (
    <nav className="h-16 bg-card border-t border-divider fixed bottom-0 left-0 right-0 z-50">
      <div className="h-full flex items-center justify-around px-2">
        {navItems.map((item, index) => {
          const IconComponent = item.icon;
          const isCustomIcon = 'isCustom' in item && item.isCustom;
          
          return (
            <>
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/" || item.to === getDefaultRoute()}
                className="flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 active:scale-[0.97]"
              >
                {({ isActive }) => (
                  <>
                    <div className="p-1.5 transition-all duration-200">
                      {mode !== "home" && item.to === "/" ? (
                        <ArrowLeft className={`w-5 h-5 transition-all duration-200 ${isActive ? "text-brand-green drop-shadow-[0_0_3px_hsl(var(--brand-primary-green)/0.5)]" : "text-text-secondary"}`} />
                      ) : (
                        <IconComponent className={`w-5 h-5 transition-all duration-200 ${isActive ? "text-brand-green drop-shadow-[0_0_3px_hsl(var(--brand-primary-green)/0.5)]" : "text-text-secondary"}`} />
                      )}
                    </div>
                    <span className={`text-xs transition-all duration-200 ${isActive ? "text-brand-green font-semibold" : "text-text-secondary font-medium"}`}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
              {mode !== "home" && index === 0 && (
                <div className="h-10 w-px bg-divider mx-1" />
              )}
            </>
          );
        })}
      </div>
    </nav>
  );
};