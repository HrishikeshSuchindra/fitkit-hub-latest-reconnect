import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { createRateLimiter, RATE_LIMITS } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Standard rate limit: 60 per minute
const rateLimiter = createRateLimiter(RATE_LIMITS.standard);

interface BookingReminder {
  id: string;
  user_id: string;
  venue_name: string;
  slot_date: string;
  slot_time: string;
  sport: string | null;
  venue_address: string | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting
  const limitResponse = rateLimiter(req);
  if (limitResponse) {
    console.log("Rate limit exceeded for booking reminder");
    return new Response(limitResponse.body, {
      status: limitResponse.status,
      headers: { ...corsHeaders, ...Object.fromEntries(limitResponse.headers.entries()) },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current time and time 24 hours from now
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    console.log(`Checking for bookings on ${tomorrowDate}`);

    // Fetch bookings scheduled for tomorrow
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, user_id, venue_name, slot_date, slot_time, sport, venue_address")
      .eq("slot_date", tomorrowDate)
      .eq("status", "confirmed");

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      throw bookingsError;
    }

    if (!bookings || bookings.length === 0) {
      console.log("No bookings found for tomorrow");
      return new Response(
        JSON.stringify({ message: "No bookings to remind", count: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${bookings.length} bookings for tomorrow`);

    // Get unique user IDs
    const userIds = [...new Set(bookings.map((b: BookingReminder) => b.user_id))];

    // Fetch push tokens for these users
    const { data: pushTokens, error: tokensError } = await supabase
      .from("push_tokens")
      .select("user_id, token, platform")
      .in("user_id", userIds)
      .eq("is_active", true);

    if (tokensError) {
      console.error("Error fetching push tokens:", tokensError);
    }

    const tokensByUser = (pushTokens || []).reduce((acc: Record<string, any[]>, token: any) => {
      if (!acc[token.user_id]) acc[token.user_id] = [];
      acc[token.user_id].push(token);
      return acc;
    }, {});

    let sentCount = 0;
    let failedCount = 0;

    // Send reminders for each booking
    for (const booking of bookings as BookingReminder[]) {
      const userTokens = tokensByUser[booking.user_id] || [];

      // Create notification record
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: booking.user_id,
        type: "booking_reminder",
        title: "⏰ Booking Tomorrow!",
        body: `Your ${booking.sport || "game"} at ${booking.venue_name} is scheduled for ${booking.slot_time}`,
        data: {
          booking_id: booking.id,
          venue_name: booking.venue_name,
          slot_date: booking.slot_date,
          slot_time: booking.slot_time,
        },
      });

      if (notifError) {
        console.error(`Error creating notification for booking ${booking.id}:`, notifError);
      }

      // Send push notification if user has tokens
      if (userTokens.length > 0) {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              user_id: booking.user_id,
              title: "⏰ Booking Tomorrow!",
              body: `Your ${booking.sport || "game"} at ${booking.venue_name} is scheduled for ${booking.slot_time}`,
              data: { booking_id: booking.id, url: "/social/profile?scrollToBookings=true" },
            }),
          });

          if (response.ok) {
            sentCount++;
            console.log(`Push notification sent for booking ${booking.id}`);
          } else {
            failedCount++;
            const errorText = await response.text();
            console.error(`Failed to send push for booking ${booking.id}:`, errorText);
          }
        } catch (pushError) {
          failedCount++;
          console.error(`Push notification error for booking ${booking.id}:`, pushError);
        }
      } else {
        console.log(`No push tokens for user ${booking.user_id}, notification saved to DB only`);
      }
    }

    console.log(`Reminders complete: ${sentCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        message: "Booking reminders processed",
        total: bookings.length,
        sent: sentCount,
        failed: failedCount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-booking-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});