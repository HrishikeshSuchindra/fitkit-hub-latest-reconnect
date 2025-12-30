import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";
import { format, differenceInHours } from "date-fns";
import { toast } from "sonner";

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
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
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

// Create a booking with server-side validation
export const useCreateBooking = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingData: CreateBookingData) => {
      if (!user) throw new Error("User not authenticated");

      // Use server-side validation edge function
      const { data, error } = await supabase.functions.invoke("validate-and-create-booking", {
        body: bookingData,
      });

      if (error) {
        // Handle specific error codes
        if (error.message?.includes("SLOT_UNAVAILABLE")) {
          throw new Error("This slot is fully booked. Please choose another time.");
        }
        if (error.message?.includes("DUPLICATE_BOOKING")) {
          throw new Error("You already have a booking for this slot.");
        }
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.message || data?.error || "Failed to create booking");
      }

      return data.booking as Booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["slot-availability"] });
      queryClient.invalidateQueries({ queryKey: ["hub-chat-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
    },
  });
};

// Cancel a booking
export const useCancelBooking = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason?: string }) => {
      if (!user) throw new Error("User not authenticated");

      // Get the booking to check cancellation eligibility
      const { data: booking, error: fetchError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .eq("user_id", user.id)
        .single();

      if (fetchError) throw fetchError;
      if (!booking) throw new Error("Booking not found");

      // Check if booking can be cancelled (must be confirmed and in the future)
      if (booking.status !== "confirmed") {
        throw new Error("Only confirmed bookings can be cancelled");
      }

      const bookingDateTime = new Date(`${booking.slot_date}T${booking.slot_time}`);
      const now = new Date();

      if (bookingDateTime <= now) {
        throw new Error("Cannot cancel past or ongoing bookings");
      }

      // Calculate refund based on hours until booking
      const hoursUntilBooking = differenceInHours(bookingDateTime, now);
      let refundPercentage = 0;
      let refundAmount = 0;

      if (hoursUntilBooking >= 24) {
        refundPercentage = 100;
      } else if (hoursUntilBooking >= 12) {
        refundPercentage = 75;
      } else if (hoursUntilBooking >= 6) {
        refundPercentage = 50;
      } else if (hoursUntilBooking >= 2) {
        refundPercentage = 25;
      }

      refundAmount = (booking.price * refundPercentage) / 100;

      // Update booking status
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason || "User requested cancellation",
        })
        .eq("id", bookingId);

      if (updateError) throw updateError;

      // Create cancellation notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "booking_cancelled",
        title: "Booking Cancelled",
        body: `Your booking at ${booking.venue_name} on ${booking.slot_date} has been cancelled. ${refundPercentage > 0 ? `Refund: ₹${refundAmount} (${refundPercentage}%)` : "No refund applicable."}`,
        data: {
          bookingId: booking.id,
          venueName: booking.venue_name,
          refundAmount,
          refundPercentage,
        },
      });

      return { 
        success: true, 
        refundAmount, 
        refundPercentage,
        hoursUntilBooking 
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["slot-availability"] });
      
      if (data.refundPercentage > 0) {
        toast.success(`Booking cancelled. Refund: ₹${data.refundAmount} (${data.refundPercentage}%)`);
      } else {
        toast.success("Booking cancelled. No refund applicable for late cancellations.");
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to cancel booking");
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
          profiles (
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
      return data as unknown as BookingWithProfile[];
    },
  });
};

// Fetch a single booking by ID
export const useBookingById = (bookingId: string | undefined) => {
  return useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      if (!bookingId) return null;

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          profiles (
            display_name,
            username,
            avatar_url
          )
        `)
        .eq("id", bookingId)
        .single();

      if (error) throw error;
      return data as BookingWithProfile;
    },
    enabled: !!bookingId,
  });
};