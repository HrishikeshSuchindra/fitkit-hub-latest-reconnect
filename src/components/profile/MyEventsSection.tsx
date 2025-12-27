import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isToday, isTomorrow, isPast } from "date-fns";

export function MyEventsSection() {
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

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl shadow-soft p-4">
        <h3 className="font-bold text-lg text-foreground mb-4">My Events</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-soft p-4">
      <h3 className="font-bold text-lg text-foreground mb-4">My Events</h3>

      {registrations.length === 0 ? (
        <div className="text-center py-6">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No events joined yet</p>
          <Button
            variant="outline"
            className="mt-3 text-primary border-primary"
            onClick={() => navigate("/social")}
          >
            Explore Events
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {registrations.map((reg: any) => (
            <div
              key={reg.id}
              className="bg-muted rounded-xl p-4 cursor-pointer"
              onClick={() => navigate(`/social/event/${reg.events.id}`)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{reg.events.title}</p>
                  <p className="text-xs text-muted-foreground">{reg.events.event_type}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2 ${getDateHighlight(reg.events.event_date)}`}>
                  {getDateLabel(reg.events.event_date)}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{format(new Date(reg.events.event_date), "MMM d")}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{reg.events.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{reg.events.current_participants}/{reg.events.max_participants}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
