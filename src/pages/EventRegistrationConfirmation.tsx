import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, CheckCircle2, Share2, CalendarPlus, Users } from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEventById, useEventAttendees } from "@/hooks/useEvents";
import { format } from "date-fns";

const EventRegistrationConfirmation = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { data: event } = useEventById(eventId);
  const { data: attendees = [] } = useEventAttendees(eventId);
  const eventData = location.state?.eventData || event;

  const formatEventTime = (startTime: string, endTime: string | null) => {
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    };
    
    if (endTime) {
      return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    }
    return formatTime(startTime);
  };

  const handleAddToCalendar = () => {
    if (!eventData) return;
    
    const startDate = new Date(`${eventData.event_date}T${eventData.start_time}`);
    const endDate = eventData.end_time 
      ? new Date(`${eventData.event_date}T${eventData.end_time}`)
      : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventData.title)}&dates=${startDate.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}/${endDate.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}&location=${encodeURIComponent(eventData.location)}&details=${encodeURIComponent(eventData.description || "")}`;
    
    window.open(googleCalendarUrl, "_blank");
  };

  const handleShare = async () => {
    if (!eventData) return;
    
    const shareData = {
      title: eventData.title,
      text: `Join me at ${eventData.title} on ${format(new Date(eventData.event_date), "MMM d, yyyy")}!`,
      url: window.location.origin + `/social/event/${eventId}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
    }
  };

  if (!eventData) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Event not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/social")}>
            Go to Social
          </Button>
        </div>
        <BottomNav mode="social" />
      </div>
    );
  }

  const eventDate = format(new Date(eventData.event_date), "EEEE, MMMM d, yyyy");
  const eventTime = formatEventTime(eventData.start_time, eventData.end_time);

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      
      <div className="px-5 py-6 space-y-6">
        {/* Success Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">You're Registered!</h1>
          <p className="text-sm text-muted-foreground mt-2">
            We've sent a confirmation email with all the details
          </p>
        </div>

        {/* Event Summary Card */}
        <div className="bg-card rounded-xl shadow-soft overflow-hidden">
          {eventData.image_url && (
            <img 
              src={eventData.image_url} 
              alt={eventData.title} 
              className="w-full h-32 object-cover"
            />
          )}
          <div className="p-4 space-y-4">
            <div>
              <span className="text-xs bg-brand-green/10 text-brand-green px-2 py-1 rounded-full">
                {eventData.event_type === "tournament" ? "Tournament" : "Social Event"}
              </span>
              <h2 className="font-bold text-lg text-foreground mt-2">{eventData.title}</h2>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-brand-green" />
                <span className="text-muted-foreground">{eventDate}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-brand-green" />
                <span className="text-muted-foreground">{eventTime}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-brand-green" />
                <span className="text-muted-foreground">{eventData.location}</span>
              </div>
            </div>

            {eventData.entry_fee > 0 && (
              <div className="pt-3 border-t border-divider flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount Paid</span>
                <span className="font-bold text-brand-green">₹{eventData.entry_fee}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleAddToCalendar}
          >
            <CalendarPlus className="w-4 h-4" />
            Add to Calendar
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
            Invite Friends
          </Button>
        </div>

        {/* Other Attendees */}
        {attendees.length > 1 && (
          <div className="bg-card rounded-xl shadow-soft p-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-green" />
              Who's Coming ({attendees.length})
            </h3>
            <div className="flex -space-x-2">
              {attendees.slice(0, 8).map((attendee: any, idx: number) => (
                <div 
                  key={idx} 
                  className="w-10 h-10 bg-brand-soft rounded-full flex items-center justify-center border-2 border-background"
                >
                  {attendee.profiles?.avatar_url ? (
                    <img 
                      src={attendee.profiles.avatar_url} 
                      alt="" 
                      className="w-full h-full rounded-full object-cover" 
                    />
                  ) : (
                    <span className="text-xs font-semibold text-brand-green">
                      {(attendee.profiles?.display_name || "U").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
              {attendees.length > 8 && (
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center border-2 border-background">
                  <span className="text-xs font-medium text-muted-foreground">
                    +{attendees.length - 8}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* What's Next */}
        <div className="bg-card rounded-xl shadow-soft p-4">
          <h3 className="font-semibold text-foreground mb-3">What's Next?</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-brand-green/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-brand-green">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Check Your Email</p>
                <p className="text-xs text-muted-foreground">
                  We've sent you a confirmation with event details
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-brand-green/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-brand-green">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Prepare Your Gear</p>
                <p className="text-xs text-muted-foreground">
                  Make sure you have all necessary equipment for {eventData.sport}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-brand-green/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-brand-green">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Arrive Early</p>
                <p className="text-xs text-muted-foreground">
                  Plan to arrive 15 minutes before the event starts
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/social")}
          >
            Browse Events
          </Button>
          <Button
            className="flex-1 bg-brand-green hover:bg-brand-green/90 text-white"
            onClick={() => navigate("/profile")}
          >
            View My Events
          </Button>
        </div>
      </div>

      <BottomNav mode="social" />
    </div>
  );
};

export default EventRegistrationConfirmation;
