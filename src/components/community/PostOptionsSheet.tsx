import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { 
  Trash2, 
  Flag, 
  UserMinus, 
  Link, 
  Share2,
  Bookmark,
  BookmarkCheck
} from "lucide-react";
import { toast } from "sonner";

interface PostOptionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOwnPost: boolean;
  isSaved: boolean;
  onDelete: () => void;
  onToggleSave: () => void;
  onShare: () => void;
}

export const PostOptionsSheet = ({
  open,
  onOpenChange,
  isOwnPost,
  isSaved,
  onDelete,
  onToggleSave,
  onShare,
}: PostOptionsSheetProps) => {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
    onOpenChange(false);
  };

  const handleReport = () => {
    toast.success("Post reported. We'll review it shortly.");
    onOpenChange(false);
  };

  const handleUnfollow = () => {
    toast.success("You will no longer see posts from this user");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-8">
        <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6" />
        
        <div className="space-y-1">
          {isOwnPost && (
            <button
              onClick={() => {
                onDelete();
                onOpenChange(false);
              }}
              className="w-full flex items-center gap-4 px-4 py-3 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              <span className="font-medium">Delete post</span>
            </button>
          )}

          <button
            onClick={() => {
              onToggleSave();
              onOpenChange(false);
            }}
            className="w-full flex items-center gap-4 px-4 py-3 text-foreground hover:bg-muted rounded-xl transition-colors"
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-5 h-5" />
                <span className="font-medium">Remove from saved</span>
              </>
            ) : (
              <>
                <Bookmark className="w-5 h-5" />
                <span className="font-medium">Save post</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              onShare();
              onOpenChange(false);
            }}
            className="w-full flex items-center gap-4 px-4 py-3 text-foreground hover:bg-muted rounded-xl transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span className="font-medium">Share post</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-4 px-4 py-3 text-foreground hover:bg-muted rounded-xl transition-colors"
          >
            <Link className="w-5 h-5" />
            <span className="font-medium">Copy link</span>
          </button>

          {!isOwnPost && (
            <>
              <div className="h-px bg-border my-2" />
              
              <button
                onClick={handleUnfollow}
                className="w-full flex items-center gap-4 px-4 py-3 text-foreground hover:bg-muted rounded-xl transition-colors"
              >
                <UserMinus className="w-5 h-5" />
                <span className="font-medium">Unfollow this user</span>
              </button>

              <button
                onClick={handleReport}
                className="w-full flex items-center gap-4 px-4 py-3 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
              >
                <Flag className="w-5 h-5" />
                <span className="font-medium">Report post</span>
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
