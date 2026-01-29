import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, CheckCircle2, Share2, CalendarPlus, Users, MessageCircle, UserPlus, Loader2 } from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEventById, useEventAttendees, useEventsWithHost } from "@/hooks/useEvents";
import { format, parseISO } from "date-fns";
import { SocialEventCard } from "@/components/SocialEventCard";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";

const EventRegistrationConfirmation = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [invitingFriends, setInvitingFriends] = useState<Record<string, boolean>>({});
  
  const { data: event } = useEventById(eventId);
  const { data: attendees = [] } = useEventAttendees(eventId);
  const { data: otherEvents = [], isLoading: loadingEvents } = useEventsWithHost("upcoming");
  const eventData = location.state?.eventData || event;
  const ticketCount = location.state?.ticketCount || 1;

  // Fetch friends for invite
  const { data: friends = [] } = useQuery({
    queryKey: ["friends-for-invite", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("friendships")
        .select(`
          id,
          requester_id,
          addressee_id,
          requester:profiles!friendships_requester_id_fkey(display_name, username, avatar_url, user_id),
          addressee:profiles!friendships_addressee_id_fkey(display_name, username, avatar_url, user_id)
        `)
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (error) throw error;

      // Format to get friend profiles
      return data.map((f: any) => {
        const isRequester = f.requester_id === user.id;
        const friend = isRequester ? f.addressee : f.requester;
        return {
          id: isRequester ? f.addressee_id : f.requester_id,
          ...friend,
        };
      });
    },
    enabled: !!user && inviteSheetOpen,
  });

  // Filter events excluding current one
  const recommendedEvents = otherEvents
    .filter((e) => e.id !== eventId)
    .slice(0, 3);

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

  const formatEventDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  const formatPrice = (entryFee: number) => {
    if (entryFee === 0) return "Free";
    return `₹${entryFee}`;
  };

  const formatSpots = (current: number, max: number | null) => {
    if (!max) return `${current} joined`;
    return `${current}/${max}`;
  };

  const handleAddToCalendar = () => {
    if (!eventData) return;
    
    const startDate = new Date(`${eventData.event_date}T${eventData.start_time}`);
    const endDate = eventData.end_time 
      ? new Date(`${eventData.event_date}T${eventData.end_time}`)
      : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

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
      toast.success("Link copied to clipboard!");
    }
  };

  const handleInviteFriend = async (friendId: string) => {
    if (!eventData || !user) return;
    
    setInvitingFriends(prev => ({ ...prev, [friendId]: true }));
    
    try {
      // Create a notification for the friend via secure edge function
      const { error } = await supabase.functions.invoke("create-notification", {
        body: {
          recipientUserId: friendId,
          type: "event_invite",
          title: "Event Invitation",
          body: `You've been invited to ${eventData.title}`,
          data: {
            event_id: eventId,
            event_title: eventData.title,
            event_date: eventData.event_date,
            invited_by: user.id,
          },
        },
      });
      
      if (error) throw error;
      
      toast.success("Invitation sent!");
    } catch (error) {
      console.error("Error inviting friend:", error);
      toast.error("Failed to send invitation");
    } finally {
      setInvitingFriends(prev => ({ ...prev, [friendId]: false }));
    }
  };

  const handleGoToChat = async () => {
    if (!eventId) return;
    
    // Find chat room for this event
    const { data: room } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("event_id", eventId)
      .maybeSingle();
    
    if (room) {
      navigate(`/social/chat/${room.id}`);
    } else {
      toast.error("Chat room not found");
    }
  };

  const filteredFriends = friends.filter((friend: any) =>
    friend.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const getHostName = (event: any): string => {
    if (event.profiles) {
      return event.profiles.display_name || event.profiles.username || "Anonymous Host";
    }
    return "FitKits Official";
  };

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
            {ticketCount > 1 
              ? `${ticketCount} tickets confirmed. We've sent you the details via email.`
              : "We've sent a confirmation email with all the details"
            }
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
                <span className="text-sm text-muted-foreground">
                  Amount Paid ({ticketCount} {ticketCount === 1 ? "ticket" : "tickets"})
                </span>
                <span className="font-bold text-brand-green">₹{eventData.entry_fee * ticketCount}</span>
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
            onClick={() => setInviteSheetOpen(true)}
          >
            <UserPlus className="w-4 h-4" />
            Invite Friends
          </Button>
        </div>

        {/* Go to Chat Button */}
        <Button
          className="w-full bg-brand-green hover:bg-brand-green/90 text-white"
          onClick={handleGoToChat}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Go to Event Chat
        </Button>

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
                <p className="text-sm font-medium text-foreground">Join the Event Chat</p>
                <p className="text-xs text-muted-foreground">
                  Connect with other attendees and stay updated
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

        {/* More Events You Might Like */}
        {!loadingEvents && recommendedEvents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">More Events You Might Like</h3>
              <button 
                className="text-sm text-brand-green font-medium"
                onClick={() => navigate("/social")}
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {recommendedEvents.map((event: any) => (
                <SocialEventCard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  date={formatEventDate(event.event_date)}
                  time={formatEventTime(event.start_time, event.end_time)}
                  location={event.location}
                  spots={formatSpots(event.current_participants, event.max_participants)}
                  price={formatPrice(event.entry_fee)}
                  image={event.image_url || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"}
                  host={getHostName(event)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Event
          </Button>
          <Button
            className="flex-1 bg-brand-green hover:bg-brand-green/90 text-white"
            onClick={() => navigate("/profile/events")}
          >
            View My Events
          </Button>
        </div>
      </div>

      {/* Invite Friends Sheet */}
      <Sheet open={inviteSheetOpen} onOpenChange={setInviteSheetOpen}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Invite Friends</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <Input
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-muted"
            />
            <div className="space-y-2 max-h-[45vh] overflow-y-auto">
              {filteredFriends.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {friends.length === 0 ? "No friends to invite" : "No friends match your search"}
                </p>
              ) : (
                filteredFriends.map((friend: any) => (
                  <div 
                    key={friend.id} 
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-soft rounded-full flex items-center justify-center overflow-hidden">
                        {friend.avatar_url ? (
                          <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-semibold text-brand-green">
                            {(friend.display_name || friend.username || "U").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{friend.display_name || friend.username}</p>
                        <p className="text-xs text-muted-foreground">@{friend.username}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleInviteFriend(friend.user_id)}
                      disabled={invitingFriends[friend.user_id]}
                    >
                      {invitingFriends[friend.user_id] ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Invite"
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <BottomNav mode="social" />
    </div>
  );
};

export default EventRegistrationConfirmation;
