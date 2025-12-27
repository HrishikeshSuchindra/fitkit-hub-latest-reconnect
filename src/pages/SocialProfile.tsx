import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Users, LogOut, Settings, Edit2, Loader2, ArrowLeft, ChevronRight, HelpCircle, Mail, Info, Shield, FileText, UserCog, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditProfileSheet } from "@/components/profile/EditProfileSheet";
import { AppSettingsSheet } from "@/components/profile/AppSettingsSheet";
import { DeleteAccountSheet } from "@/components/profile/DeleteAccountSheet";
import { FriendsSection } from "@/components/profile/FriendsSection";
import { MyBookingsSection } from "@/components/profile/MyBookingsSection";
import { MyEventsSection } from "@/components/profile/MyEventsSection";

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
  const isSigningOut = useRef(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [isSigningOutLoading, setIsSigningOutLoading] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAppSettings, setShowAppSettings] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  
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

  useEffect(() => {
    if (location.state?.scrollToBookings) {
      setTimeout(() => {
        document.getElementById('my-bookings')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location.state]);

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
      <div className="relative bg-gradient-to-br from-chip-purple-text to-chip-purple-bg pt-8 pb-20">
        <div className="absolute top-4 left-4">
          <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

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
        </div>
      </div>
      
      <div className="px-5 -mt-10 space-y-5">
        {/* App & Account */}
        <div className="bg-card rounded-2xl shadow-soft p-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase mb-2">App & Account</h3>
          <MenuItem icon={Edit2} label="Edit Profile" onClick={() => setShowEditProfile(true)} />
          <MenuItem icon={Users} label="Friends" onClick={() => navigate("/friends")} />
          <MenuItem icon={Settings} label="App Settings" onClick={() => setShowAppSettings(true)} />
        </div>

        {/* My Activity */}
        <div className="bg-card rounded-2xl shadow-soft p-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase mb-2">My Activity</h3>
          <MenuItem icon={Bell} label="My Bookings" onClick={() => document.getElementById('my-bookings')?.scrollIntoView({ behavior: 'smooth' })} />
          <MenuItem icon={Users} label="My Events" onClick={() => {}} />
        </div>

        <MyBookingsSection />
        <MyEventsSection />
        <FriendsSection onNavigate={(section) => navigate(`/${section}`)} />

        {/* Support */}
        <div className="bg-card rounded-2xl shadow-soft p-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase mb-2">Support</h3>
          <MenuItem icon={HelpCircle} label="Help Centre" onClick={() => navigate("/help")} />
          <MenuItem icon={Mail} label="Contact Us" onClick={() => navigate("/contact")} />
          <MenuItem icon={Info} label="About Us" onClick={() => navigate("/about")} />
        </div>

        {/* Legal */}
        <div className="bg-card rounded-2xl shadow-soft p-4">
          <h3 className="font-bold text-sm text-muted-foreground uppercase mb-2">Legal</h3>
          <MenuItem icon={Shield} label="Privacy Policy" onClick={() => navigate("/privacy")} />
          <MenuItem icon={FileText} label="Terms of Service" onClick={() => navigate("/terms")} />
        </div>

        {/* Danger Zone */}
        <div className="bg-card rounded-2xl shadow-soft p-4">
          <MenuItem icon={UserCog} label="Delete Account" onClick={() => setShowDeleteAccount(true)} danger />
        </div>

        {/* Sign Out */}
        <Button
          onClick={() => setShowSignOutDialog(true)}
          disabled={isSigningOutLoading}
          className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground h-12"
        >
          {isSigningOutLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogOut className="w-4 h-4 mr-2" />}
          Sign Out
        </Button>
      </div>

      {/* Sheets & Dialogs */}
      <EditProfileSheet open={showEditProfile} onOpenChange={setShowEditProfile} profile={profile} />
      <AppSettingsSheet open={showAppSettings} onOpenChange={setShowAppSettings} />
      <DeleteAccountSheet open={showDeleteAccount} onOpenChange={setShowDeleteAccount} />

      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to sign out?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSigningOutLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut} disabled={isSigningOutLoading} className="bg-destructive">
              {isSigningOutLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing out...</> : "Sign out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SocialProfile;
