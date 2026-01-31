import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Trash2, User } from "lucide-react";
import { usePostComments, useAddComment, useDeleteComment, PostComment } from "@/hooks/useCommunityPosts";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface CommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string | null;
  postAuthorUsername?: string;
}

export const CommentsSheet = ({
  open,
  onOpenChange,
  postId,
  postAuthorUsername,
}: CommentsSheetProps) => {
  const { user } = useAuth();
  const { data: comments, isLoading } = usePostComments(postId);
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  
  const [newComment, setNewComment] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !postId) return;
    
    await addComment.mutateAsync({ postId, content: newComment.trim() });
    setNewComment("");
  };

  const handleDelete = async (commentId: string) => {
    if (!postId) return;
    await deleteComment.mutateAsync({ commentId, postId });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="text-center">Comments</SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col h-[calc(100%-120px)]">
          {/* Comments List */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {isLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </>
            ) : comments && comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 group">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.author?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {comment.author?.display_name?.[0] || <User className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-semibold text-sm text-foreground">
                          {comment.author?.username || "user"}
                        </span>
                        <span className="text-sm text-foreground ml-2">
                          {comment.content}
                        </span>
                      </div>
                      {user?.id === comment.author_id && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No comments yet</p>
                <p className="text-sm mt-1">Be the first to comment!</p>
              </div>
            )}
          </div>

          {/* Add Comment Input */}
          {user ? (
            <form onSubmit={handleSubmit} className="border-t border-border pt-4 flex gap-3 items-center">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {user.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={`Add a comment${postAuthorUsername ? ` for ${postAuthorUsername}` : ""}...`}
                className="flex-1 border-0 bg-muted"
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                disabled={!newComment.trim() || addComment.isPending}
                className="text-primary"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
          ) : (
            <div className="border-t border-border pt-4 text-center text-muted-foreground text-sm">
              Sign in to comment
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
