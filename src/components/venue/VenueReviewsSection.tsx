import { useState } from "react";
import { Star, Edit2, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useReviews, useUserReview, useDeleteReview, Review } from "@/hooks/useReviews";
import { useAuth } from "@/hooks/useAuth";
import { ReviewDialog } from "./ReviewDialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface VenueReviewsSectionProps {
  venueId: string;
  venueName: string;
  rating: number | null;
  reviewsCount: number | null;
}

export const VenueReviewsSection = ({
  venueId,
  venueName,
  rating,
  reviewsCount,
}: VenueReviewsSectionProps) => {
  const { user } = useAuth();
  const { data: reviews, isLoading } = useReviews(venueId);
  const { data: userReview } = useUserReview(venueId);
  const deleteReview = useDeleteReview();

  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (!userReview) return;
    try {
      await deleteReview.mutateAsync({
        reviewId: userReview.id,
        venueId,
      });
      toast.success("Review deleted");
      setShowDeleteConfirm(false);
    } catch (error) {
      toast.error("Failed to delete review");
    }
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= count
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  const renderReviewCard = (review: Review, isUserReview: boolean = false) => {
    const profile = review.profile;
    const displayName = profile?.display_name || profile?.username || "Anonymous";
    const avatarUrl = profile?.avatar_url;

    return (
      <div
        key={review.id}
        className={`p-4 rounded-xl ${
          isUserReview ? "bg-primary/5 border border-primary/20" : "bg-muted"
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback>
                <User className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">
                {displayName}
                {isUserReview && (
                  <span className="text-xs text-primary ml-2">(You)</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
          {isUserReview && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowReviewDialog(true)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="mt-2">{renderStars(review.rating)}</div>
        {review.comment && (
          <p className="mt-2 text-sm text-text-secondary">{review.comment}</p>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-4 border-t border-border">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  const otherReviews = reviews?.filter((r) => r.user_id !== user?.id) || [];
  const hasReviews = (reviews?.length || 0) > 0;

  return (
    <div className="space-y-4 py-4 border-t border-border">
      {/* Header with rating summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Reviews</h3>
          <div className="flex items-center gap-2 mt-1">
            {renderStars(Math.round(rating || 0))}
            <span className="font-semibold text-foreground">
              {rating?.toFixed(1) || "0.0"}
            </span>
            <span className="text-sm text-muted-foreground">
              ({reviewsCount || 0} {reviewsCount === 1 ? "review" : "reviews"})
            </span>
          </div>
        </div>
        {user && !userReview && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReviewDialog(true)}
            className="border-primary text-primary"
          >
            Write a Review
          </Button>
        )}
      </div>

      {/* User's own review */}
      {userReview && renderReviewCard(userReview, true)}

      {/* Other reviews */}
      {otherReviews.length > 0 ? (
        <div className="space-y-3">
          {otherReviews.slice(0, 5).map((review) => renderReviewCard(review))}
          {otherReviews.length > 5 && (
            <Button variant="ghost" className="w-full text-primary">
              View all {otherReviews.length} reviews
            </Button>
          )}
        </div>
      ) : !userReview ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No reviews yet</p>
          {user && (
            <Button
              variant="link"
              onClick={() => setShowReviewDialog(true)}
              className="text-primary"
            >
              Be the first to review!
            </Button>
          )}
        </div>
      ) : null}

      {/* Not logged in prompt */}
      {!user && !hasReviews && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No reviews yet. Sign in to leave a review!</p>
        </div>
      )}

      {/* Review Dialog */}
      <ReviewDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        venueId={venueId}
        venueName={venueName}
        existingReview={userReview}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your review? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {deleteReview.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
