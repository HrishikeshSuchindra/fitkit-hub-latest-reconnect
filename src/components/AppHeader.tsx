import { MapPin, ChevronDown, Bell, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const AppHeader = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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

  // Fetch unread notifications count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-notifications', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <header className="h-14 bg-card border-b border-divider flex items-center justify-between px-5 sticky top-0 z-50">
      {/* Left: Location */}
      <div className="flex items-center gap-1.5">
        <MapPin className="w-5 h-5 text-brand-green" />
        <span className="text-sm font-medium text-foreground">Chennai</span>
        <ChevronDown className="w-4 h-4 text-text-secondary" />
      </div>
      
      {/* Center: Logo */}
      <Link to="/" className="flex flex-col items-center">
        <h1 
          className="text-lg text-foreground"
          style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, letterSpacing: '0.15em' }}
        >
          FITKITS
        </h1>
        <span 
          className="text-[7px] text-text-secondary tracking-[0.15em] uppercase -mt-0.5"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          wellness reimagined +
        </span>
      </Link>
      
      {/* Right: Notifications & Avatar */}
      <div className="flex items-center gap-3">
        <button className="relative" onClick={() => navigate('/notifications')}>
          <Bell className="w-5 h-5 text-text-secondary" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-brand-danger rounded-full text-[10px] text-white font-medium flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
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
