import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";
import { format } from "date-fns";

export interface Booking {
  id: string;
  user_id: string;
  venue_id: string;
  venue_name: string;
  venue_image: string | null;
  venue_address: string | null;
  sport: string | null;
  slot_date: string;
  slot_time: string;
  duration_minutes: number;
  price: number;
  total_courts: number;
  player_count: number;
  visibility: "public" | "friends";
  status: "confirmed" | "cancelled" | "completed";
  created_at: string;
  updated_at: string;
}

export interface CreateBookingData {
  venue_id: string;
  venue_name: string;
  venue_image?: string;
  venue_address?: string;
  sport?: string;
  slot_date: string;
  slot_time: string;
  duration_minutes: number;
  price: number;
  total_courts: number;
  player_count: number;
  visibility: "public" | "friends";
}

// Fetch user's bookings
export const useUserBookings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["bookings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("slot_date", { ascending: false });

      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!user,
  });
};

// Fetch slot availability for a venue on a specific date
export const useSlotAvailability = (venueId: string, date: Date) => {
  const formattedDate = format(date, "yyyy-MM-dd");

  const query = useQuery({
    queryKey: ["slot-availability", venueId, formattedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("slot_time, total_courts")
        .eq("venue_id", venueId)
        .eq("slot_date", formattedDate)
        .eq("status", "confirmed");

      if (error) throw error;
      
      // Count bookings per slot
      const slotCounts: Record<string, number> = {};
      data?.forEach((booking) => {
        slotCounts[booking.slot_time] = (slotCounts[booking.slot_time] || 0) + 1;
      });
      
      return slotCounts;
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`bookings-${venueId}-${formattedDate}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `venue_id=eq.${venueId}`,
        },
        () => {
          // Refetch when bookings change
          query.refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [venueId, formattedDate, query]);

  return query;
};

// Create a booking
export const useCreateBooking = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingData: CreateBookingData) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          ...bookingData,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["slot-availability"] });
    },
  });
};

// Booking with user profile info
export interface BookingWithProfile extends Booking {
  profiles: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

// Fetch public games (for social section) with user profile info
export const usePublicGames = () => {
  return useQuery({
    queryKey: ["public-games"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          profiles!bookings_user_id_fkey (
            display_name,
            username,
            avatar_url
          )
        `)
        .eq("visibility", "public")
        .eq("status", "confirmed")
        .gte("slot_date", format(new Date(), "yyyy-MM-dd"))
        .order("slot_date", { ascending: true });

      if (error) throw error;
      return data as BookingWithProfile[];
    },
  });
};
