import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Bell, Moon, Trash2, Loader2 } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AppSettings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { isSubscribed: notificationsEnabled, subscribe, isLoading: notifLoading } = usePushNotifications();
  const { user, signOut } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);

    try {
      // Delete user data from profiles
      await supabase.from('profiles').delete().eq('user_id', user.id);
      await supabase.from('bookings').delete().eq('user_id', user.id);
      await supabase.from('event_registrations').delete().eq('user_id', user.id);
      
      // Sign out
      await signOut();
      toast.success("Account deleted successfully");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete account");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 pt-4 pb-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold ml-2">App Settings</h1>
        </div>

        <div className="space-y-4">
          {/* Notifications */}
          <Card className="p-4 shadow-md">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-muted-foreground" />
              Notifications
            </h3>
            
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Push Notifications</p>
                <p className="text-xs text-muted-foreground">Get notified about bookings</p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={() => subscribe()}
                disabled={notifLoading}
              />
            </div>
          </Card>

          {/* Appearance */}
          <Card className="p-4 shadow-md">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Moon className="w-5 h-5 text-muted-foreground" />
              Appearance
            </h3>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Switch between light and dark</p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-4 shadow-md border-destructive/20">
            <h3 className="font-semibold text-destructive mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Danger Zone
            </h3>
            
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete Account
            </Button>
          </Card>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account, bookings, and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting} className="bg-destructive text-white">
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AppSettings;
