import { MapPin, ChevronDown, Bell, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const AppHeader = () => {
  const { user } = useAuth();
  const location = useLocation();
  const from = `${location.pathname}${location.search}`;

  // Fetch user profile avatar
  const { data: profile } = useQuery({
    queryKey: ['profile-avatar', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user,
  });

  return (
    <header className="h-14 bg-card border-b border-divider flex items-center justify-between px-5 sticky top-0 z-50">
      {/* Left: Location */}
      <div className="flex items-center gap-1.5">
        <MapPin className="w-5 h-5 text-brand-green" />
        <span className="text-sm font-medium text-foreground">Mumbai</span>
        <ChevronDown className="w-4 h-4 text-text-secondary" />
      </div>
      
      {/* Center: Logo */}
      <Link to="/">
        <h1 
          className="text-lg text-foreground"
          style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, letterSpacing: '0.15em' }}
        >
          FITKITS
        </h1>
      </Link>
      
      {/* Right: Notifications & Avatar */}
      <div className="flex items-center gap-3">
        <button className="relative">
          <Bell className="w-5 h-5 text-text-secondary" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-danger rounded-full"></span>
        </button>
        <Link
          to={user ? "/social/profile" : "/auth"}
          state={user ? undefined : { from }}
        >
          <div className="w-10 h-10 rounded-full bg-brand-soft flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-brand-green" />
            )}
          </div>
        </Link>
      </div>
    </header>
  );
};