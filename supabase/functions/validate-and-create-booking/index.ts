import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createRateLimiter, RATE_LIMITS } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Standard rate limit: 60 per minute
const rateLimiter = createRateLimiter(RATE_LIMITS.standard);

interface BookingRequest {
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting
  const limitResponse = rateLimiter(req);
  if (limitResponse) {
    console.log("Rate limit exceeded for booking validation");
    return new Response(limitResponse.body, {
      status: limitResponse.status,
      headers: { ...corsHeaders, ...Object.fromEntries(limitResponse.headers.entries()) },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header to extract user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user's JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Invalid user token:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bookingData: BookingRequest = await req.json();
    console.log(`Processing booking for user ${user.id}:`, JSON.stringify(bookingData));

    // Validate required fields
    if (!bookingData.venue_id || !bookingData.slot_date || !bookingData.slot_time) {
      console.error("Missing required booking fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields: venue_id, slot_date, slot_time" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check slot availability - count existing bookings for this slot
    const { data: existingBookings, error: checkError } = await supabase
      .from("bookings")
      .select("id, total_courts")
      .eq("venue_id", bookingData.venue_id)
      .eq("slot_date", bookingData.slot_date)
      .eq("slot_time", bookingData.slot_time)
      .eq("status", "confirmed");

    if (checkError) {
      console.error("Error checking slot availability:", checkError);
      throw checkError;
    }

    const bookedCourts = existingBookings?.length || 0;
    const totalCourts = bookingData.total_courts || 3;

    console.log(`Slot ${bookingData.slot_time}: ${bookedCourts}/${totalCourts} courts booked`);

    if (bookedCourts >= totalCourts) {
      console.log("Slot is fully booked");
      return new Response(
        JSON.stringify({ 
          error: "Slot not available", 
          message: "This slot is fully booked. Please choose another time.",
          code: "SLOT_UNAVAILABLE"
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the booking atomically
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        venue_id: bookingData.venue_id,
        venue_name: bookingData.venue_name,
        venue_image: bookingData.venue_image,
        venue_address: bookingData.venue_address,
        sport: bookingData.sport,
        slot_date: bookingData.slot_date,
        slot_time: bookingData.slot_time,
        duration_minutes: bookingData.duration_minutes || 30,
        price: bookingData.price,
        total_courts: totalCourts,
        player_count: bookingData.player_count || 1,
        visibility: bookingData.visibility || "friends",
        status: "confirmed",
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Error creating booking:", bookingError);
      
      // Check if it's a duplicate/conflict error
      if (bookingError.code === "23505") {
        return new Response(
          JSON.stringify({ 
            error: "Booking conflict", 
            message: "You already have a booking for this slot.",
            code: "DUPLICATE_BOOKING"
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw bookingError;
    }

    console.log("Booking created successfully:", booking.id);

    // If booking is public, create a group chat room
    if (bookingData.visibility === "public") {
      try {
        const { data: newRoom, error: roomError } = await supabase
          .from("chat_rooms")
          .insert({
            type: "group",
            name: `${bookingData.sport || "Game"} @ ${bookingData.venue_name.split(" ")[0]}`,
            booking_id: booking.id,
            created_by: user.id,
          })
          .select()
          .single();

        if (!roomError && newRoom) {
          await supabase.from("chat_room_members").insert({
            room_id: newRoom.id,
            user_id: user.id,
            role: "admin",
          });
          console.log("Chat room created for public booking:", newRoom.id);
        }
      } catch (chatError) {
        console.error("Failed to create chat room:", chatError);
        // Don't throw - booking was still successful
      }
    }

    // Trigger booking notification
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-booking-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          userId: user.id,
          bookingId: booking.id,
          venueName: bookingData.venue_name,
          sport: bookingData.sport || "Sports",
          slotDate: bookingData.slot_date,
          slotTime: bookingData.slot_time,
          price: bookingData.price,
        }),
      });
      console.log("Booking notification triggered");
    } catch (notifError) {
      console.error("Failed to send booking notification:", notifError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking: booking,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in validate-and-create-booking:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});