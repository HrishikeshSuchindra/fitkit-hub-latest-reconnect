import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Loader2, ArrowLeft, Clock, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

const MyEvents = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["my-events-full", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("event_registrations")
        .select(`
          *,
          events (*)
        `)
        .eq("user_id", user.id)
        .eq("status", "registered")
        .order("registered_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const filteredRegistrations = registrations.filter((reg: any) => {
    if (!reg.events) return false;
    const eventDate = new Date(reg.events.event_date);
    eventDate.setHours(0, 0, 0, 0);
    if (activeTab === "upcoming") {
      return eventDate >= today;
    }
    return eventDate < today;
  });

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

  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const handleGoToChat = async (eventId: string) => {
    const { data: room } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("event_id", eventId)
      .maybeSingle();
    
    if (room) {
      navigate(`/social/chat/${room.id}`);
    } else {
      toast.info("Chat not available for this event");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Please sign in to view your events</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
        </div>
        <BottomNav mode="social" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-background px-5 py-4 flex items-center gap-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">My Events</h1>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeTab === "upcoming"
                ? "bg-brand-green text-white"
                : "bg-muted text-foreground"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeTab === "past"
                ? "bg-brand-green text-white"
                : "bg-muted text-foreground"
            }`}
          >
            Past
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No {activeTab} events found
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/social")}
            >
              Explore Events
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRegistrations.map((reg: any) => (
              <div
                key={reg.id}
                className="bg-card rounded-xl shadow-soft overflow-hidden"
              >
                {/* Event Image */}
                {reg.events?.image_url && (
                  <div 
                    className="h-32 bg-cover bg-center cursor-pointer"
                    style={{ backgroundImage: `url(${reg.events.image_url})` }}
                    onClick={() => navigate(`/social/event/${reg.events.id}`)}
                  />
                )}
                
                <div className="p-4 space-y-3">
                  {/* Title and Date Label */}
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => navigate(`/social/event/${reg.events.id}`)}
                    >
                      <p className="font-bold text-foreground">{reg.events?.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {reg.events?.event_type} • {reg.events?.sport}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 whitespace-nowrap ${getDateHighlight(reg.events?.event_date)}`}>
                      {getDateLabel(reg.events?.event_date)}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{format(new Date(reg.events?.event_date), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTime(reg.events?.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{reg.events?.location}</span>
                    </div>
                  </div>

                  {/* Tickets info */}
                  {reg.tickets_count > 1 && (
                    <div className="flex items-center gap-1.5 text-xs text-brand-green">
                      <Users className="w-3.5 h-3.5" />
                      <span>{reg.tickets_count} tickets</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/social/event/${reg.events.id}`)}
                    >
                      View Details
                    </Button>
                    {activeTab === "upcoming" && (
                      <Button
                        size="sm"
                        className="flex-1 bg-brand-green hover:bg-brand-green/90 text-white"
                        onClick={() => handleGoToChat(reg.events.id)}
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Chat
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav mode="social" />
    </div>
  );
};

export default MyEvents;