import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useSubmitReview, useUpdateReview, Review } from "@/hooks/useReviews";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venueId: string;
  venueName: string;
  existingReview?: Review | null;
}

export const ReviewDialog = ({
  open,
  onOpenChange,
  venueId,
  venueName,
  existingReview,
}: ReviewDialogProps) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);

  const submitReview = useSubmitReview();
  const updateReview = useUpdateReview();

  const isEditing = !!existingReview;
  const isSubmitting = submitReview.isPending || updateReview.isPending;

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || "");
    } else {
      setRating(5);
      setComment("");
    }
  }, [existingReview, open]);

  const handleSubmit = async () => {
    try {
      if (isEditing && existingReview) {
        await updateReview.mutateAsync({
          reviewId: existingReview.id,
          venueId,
          rating,
          comment,
        });
        toast.success("Review updated successfully!");
      } else {
        await submitReview.mutateAsync({
          venueId,
          rating,
          comment,
        });
        toast.success("Thanks for your review!");
      }
      onOpenChange(false);
    } catch (error: any) {
      if (error.message?.includes("duplicate")) {
        toast.error("You have already reviewed this venue");
      } else {
        toast.error("Failed to submit review");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Your Review" : `Review ${venueName}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">Your Rating</p>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          </div>
          <Textarea
            placeholder="Share your experience with this venue... (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="bg-muted border-0 min-h-[120px]"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground"
          >
            {isSubmitting ? "Submitting..." : isEditing ? "Update Review" : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
