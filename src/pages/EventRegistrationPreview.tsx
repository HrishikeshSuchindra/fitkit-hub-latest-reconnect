import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, MapPin, Users, Trophy, Loader2, Edit2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useEventById, useEventRegistration, useRegisterForEvent } from "@/hooks/useEvents";
import { format } from "date-fns";
import { toast } from "sonner";

const EventRegistrationPreview = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToRefund, setAgreedToRefund] = useState(false);

  const { data: event, isLoading } = useEventById(eventId);
  const { data: registration } = useEventRegistration(eventId);
  const registerMutation = useRegisterForEvent();

  const isAlreadyRegistered = !!registration && registration.status === "registered";

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

  const handleRegister = () => {
    if (!eventId) return;
    
    registerMutation.mutate(eventId, {
      onSuccess: () => {
        navigate(`/social/event/${eventId}/confirmation`, {
          state: { eventData: event }
        });
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "Failed to register");
      },
    });
  };

  if (isLoading) {
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

  if (isAlreadyRegistered) {
    navigate(`/social/event/${eventId}`);
    return null;
  }

  const eventDate = format(new Date(event.event_date), "EEEE, MMMM d, yyyy");
  const eventTime = formatEventTime(event.start_time, event.end_time);
  const spotsLeft = event.max_participants ? event.max_participants - (event.current_participants || 0) : null;
  const canProceed = agreedToTerms && (event.entry_fee === 0 || agreedToRefund);

  return (
    <div className="min-h-screen bg-background pb-32">
      <AppHeader />
      
      <div className="px-5 py-4 space-y-5">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">Registration Preview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review your registration details
          </p>
        </div>

        {/* Event Card */}
        <div className="bg-card rounded-xl shadow-soft overflow-hidden">
          {event.image_url && (
            <div className="relative h-40">
              <img 
                src={event.image_url} 
                alt={event.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <span className="text-xs bg-brand-green text-white px-2 py-1 rounded-full">
                  {event.event_type === "tournament" ? "Tournament" : "Social Event"}
                </span>
              </div>
            </div>
          )}
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="font-bold text-lg text-foreground">{event.title}</h2>
                <p className="text-sm text-muted-foreground">{event.sport}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground"
                onClick={() => navigate(`/social/event/${eventId}`)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-card rounded-xl shadow-soft p-4 space-y-4">
          <h3 className="font-semibold text-foreground">Event Details</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-green" />
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm font-medium">{format(new Date(event.event_date), "EEE, MMM d")}</p>
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-green" />
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="text-sm font-medium">{eventTime}</p>
              </div>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-green" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="text-sm font-medium">{event.location}</p>
            </div>
          </div>

          {event.max_participants && (
            <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-green" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Availability</p>
                <p className="text-sm font-medium">
                  {spotsLeft} spots left out of {event.max_participants}
                </p>
              </div>
            </div>
          )}

          {event.skill_level && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Skill Level:</span>
              <span className="font-medium capitalize">{event.skill_level}</span>
            </div>
          )}

          {event.prize_pool && (
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-muted-foreground">Prize Pool:</span>
              <span className="font-medium">{event.prize_pool}</span>
            </div>
          )}
        </div>

        {/* Payment Summary */}
        <div className="bg-card rounded-xl shadow-soft p-4">
          <h3 className="font-semibold text-foreground mb-4">Payment Summary</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Registration Fee</span>
              <span className="font-medium">
                {event.entry_fee > 0 ? `₹${event.entry_fee}` : "Free"}
              </span>
            </div>
            {event.entry_fee > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Platform Fee</span>
                  <span className="font-medium">₹0</span>
                </div>
                <div className="border-t border-divider pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="font-bold text-lg text-brand-green">₹{event.entry_fee}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="bg-card rounded-xl shadow-soft p-4 space-y-4">
          <h3 className="font-semibold text-foreground">Terms & Conditions</h3>
          
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
              I agree to the event rules and <span className="text-primary underline">terms of service</span>. 
              I understand that the event organizer reserves the right to modify or cancel the event.
            </label>
          </div>

          {event.entry_fee > 0 && (
            <div className="flex items-start gap-3">
              <Checkbox
                id="refund"
                checked={agreedToRefund}
                onCheckedChange={(checked) => setAgreedToRefund(checked as boolean)}
              />
              <label htmlFor="refund" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                I understand the <span className="text-primary underline">refund policy</span>. 
                Cancellations made 24+ hours before the event are eligible for a full refund.
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-divider p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <p className="text-xl font-bold text-brand-green">
              {event.entry_fee > 0 ? `₹${event.entry_fee}` : "Free"}
            </p>
          </div>
          <Button
            className="bg-brand-green hover:bg-brand-green/90 text-white px-8"
            onClick={handleRegister}
            disabled={!canProceed || registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {event.entry_fee > 0 ? "Pay & Register" : "Confirm Registration"}
          </Button>
        </div>
      </div>

      <BottomNav mode="social" />
    </div>
  );
};

export default EventRegistrationPreview;
