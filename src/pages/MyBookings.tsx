import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, RotateCcw, MessageSquare, Loader2, Phone, Navigation, Star, ArrowLeft } from "lucide-react";
import { useUserBookings } from "@/hooks/useBookings";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Sport icons mapping
const getSportIcon = (sport: string | null) => {
  const sportLower = (sport || "").toLowerCase();
  if (sportLower.includes("squash")) return "🎾";
  if (sportLower.includes("tennis")) return "🎾";
  if (sportLower.includes("badminton")) return "🏸";
  if (sportLower.includes("football") || sportLower.includes("soccer")) return "⚽";
  if (sportLower.includes("basketball")) return "🏀";
  if (sportLower.includes("cricket")) return "🏏";
  if (sportLower.includes("table") || sportLower.includes("ping")) return "🏓";
  if (sportLower.includes("pickle")) return "🥒";
  if (sportLower.includes("yoga")) return "🧘";
  if (sportLower.includes("gym") || sportLower.includes("fitness")) return "🏋️";
  if (sportLower.includes("swim")) return "🏊";
  if (sportLower.includes("spa") || sportLower.includes("massage") || sportLower.includes("recovery")) return "💆";
  return "🎯";
};

const MyBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: bookings = [], isLoading } = useUserBookings();
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

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

  const handleContact = (booking: any) => {
    toast.success(`Contacting ${booking.venue_name}...`);
  };

  const handleDirections = (booking: any) => {
    const address = encodeURIComponent(booking.venue_address || booking.venue_name);
    window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
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

  // Determine if a booking slot has passed (compare date + time)
  const isSlotPassed = (booking: typeof bookings[0]) => {
    const slotDateTime = new Date(`${booking.slot_date}T${booking.slot_time}`);
    return isPast(slotDateTime);
  };

  // Group bookings by date and separate upcoming/past based on slot time
  const upcomingBookings = bookings.filter(b => !isSlotPassed(b));
  const pastBookings = bookings.filter(b => isSlotPassed(b));

  const groupBookings = (bookingsList: typeof bookings) => {
    return bookingsList.reduce((acc, booking) => {
      const dateKey = booking.slot_date;
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(booking);
      return acc;
    }, {} as Record<string, typeof bookings>);
  };

  const groupedUpcoming = groupBookings(upcomingBookings);
  const groupedPast = groupBookings(pastBookings);

  const sortedUpcomingDates = Object.keys(groupedUpcoming).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );
  const sortedPastDates = Object.keys(groupedPast).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 pt-4 pb-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold ml-2">My Bookings</h1>
          {bookings.length > 0 && (
            <span className="ml-2 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
              {bookings.length}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : bookings.length === 0 ? (
          <Card className="p-8 shadow-md text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-medium text-foreground mb-1">No bookings yet</p>
            <p className="text-sm text-muted-foreground mb-4">Book a court to get started!</p>
            <Button onClick={() => navigate("/venues/courts")} className="bg-primary text-white">
              Book a Court
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Upcoming Bookings */}
            {sortedUpcomingDates.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Upcoming</h2>
                <div className="space-y-4">
                  {sortedUpcomingDates.map((dateKey) => (
                    <div key={dateKey}>
                      {/* Date Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDateHighlight(dateKey)}`}>
                          {getDateLabel(dateKey)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(dateKey), "MMM d, yyyy")}
                        </span>
                      </div>

                      {/* Bookings for this date */}
                      <div className="space-y-3">
                        {groupedUpcoming[dateKey].map((booking) => (
                          <Card key={booking.id} className="p-4 shadow-md">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-12 h-12 rounded-xl bg-brand-green flex items-center justify-center text-2xl">
                                {getSportIcon(booking.sport)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground">{booking.sport || "Sports"}</p>
                                <p className="text-sm text-muted-foreground truncate">{booking.venue_name}</p>
                              </div>
                              <span className="text-primary font-bold">₹{booking.price}</span>
                            </div>

                            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatTime(booking.slot_time)}</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="flex-1" onClick={() => handleContact(booking)}>
                                <Phone className="w-4 h-4 mr-1" />
                                Contact
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDirections(booking)}>
                                <Navigation className="w-4 h-4 mr-1" />
                                Directions
                              </Button>
                              <Button size="sm" variant="ghost" className="text-primary" onClick={() => handleFeedback(booking.id)}>
                                <MessageSquare className="w-4 h-4 mr-1" />
                                Feedback
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Bookings */}
            {sortedPastDates.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Past</h2>
                <div className="space-y-4">
                  {sortedPastDates.map((dateKey) => (
                    <div key={dateKey}>
                      {/* Date Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDateHighlight(dateKey)}`}>
                          {getDateLabel(dateKey)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(dateKey), "MMM d, yyyy")}
                        </span>
                      </div>

                      {/* Bookings for this date */}
                      <div className="space-y-3">
                        {groupedPast[dateKey].map((booking) => (
                          <Card key={booking.id} className="p-4 shadow-md opacity-80">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
                                {getSportIcon(booking.sport)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground">{booking.sport || "Sports"}</p>
                                <p className="text-sm text-muted-foreground truncate">{booking.venue_name}</p>
                              </div>
                              <span className="text-primary font-bold">₹{booking.price}</span>
                            </div>

                            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatTime(booking.slot_time)}</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="flex-1" onClick={() => handleBookAgain(booking)}>
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Book Again
                              </Button>
                              <Button size="sm" variant="ghost" className="text-primary" onClick={() => handleFeedback(booking.id)}>
                                <Star className="w-4 h-4 mr-1" />
                                Feedback
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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
            <Button onClick={submitFeedback} disabled={submitting} className="bg-primary text-white">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyBookings;
