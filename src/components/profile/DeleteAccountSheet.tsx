import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface DeleteAccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountSheet({ open, onOpenChange }: DeleteAccountSheetProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"warning" | "confirm">("warning");
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    if (!user) return;

    setDeleting(true);

    try {
      // Delete user data from profiles
      await supabase.from("profiles").delete().eq("user_id", user.id);
      
      // Delete user bookings
      await supabase.from("bookings").delete().eq("user_id", user.id);
      
      // Delete friendships
      await supabase
        .from("friendships")
        .delete()
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      
      // Delete push tokens
      await supabase.from("push_tokens").delete().eq("user_id", user.id);
      
      // Delete notifications
      await supabase.from("notifications").delete().eq("user_id", user.id);

      // Sign out
      await signOut();
      
      toast.success("Account deleted successfully");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account. Please contact support.");
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setStep("warning");
    setConfirmText("");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Delete Account
          </SheetTitle>
          <SheetDescription>
            Permanently delete your account and all data
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {step === "warning" ? (
            <>
              <div className="bg-destructive/10 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">This action cannot be undone</p>
                  <p className="text-xs text-muted-foreground">
                    Deleting your account will permanently remove:
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                    <li>Your profile and personal information</li>
                    <li>All your bookings and history</li>
                    <li>Your friends list and connections</li>
                    <li>Event registrations and participation</li>
                    <li>All messages and chat history</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setStep("confirm")}
                >
                  Continue
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  To confirm deletion, please type <span className="font-bold text-foreground">DELETE</span> in the box below:
                </p>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="Type DELETE"
                  className="bg-muted border-0"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep("warning")}>
                  Go Back
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDelete}
                  disabled={confirmText !== "DELETE" || deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete My Account"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
