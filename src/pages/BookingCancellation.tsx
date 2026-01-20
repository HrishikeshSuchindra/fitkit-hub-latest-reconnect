import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, MapPin, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useBookingById, useCancelBooking } from "@/hooks/useBookings";
import { format, differenceInHours } from "date-fns";

const BookingCancellation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const { data: booking, isLoading } = useBookingById(bookingId);
  const cancelBooking = useCancelBooking();

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getRefundInfo = () => {
    if (!booking) return { percentage: 0, amount: 0 };
    
    const bookingDateTime = new Date(`${booking.slot_date}T${booking.slot_time}`);
    const now = new Date();
    const hoursUntil = differenceInHours(bookingDateTime, now);

    let percentage = 0;
    if (hoursUntil >= 24) percentage = 100;
    else if (hoursUntil >= 12) percentage = 75;
    else if (hoursUntil >= 6) percentage = 50;
    else if (hoursUntil >= 2) percentage = 25;

    return {
      percentage,
      amount: (booking.price * percentage) / 100,
      hoursUntil,
    };
  };

  const handleCancel = () => {
    if (!bookingId) return;

    cancelBooking.mutate(
      { bookingId, reason },
      {
        onSuccess: () => {
          setConfirmed(true);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="flex flex-col items-center justify-center h-[60vh] px-5">
          <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-lg font-semibold text-foreground mb-2">Booking Not Found</p>
          <p className="text-sm text-muted-foreground text-center mb-4">
            This booking may have already been cancelled or doesn't exist.
          </p>
          <Button onClick={() => navigate("/profile")}>Go to Profile</Button>
        </div>
        <BottomNav mode="home" />
      </div>
    );
  }

  if (booking.status === "cancelled") {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="flex flex-col items-center justify-center h-[60vh] px-5">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
          <p className="text-lg font-semibold text-foreground mb-2">Already Cancelled</p>
          <p className="text-sm text-muted-foreground text-center mb-4">
            This booking has already been cancelled.
          </p>
          <Button onClick={() => navigate("/profile")}>Go to Profile</Button>
        </div>
        <BottomNav mode="home" />
      </div>
    );
  }

  if (confirmed) {
    const refundInfo = getRefundInfo();
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="flex flex-col items-center justify-center h-[60vh] px-5">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <p className="text-xl font-bold text-foreground mb-2">Booking Cancelled</p>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Your booking at {booking.venue_name} has been cancelled.
          </p>
          {refundInfo.percentage > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-6 w-full max-w-sm">
              <p className="text-center text-green-700 dark:text-green-400 font-semibold">
                Refund: ₹{refundInfo.amount} ({refundInfo.percentage}%)
              </p>
              <p className="text-center text-xs text-muted-foreground mt-1">
                Will be credited within 5-7 business days
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/profile")}>
              View Bookings
            </Button>
            <Button onClick={() => navigate(`/venue/${booking.venue_id}`)}>
              Book Again
            </Button>
          </div>
        </div>
        <BottomNav mode="home" />
      </div>
    );
  }

  const refundInfo = getRefundInfo();
  const bookingDateTime = new Date(`${booking.slot_date}T${booking.slot_time}`);
  const canCancel = bookingDateTime > new Date() && booking.status === "confirmed";

  if (!canCancel) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="flex flex-col items-center justify-center h-[60vh] px-5">
          <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-lg font-semibold text-foreground mb-2">Cannot Cancel</p>
          <p className="text-sm text-muted-foreground text-center mb-4">
            This booking cannot be cancelled as it has already started or passed.
          </p>
          <Button onClick={() => navigate("/profile")}>Go to Profile</Button>
        </div>
        <BottomNav mode="home" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <AppHeader />
      
      <div className="px-5 py-4 space-y-5">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">Cancel Booking</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review cancellation details below
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-card rounded-xl shadow-soft p-4 space-y-4">
          <div className="flex items-start gap-3">
            {booking.venue_image && (
              <img 
                src={booking.venue_image} 
                alt={booking.venue_name} 
                className="w-20 h-20 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <p className="font-semibold text-foreground">{booking.sport || "Sports"}</p>
              <p className="text-sm text-muted-foreground">{booking.venue_name}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm font-medium">{format(new Date(booking.slot_date), "EEE, MMM d")}</p>
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="text-sm font-medium">{formatTime(booking.slot_time)}</p>
              </div>
            </div>
          </div>

          {booking.venue_address && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{booking.venue_address}</span>
            </div>
          )}

          <div className="pt-2 border-t border-divider flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Booking Amount</span>
            <span className="font-bold text-foreground">₹{booking.price}</span>
          </div>
        </div>

        {/* Refund Policy */}
        <div className="bg-card rounded-xl shadow-soft p-4">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            Refund Policy
          </h3>
          
          <div className={`p-4 rounded-lg mb-4 ${
            refundInfo.percentage > 50 
              ? "bg-green-50 dark:bg-green-900/20" 
              : refundInfo.percentage > 0 
                ? "bg-yellow-50 dark:bg-yellow-900/20" 
                : "bg-red-50 dark:bg-red-900/20"
          }`}>
            <p className={`text-lg font-bold ${
              refundInfo.percentage > 50 
                ? "text-green-700 dark:text-green-400" 
                : refundInfo.percentage > 0 
                  ? "text-yellow-700 dark:text-yellow-400" 
                  : "text-red-700 dark:text-red-400"
            }`}>
              {refundInfo.percentage > 0 
                ? `₹${refundInfo.amount} (${refundInfo.percentage}% refund)`
                : "No refund applicable"
              }
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {refundInfo.hoursUntil !== undefined && refundInfo.hoursUntil >= 0 
                ? `${Math.floor(refundInfo.hoursUntil)} hours until booking`
                : "Booking time has passed"
              }
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-divider">
              <span className="text-muted-foreground">24+ hours before</span>
              <span className="font-medium text-green-600">100% refund</span>
            </div>
            <div className="flex justify-between py-2 border-b border-divider">
              <span className="text-muted-foreground">12-24 hours before</span>
              <span className="font-medium text-green-600">75% refund</span>
            </div>
            <div className="flex justify-between py-2 border-b border-divider">
              <span className="text-muted-foreground">6-12 hours before</span>
              <span className="font-medium text-yellow-600">50% refund</span>
            </div>
            <div className="flex justify-between py-2 border-b border-divider">
              <span className="text-muted-foreground">2-6 hours before</span>
              <span className="font-medium text-yellow-600">25% refund</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Less than 2 hours</span>
              <span className="font-medium text-red-600">No refund</span>
            </div>
          </div>
        </div>

        {/* Cancellation Reason */}
        <div className="bg-card rounded-xl shadow-soft p-4">
          <h3 className="font-semibold text-foreground mb-3">Reason for Cancellation</h3>
          <Textarea
            placeholder="Help us improve by sharing why you're cancelling (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="bg-muted border-0 min-h-[100px] resize-none"
          />
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-divider p-4 flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => navigate(-1)}
        >
          Keep Booking
        </Button>
        <Button 
          variant="destructive" 
          className="flex-1"
          onClick={handleCancel}
          disabled={cancelBooking.isPending}
        >
          {cancelBooking.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          Cancel Booking
        </Button>
      </div>

      <BottomNav mode="home" />
    </div>
  );
};

export default BookingCancellation;
