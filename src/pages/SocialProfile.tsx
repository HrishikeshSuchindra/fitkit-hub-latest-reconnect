import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Users, LogOut, Settings, Edit2, Loader2, ArrowLeft, ChevronRight, ChevronDown, HelpCircle, Mail, Info, Shield, FileText, Calendar, CalendarDays, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EditProfileSheet } from "@/components/profile/EditProfileSheet";
import { AppSettingsSheet } from "@/components/profile/AppSettingsSheet";

interface Profile {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  games_played: number;
  friends_count: number;
}

// Badge tiers based on games played
const getBadgeTier = (gamesPlayed: number) => {
  if (gamesPlayed >= 100) return { name: "Champion", color: "bg-yellow-500", icon: "🏆" };
  if (gamesPlayed >= 50) return { name: "Pro", color: "bg-purple-500", icon: "⭐" };
  if (gamesPlayed >= 25) return { name: "Regular", color: "bg-blue-500", icon: "🎯" };
  if (gamesPlayed >= 10) return { name: "Active", color: "bg-green-500", icon: "🔥" };
  return { name: "Starter", color: "bg-gray-500", icon: "🌱" };
};

const SocialProfile = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isSigningOut = useRef(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [isSigningOutLoading, setIsSigningOutLoading] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [appSettingsOpen, setAppSettingsOpen] = useState(false);
  
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

  useEffect(() => {
    if (!loading && !user && !isSigningOut.current) {
      navigate("/auth", { replace: true, state: { from: "/" } });
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    setIsSigningOutLoading(true);
    isSigningOut.current = true;
    try {
      await signOut();
      toast({ title: "Signed out", description: "You have been successfully signed out." });
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Sign out error:", error);
      setIsSigningOutLoading(false);
      isSigningOut.current = false;
    }
    setShowSignOutDialog(false);
  };

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  const MenuItem = ({ icon: Icon, label, onClick, danger }: { icon: any; label: string; onClick: () => void; danger?: boolean }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between py-3 px-1 border-b border-border last:border-0 ${danger ? 'text-destructive' : 'text-foreground'}`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${danger ? 'text-destructive' : 'text-muted-foreground'}`} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );

  const badge = getBadgeTier(profile?.games_played || 0);

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Profile Header */}
      <div className="px-5 pt-4 pb-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="icon" className="text-foreground" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground ml-2">Profile</h1>
        </div>

        <Card className="bg-gradient-to-br from-chip-purple-text to-chip-purple-bg p-6 shadow-lg border-0">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 bg-card rounded-full border-4 border-white shadow-soft flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-12 h-12 text-primary" />
                )}
              </div>
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full" />
            </div>
            
            <h2 className="mt-4 text-2xl font-bold text-white">{profile?.display_name || user?.email?.split('@')[0] || 'User'}</h2>
            <p className="text-white/80 text-sm">@{profile?.username || user?.email?.split('@')[0] || 'user'}</p>
            {profile?.bio && <p className="text-white/70 text-sm mt-2 max-w-xs text-center">{profile.bio}</p>}
            
            <div className="flex gap-8 mt-4 items-end">
              {/* Badge */}
              <div className="text-center">
                <div className={`w-10 h-10 ${badge.color} rounded-full flex items-center justify-center text-xl mx-auto`}>
                  {badge.icon}
                </div>
                <p className="text-xs text-white/70 mt-1">{badge.name}</p>
              </div>
              {/* Friends */}
              <div className="text-center">
                <p className="text-2xl font-bold text-white leading-none">{profile?.friends_count || 0}</p>
                <p className="text-xs text-white/70 mt-1">Friends</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      <div className="px-5 space-y-4">
        {/* Account & Connections */}
        <Card className="shadow-md border-0 bg-card p-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase mb-2">Account & Connections</h3>
          
          {/* Edit Profile Collapsible */}
          <Collapsible open={editProfileOpen} onOpenChange={setEditProfileOpen}>
            <CollapsibleTrigger className="w-full flex items-center justify-between py-3 px-1 border-b border-border">
              <div className="flex items-center gap-3">
                <Edit2 className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">Edit Profile</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${editProfileOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <EditProfileSheet open={editProfileOpen} onOpenChange={setEditProfileOpen} profile={profile} />
            </CollapsibleContent>
          </Collapsible>
          
          {/* App Settings Collapsible */}
          <Collapsible open={appSettingsOpen} onOpenChange={setAppSettingsOpen}>
            <CollapsibleTrigger className="w-full flex items-center justify-between py-3 px-1 border-b border-border">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">App Settings</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${appSettingsOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <AppSettingsSheet open={appSettingsOpen} onOpenChange={setAppSettingsOpen} />
            </CollapsibleContent>
          </Collapsible>
          
          <MenuItem icon={Users} label="Friends" onClick={() => navigate("/profile/friends")} />
        </Card>

        {/* My Activity */}
        <Card className="shadow-md border-0 bg-card p-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase mb-2">My Activity</h3>
          <MenuItem icon={Calendar} label="My Bookings" onClick={() => navigate("/profile/bookings")} />
          <MenuItem icon={CalendarDays} label="My Events" onClick={() => navigate("/profile/events")} />
        </Card>

        {/* Support */}
        <Card className="shadow-md border-0 bg-card p-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase mb-2">Support</h3>
          <MenuItem icon={HelpCircle} label="Help Centre" onClick={() => navigate("/help")} />
          <MenuItem icon={Mail} label="Contact Us" onClick={() => navigate("/contact")} />
          <MenuItem icon={Info} label="About Us" onClick={() => navigate("/about")} />
        </Card>

        {/* Legal */}
        <Card className="shadow-md border-0 bg-card p-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase mb-2">Legal</h3>
          <MenuItem icon={Shield} label="Privacy Policy" onClick={() => navigate("/privacy")} />
          <MenuItem icon={FileText} label="Terms of Service" onClick={() => navigate("/terms")} />
        </Card>

        {/* Sign Out */}
        <Button
          onClick={() => setShowSignOutDialog(true)}
          disabled={isSigningOutLoading}
          className="w-full bg-destructive hover:bg-destructive/90 text-white h-12"
        >
          {isSigningOutLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogOut className="w-4 h-4 mr-2" />}
          Sign Out
        </Button>
      </div>

      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to sign out?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSigningOutLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut} disabled={isSigningOutLoading} className="bg-destructive text-white">
              {isSigningOutLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing out...</> : "Sign out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SocialProfile;
