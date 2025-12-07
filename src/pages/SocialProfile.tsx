import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Users, Share2, LogOut, Settings, Edit2, Calendar, MapPin, Clock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserBookings } from "@/hooks/useBookings";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface Profile {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  games_played: number;
  friends_count: number;
}

const SocialProfile = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Fetch profile from database
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });

  // Fetch user bookings from database
  const { data: bookings = [], isLoading: loadingBookings } = useUserBookings();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Scroll to bookings section if coming from reminder popup
    if (location.state?.scrollToBookings) {
      setTimeout(() => {
        document.getElementById('my-bookings')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location.state]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate("/");
  };

  const friends = [
    { name: "Rahul Sharma", status: "online", time: "2m ago" },
    { name: "Priya Patel", status: "online", time: "5m ago" },
    { name: "Amit Desai", status: "offline", time: "2h ago" },
    { name: "Sneha Reddy", status: "offline", time: "1d ago" },
  ];

  // Format slot time for display
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };


  if (loading || loadingProfile || loadingBookings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      {/* Profile Header with Gradient */}
      <div className="relative bg-gradient-to-br from-chip-purple-text to-chip-purple-bg pt-8 pb-20">
        {/* Settings & Logout */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <Settings className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-soft flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="w-12 h-12 text-brand-green" />
              )}
            </div>
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          
          {/* User Info */}
          <h2 className="mt-4 text-2xl font-bold text-white">
            {profile?.display_name || user?.email?.split('@')[0] || 'User'}
          </h2>
          <p className="text-white/80 text-sm">
            @{profile?.username || user?.email?.split('@')[0] || 'user'}
          </p>
          
          {/* Bio */}
          {profile?.bio && (
            <p className="text-white/70 text-sm mt-2 max-w-xs text-center">
              {profile.bio}
            </p>
          )}
          
          {/* Stats */}
          <div className="flex gap-8 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{profile?.games_played || 0}</p>
              <p className="text-xs text-white/70">Games</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{profile?.friends_count || 0}</p>
              <p className="text-xs text-white/70">Friends</p>
            </div>
          </div>
          
          {/* Edit Button */}
          <Button className="mt-4 bg-white text-chip-purple-text hover:bg-white/90 rounded-full px-6">
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-5 -mt-10 space-y-5">
        {/* My Bookings Section */}
        <div id="my-bookings" className="bg-card rounded-2xl shadow-soft p-4">
          <h3 className="font-bold text-lg text-foreground mb-4">My Bookings</h3>
          
          {bookings.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="w-10 h-10 text-text-tertiary mx-auto mb-2" />
              <p className="text-text-secondary text-sm">No bookings yet</p>
              <Button 
                variant="outline" 
                className="mt-3 text-brand-green border-brand-green"
                onClick={() => navigate("/venues/courts")}
              >
                Book a Court
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div 
                  key={booking.id}
                  className="bg-muted rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{booking.sport || 'Sports'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(booking.slot_date), "EEEE, MMM do")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{formatTime(booking.slot_time)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">{booking.venue_name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-primary font-bold">₹{booking.price}</span>
                    <div className="mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        booking.visibility === 'public' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-[hsl(var(--chip-purple-bg))] text-[hsl(var(--chip-purple-text))]'
                      }`}>
                        {booking.visibility === 'public' ? 'Public' : 'Friends'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Friends List Card */}
        <div className="bg-card rounded-2xl shadow-soft p-4">
          <h3 className="font-bold text-lg text-foreground mb-4">Friends</h3>
          
          {/* Online Friends */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-text-secondary uppercase mb-2">Online</p>
            {friends.filter(f => f.status === "online").map((friend, idx) => (
              <div key={idx} className="flex items-center gap-3 py-2">
                <div className="relative">
                  <div className="w-10 h-10 bg-brand-soft rounded-full flex items-center justify-center">
                    <span className="text-brand-green font-bold text-sm">{friend.name[0]}</span>
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{friend.name}</p>
                  <p className="text-xs text-text-tertiary">{friend.time}</p>
                </div>
                <Button className="bg-brand-green hover:bg-brand-green/90 text-white h-8 px-4 text-xs rounded-lg">
                  Invite
                </Button>
              </div>
            ))}
          </div>
          
          {/* Offline Friends */}
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase mb-2">Offline</p>
            {friends.filter(f => f.status === "offline").map((friend, idx) => (
              <div key={idx} className="flex items-center gap-3 py-2">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-text-secondary font-bold text-sm">{friend.name[0]}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{friend.name}</p>
                  <p className="text-xs text-text-tertiary">{friend.time}</p>
                </div>
                <Button variant="outline" className="h-8 px-4 text-xs rounded-lg">
                  Message
                </Button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Invite CTA Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <h3 className="text-xl font-bold mb-2">Invite More Friends</h3>
          <p className="text-sm text-white/80 mb-4">Play together and earn rewards</p>
          <Button className="bg-white text-blue-600 hover:bg-white/90 rounded-full px-6 font-semibold">
            <Share2 className="w-4 h-4 mr-2" />
            Share Invite Code
          </Button>
        </div>
      </div>
      
      <BottomNav mode="social" />
    </div>
  );
};

export default SocialProfile;
