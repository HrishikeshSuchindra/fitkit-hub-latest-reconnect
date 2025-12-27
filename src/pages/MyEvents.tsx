import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin, Users, Loader2, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isToday, isTomorrow, isPast } from "date-fns";

const MyEvents = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["my-events", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("event_registrations")
        .select(`
          *,
          events (*)
        `)
        .eq("user_id", user.id)
        .order("registered_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
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

  // Separate upcoming and past events
  const upcomingEvents = registrations.filter((reg: any) => !isPast(new Date(reg.events.event_date)));
  const pastEvents = registrations.filter((reg: any) => isPast(new Date(reg.events.event_date)));

  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 pt-4 pb-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold ml-2">My Events</h1>
          {registrations.length > 0 && (
            <span className="ml-2 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-medium">
              {registrations.length}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : registrations.length === 0 ? (
          <Card className="p-8 shadow-md text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-medium text-foreground mb-1">No events joined yet</p>
            <p className="text-sm text-muted-foreground mb-4">Explore events and join the fun!</p>
            <Button onClick={() => navigate("/social")} className="bg-primary text-white">
              Explore Events
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Upcoming</h2>
                <div className="space-y-3">
                  {upcomingEvents.map((reg: any) => (
                    <Card
                      key={reg.id}
                      className="p-4 shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => navigate(`/social/event/${reg.events.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{reg.events.title}</p>
                          <p className="text-sm text-muted-foreground">{reg.events.event_type}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 ${getDateHighlight(reg.events.event_date)}`}>
                          {getDateLabel(reg.events.event_date)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(reg.events.event_date), "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{reg.events.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{reg.events.current_participants}/{reg.events.max_participants}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Past</h2>
                <div className="space-y-3">
                  {pastEvents.map((reg: any) => (
                    <Card
                      key={reg.id}
                      className="p-4 shadow-md cursor-pointer opacity-80 hover:shadow-lg transition-shadow"
                      onClick={() => navigate(`/social/event/${reg.events.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{reg.events.title}</p>
                          <p className="text-sm text-muted-foreground">{reg.events.event_type}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 ${getDateHighlight(reg.events.event_date)}`}>
                          {getDateLabel(reg.events.event_date)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(reg.events.event_date), "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{reg.events.location}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEvents;
