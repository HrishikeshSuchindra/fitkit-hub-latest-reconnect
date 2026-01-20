import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { format } from "date-fns";

export interface Event {
  id: string;
  title: string;
  description: string | null;
  sport: string;
  event_type: string;
  event_date: string;
  start_time: string;
  end_time: string | null;
  location: string;
  venue_id: string | null;
  host_id: string;
  max_participants: number | null;
  current_participants: number;
  entry_fee: number;
  prize_pool: string | null;
  skill_level: string | null;
  status: string;
  is_featured: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventWithHost extends Event {
  profiles: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
  status: string | null;
  payment_status: string | null;
}

// Fetch a single event by ID with host info
export const useEventById = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      if (!eventId) return null;

      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          profiles!events_host_id_fkey (
            display_name,
            username,
            avatar_url
          )
        `)
        .eq("id", eventId)
        .single();

      if (error) {
        // If the join fails, try without it
        const { data: eventOnly, error: eventError } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single();
        
        if (eventError) throw eventError;
        return eventOnly as Event;
      }
      
      return data as unknown as EventWithHost;
    },
    enabled: !!eventId,
  });
};

// Fetch all upcoming events
export const useUpcomingEvents = () => {
  return useQuery({
    queryKey: ["upcoming-events"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("event_date", today)
        .neq("status", "cancelled")
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data as Event[];
    },
  });
};

// Fetch all upcoming events with host profile info
export const useEventsWithHost = (filter: "upcoming" | "past" = "upcoming") => {
  return useQuery({
    queryKey: ["events-with-host", filter],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      
      let query = supabase
        .from("events")
        .select(`
          *,
          profiles!events_host_id_fkey (
            display_name,
            username,
            avatar_url
          )
        `)
        .neq("status", "cancelled");

      if (filter === "upcoming") {
        query = query.gte("event_date", today);
      } else {
        query = query.lt("event_date", today);
      }

      const { data, error } = await query
        .order("event_date", { ascending: filter === "upcoming" })
        .order("start_time", { ascending: true });

      if (error) {
        // If join fails, fetch without host info
        const { data: eventsOnly, error: eventsError } = await supabase
          .from("events")
          .select("*")
          .neq("status", "cancelled")
          .gte("event_date", filter === "upcoming" ? today : "1970-01-01")
          .lt("event_date", filter === "past" ? today : "2100-01-01")
          .order("event_date", { ascending: filter === "upcoming" });
        
        if (eventsError) throw eventsError;
        return eventsOnly as Event[];
      }
      
      return data as unknown as EventWithHost[];
    },
  });
};

// Check if user is registered for an event
export const useEventRegistration = (eventId: string | undefined) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["event-registration", eventId, user?.id],
    queryFn: async () => {
      if (!eventId || !user) return null;

      const { data, error } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as EventRegistration | null;
    },
    enabled: !!eventId && !!user,
  });
};

// Fetch event attendees
export const useEventAttendees = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ["event-attendees", eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from("event_registrations")
        .select(`
          *,
          profiles (
            display_name,
            username,
            avatar_url
          )
        `)
        .eq("event_id", eventId)
        .eq("status", "registered");

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });
};

// Register for an event
export const useRegisterForEvent = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("event_registrations")
        .insert({
          event_id: eventId,
          user_id: user.id,
          status: "registered",
          payment_status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data as EventRegistration;
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ["event-registration", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-attendees", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });
};

// Cancel event registration
export const useCancelEventRegistration = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("event_registrations")
        .update({ status: "cancelled" })
        .eq("event_id", eventId)
        .eq("user_id", user.id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ["event-registration", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-attendees", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event", eventId] });
    },
  });
};