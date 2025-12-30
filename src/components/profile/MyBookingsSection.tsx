import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, RotateCcw, MessageSquare, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserBookings, useCancelBooking } from "@/hooks/useBookings";
import { format, isPast, isToday, isTomorrow, differenceInHours } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function MyBookingsSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: bookings = [], isLoading } = useUserBookings();
  const cancelBooking = useCancelBooking();
  
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const [showCancel, setShowCancel] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [refundInfo, setRefundInfo] = useState<{ percentage: number; amount: number } | null>(null);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };

  const getDateHighlight = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "bg-green-500/10 text-green-600";
    if (isTomorrow(date)) return "bg-primary/10 text-primary";
    if (isPast(date)) return "bg-muted text-muted-foreground";
    return "bg-blue-500/10 text-blue-600";
  };

  const handleBookAgain = (booking: any) => {
    navigate(`/venue/${booking.venue_id}`);
  };

  const handleFeedback = (bookingId: string) => {
    setSelectedBooking(bookingId);
    setShowFeedback(true);
  };

  const handleCancelClick = (booking: any) => {
    const bookingDateTime = new Date(`${booking.slot_date}T${booking.slot_time}`);
    const now = new Date();
    const hoursUntil = differenceInHours(bookingDateTime, now);

    // Calculate refund
    let percentage = 0;
    if (hoursUntil >= 24) percentage = 100;
    else if (hoursUntil >= 12) percentage = 75;
    else if (hoursUntil >= 6) percentage = 50;
    else if (hoursUntil >= 2) percentage = 25;

    setRefundInfo({
      percentage,
      amount: (booking.price * percentage) / 100,
    });
    setCancellingBookingId(booking.id);
    setCancelReason("");
    setShowCancel(true);
  };

  const confirmCancel = () => {
    if (!cancellingBookingId) return;

    cancelBooking.mutate(
      { bookingId: cancellingBookingId, reason: cancelReason },
      {
        onSuccess: () => {
          setShowCancel(false);
          setCancellingBookingId(null);
          setCancelReason("");
          setRefundInfo(null);
        },
        onError: () => {
          // Error is handled in the hook
        },
      }
    );
  };

  const submitFeedback = async () => {
    if (!user || !selectedBooking) return;
    
    const booking = bookings.find(b => b.id === selectedBooking);
    if (!booking) return;

    setSubmitting(true);

    try {
      const { error } = await supabase.from("reviews").insert({
        user_id: user.id,
        venue_id: booking.venue_id,
        booking_id: selectedBooking,
        rating: rating,
        comment: feedback,
      });

      if (error) throw error;

      toast.success("Thanks for your feedback!");
      setShowFeedback(false);
      setFeedback("");
      setRating(5);
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const canCancel = (booking: any) => {
    if (booking.status !== "confirmed") return false;
    const bookingDateTime = new Date(`${booking.slot_date}T${booking.slot_time}`);
    return bookingDateTime > new Date();
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl shadow-soft p-4">
        <h3 className="font-bold text-lg text-foreground mb-4">My Bookings</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div id="my-bookings" className="bg-card rounded-2xl shadow-soft p-4">
        <h3 className="font-bold text-lg text-foreground mb-4">My Bookings</h3>

        {bookings.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No bookings yet</p>
            <Button
              variant="outline"
              className="mt-3 text-primary border-primary"
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
                className={`bg-muted rounded-xl p-4 ${booking.status === "cancelled" ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{booking.sport || "Sports"}</p>
                    <p className="text-xs text-muted-foreground truncate">{booking.venue_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {booking.status === "cancelled" && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-600 font-medium">
                        Cancelled
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDateHighlight(booking.slot_date)}`}>
                      {getDateLabel(booking.slot_date)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(booking.slot_date), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(booking.slot_time)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-primary font-bold">₹{booking.price}</span>
                  <div className="flex gap-2">
                    {booking.status === "confirmed" && canCancel(booking) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleCancelClick(booking)}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => handleBookAgain(booking)}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Book Again
                    </Button>
                    {isPast(new Date(booking.slot_date)) && booking.status !== "cancelled" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs text-primary"
                        onClick={() => handleFeedback(booking.id)}
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Feedback
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Booking Dialog */}
      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {refundInfo && (
              <div className={`p-4 rounded-lg ${refundInfo.percentage > 0 ? "bg-green-50" : "bg-yellow-50"}`}>
                <p className={`font-semibold ${refundInfo.percentage > 0 ? "text-green-700" : "text-yellow-700"}`}>
                  {refundInfo.percentage > 0 
                    ? `Refund: ₹${refundInfo.amount} (${refundInfo.percentage}%)`
                    : "No refund for late cancellations"
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {refundInfo.percentage === 100 && "Full refund for cancellations 24+ hours before"}
                  {refundInfo.percentage === 75 && "75% refund for cancellations 12-24 hours before"}
                  {refundInfo.percentage === 50 && "50% refund for cancellations 6-12 hours before"}
                  {refundInfo.percentage === 25 && "25% refund for cancellations 2-6 hours before"}
                  {refundInfo.percentage === 0 && "Cancellations less than 2 hours before are non-refundable"}
                </p>
              </div>
            )}
            <Textarea
              placeholder="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="bg-muted border-0 min-h-[80px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancel(false)}>
              Keep Booking
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmCancel} 
              disabled={cancelBooking.isPending}
            >
              {cancelBooking.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancel Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Rating</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-transform ${
                      star <= rating ? "text-yellow-500 scale-110" : "text-muted-foreground"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              placeholder="Tell us about your experience..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="bg-muted border-0 min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeedback(false)}>
              Cancel
            </Button>
            <Button onClick={submitFeedback} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}