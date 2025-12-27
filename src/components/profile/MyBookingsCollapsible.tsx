import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, RotateCcw, MessageSquare, Loader2, ChevronRight, Phone, Navigation, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserBookings } from "@/hooks/useBookings";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

interface MyBookingsCollapsibleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MyBookingsCollapsible({ open, onOpenChange }: MyBookingsCollapsibleProps) {
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
    // Open phone dialer or show contact info
    toast.success(`Contacting ${booking.venue_name}...`);
  };

  const handleDirections = (booking: any) => {
    // Open Google Maps with the venue address
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

  // Group bookings by date and separate upcoming/past
  const now = new Date();
  const upcomingBookings = bookings.filter(b => !isPast(new Date(b.slot_date)));
  const pastBookings = bookings.filter(b => isPast(new Date(b.slot_date)));

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
    <>
      <Card id="my-bookings" className="shadow-sm border bg-muted/50 overflow-hidden">
        <Collapsible open={open} onOpenChange={onOpenChange}>
          <CollapsibleTrigger className="w-full p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-bold text-foreground">My Bookings</h3>
              {bookings.length > 0 && (
                <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
                  {bookings.length}
                </span>
              )}
            </div>
            <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`} />
          </CollapsibleTrigger>

          <CollapsibleContent className="px-4 pb-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : bookings.length === 0 ? (
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
              <div className="space-y-6">
                {/* Upcoming Bookings */}
                {sortedUpcomingDates.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Upcoming</h4>
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
                          <div className="space-y-2">
                            {groupedUpcoming[dateKey].map((booking) => (
                              <div
                                key={booking.id}
                                className="bg-card rounded-xl p-3 border shadow-sm"
                              >
                                <div className="flex items-start gap-3 mb-2">
                                  <div className="w-10 h-10 rounded-lg bg-brand-green flex items-center justify-center text-xl">
                                    {getSportIcon(booking.sport)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-foreground text-sm">{booking.sport || "Sports"}</p>
                                    <p className="text-xs text-muted-foreground truncate">{booking.venue_name}</p>
                                  </div>
                                  <span className="text-primary font-bold text-sm">₹{booking.price}</span>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatTime(booking.slot_time)}</span>
                                  </div>
                                </div>

                                {/* Action buttons for upcoming - Contact, Direction, Feedback */}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs flex-1 border"
                                    onClick={() => handleContact(booking)}
                                  >
                                    <Phone className="w-3 h-3 mr-1" />
                                    Contact
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs flex-1 border"
                                    onClick={() => handleDirections(booking)}
                                  >
                                    <Navigation className="w-3 h-3 mr-1" />
                                    Directions
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-xs text-primary"
                                    onClick={() => handleFeedback(booking.id)}
                                  >
                                    <MessageSquare className="w-3 h-3 mr-1" />
                                    Feedback
                                  </Button>
                                </div>
                              </div>
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
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Past</h4>
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
                          <div className="space-y-2">
                            {groupedPast[dateKey].map((booking) => (
                              <div
                                key={booking.id}
                                className="bg-card rounded-xl p-3 border shadow-sm opacity-80"
                              >
                                <div className="flex items-start gap-3 mb-2">
                                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl">
                                    {getSportIcon(booking.sport)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-foreground text-sm">{booking.sport || "Sports"}</p>
                                    <p className="text-xs text-muted-foreground truncate">{booking.venue_name}</p>
                                  </div>
                                  <span className="text-primary font-bold text-sm">₹{booking.price}</span>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatTime(booking.slot_time)}</span>
                                  </div>
                                </div>

                                {/* Action buttons for past - Book Again, Feedback */}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs flex-1 border"
                                    onClick={() => handleBookAgain(booking)}
                                  >
                                    <RotateCcw className="w-3 h-3 mr-1" />
                                    Book Again
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-xs text-primary"
                                    onClick={() => handleFeedback(booking.id)}
                                  >
                                    <Star className="w-3 h-3 mr-1" />
                                    Feedback
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </Card>

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
    </>
  );
}
