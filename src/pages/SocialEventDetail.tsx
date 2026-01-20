import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Users, Share2, Heart, CheckCircle2, Loader2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { useEventById, useEventRegistration, useEventAttendees } from "@/hooks/useEvents";
import { format } from "date-fns";

const SocialEventDetail = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);

  const { data: event, isLoading: eventLoading } = useEventById(eventId);
  const { data: registration } = useEventRegistration(eventId);
  const { data: attendees = [] } = useEventAttendees(eventId);

  const isRegistered = !!registration && registration.status === "registered";

  const handleRegister = () => {
    if (!eventId) return;
    navigate(`/social/event/${eventId}/register`);
  };

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

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Event not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
        <BottomNav mode="social" />
      </div>
    );
  }

  const eventDate = format(new Date(event.event_date), "MMM d, yyyy");
  const eventTime = formatEventTime(event.start_time, event.end_time);
  const spotsLeft = event.max_participants ? event.max_participants - (event.current_participants || 0) : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      
      {/* Hero Image */}
      <div className="relative aspect-video">
        <img 
          src={event.image_url || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800"} 
          alt={event.title} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-xl font-bold text-white mb-1">{event.title}</h1>
          <p className="text-sm text-white/80">
            {event.event_type === "tournament" ? "Tournament" : "Social Event"}
          </p>
        </div>
        <button 
          onClick={() => setIsLiked(!isLiked)}
          className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
        >
          <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500 text-red-500" : "text-white"}`} />
        </button>
      </div>
      
      <div className="px-5 py-4 space-y-5">
        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-soft rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-brand-green" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Date</p>
              <p className="text-sm font-semibold text-foreground">{eventDate}</p>
            </div>
          </div>
          <div className="bg-muted rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-soft rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-brand-green" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Time</p>
              <p className="text-sm font-semibold text-foreground">{eventTime}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-muted rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-soft rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-brand-green" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-text-secondary">Location</p>
            <p className="text-sm font-semibold text-foreground">{event.location}</p>
          </div>
          <Button variant="outline" size="sm" className="text-xs">
            View Map
          </Button>
        </div>
        
        {/* Description */}
        <div>
          <h3 className="font-bold text-foreground mb-2">About this Event</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            {event.description || "No description available."}
          </p>
        </div>
        
        {/* Event Details */}
        <div>
          <h3 className="font-bold text-foreground mb-2">Event Details</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <CheckCircle2 className="w-4 h-4 text-brand-green" />
              Sport: {event.sport}
            </div>
            {event.skill_level && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle2 className="w-4 h-4 text-brand-green" />
                Level: {event.skill_level}
              </div>
            )}
            {event.prize_pool && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle2 className="w-4 h-4 text-brand-green" />
                Prize: {event.prize_pool}
              </div>
            )}
          </div>
        </div>
        
        {/* Attendees */}
        {event.max_participants && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-foreground">Attendees</h3>
              <span className="text-xs text-text-secondary">
                {event.current_participants || 0}/{event.max_participants} spots filled
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {attendees.slice(0, 4).map((attendee: any, idx: number) => (
                  <div key={idx} className="w-8 h-8 bg-brand-soft rounded-full flex items-center justify-center border-2 border-background">
                    {attendee.profiles?.avatar_url ? (
                      <img src={attendee.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-xs font-semibold text-brand-green">
                        {(attendee.profiles?.display_name || "U").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {attendees.length > 4 && (
                <span className="text-xs text-text-secondary">+{attendees.length - 4} more</span>
              )}
            </div>
          </div>
        )}
        
        {/* Host - Only show if we have host info */}
        {(event as any).profiles && (
          <div className="bg-card rounded-xl shadow-soft p-4">
            <h3 className="font-bold text-foreground mb-3">Event Host</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-green rounded-full flex items-center justify-center overflow-hidden">
                {(event as any).profiles.avatar_url ? (
                  <img src={(event as any).profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold">
                    {((event as any).profiles.display_name || "H").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{(event as any).profiles.display_name || "Host"}</p>
                {(event as any).profiles.username && (
                  <p className="text-xs text-text-secondary">@{(event as any).profiles.username}</p>
                )}
              </div>
              <Button variant="outline" size="sm">View Profile</Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-divider p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-text-secondary">Entry fee</p>
          <p className="text-xl font-bold text-brand-green">
            {event.entry_fee > 0 ? `₹${event.entry_fee}` : "Free"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="w-10 h-10">
            <Share2 className="w-4 h-4" />
          </Button>
          {isRegistered ? (
            <Button disabled className="bg-muted text-text-secondary px-6">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Registered
            </Button>
          ) : spotsLeft !== null && spotsLeft <= 0 ? (
            <Button disabled className="bg-muted text-text-secondary px-6">
              Event Full
            </Button>
          ) : (
            <Button 
              className="bg-brand-green hover:bg-brand-green/90 text-white px-6"
              onClick={handleRegister}
            >
              Register Now
            </Button>
          )}
        </div>
      </div>
      
      <BottomNav mode="social" />
    </div>
  );
};

export default SocialEventDetail;