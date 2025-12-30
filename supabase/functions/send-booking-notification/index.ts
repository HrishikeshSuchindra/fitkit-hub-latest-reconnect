import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createRateLimiter, RATE_LIMITS } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Standard rate limit: 60 per minute
const rateLimiter = createRateLimiter(RATE_LIMITS.standard);

interface BookingNotificationData {
  userId: string;
  bookingId: string;
  venueName: string;
  sport: string;
  slotDate: string;
  slotTime: string;
  price: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting
  const limitResponse = rateLimiter(req);
  if (limitResponse) {
    console.log("Rate limit exceeded for booking notification");
    return new Response(limitResponse.body, {
      status: limitResponse.status,
      headers: { ...corsHeaders, ...Object.fromEntries(limitResponse.headers.entries()) },
    });
  }

  try {
    const data: BookingNotificationData = await req.json();
    console.log("Processing booking notification for:", data.bookingId);

    if (!data.userId || !data.bookingId) {
      console.error("Missing required fields: userId or bookingId");
      return new Response(
        JSON.stringify({ error: "userId and bookingId are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create in-app notification (always)
    const notificationTitle = "🎉 Booking Confirmed!";
    const notificationBody = `Get ready to play ${data.sport || "sports"}! 🏸⚽🎾\nYour slot at ${data.venueName} is booked for ${data.slotDate} at ${data.slotTime}. See you there, champion! 🏆`;

    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: data.userId,
      type: "booking_confirmed",
      title: notificationTitle,
      body: notificationBody,
      data: {
        bookingId: data.bookingId,
        venueName: data.venueName,
        sport: data.sport,
        slotDate: data.slotDate,
        slotTime: data.slotTime,
        price: data.price,
      },
    });

    if (notifError) {
      console.error("Error creating in-app notification:", notifError);
    } else {
      console.log("In-app notification created successfully");
    }

    // Send device push notification via the send-push-notification function
    let pushResult = { success: false, message: "Not attempted" };
    try {
      const pushResponse = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          user_id: data.userId,
          title: notificationTitle,
          body: notificationBody,
          icon: "/favicon.ico",
          data: {
            url: "/social/profile?scrollToBookings=true",
            bookingId: data.bookingId,
          },
        }),
      });

      pushResult = await pushResponse.json();
      console.log("Push notification result:", pushResult);
    } catch (pushError) {
      console.error("Error calling push notification function:", pushError);
      pushResult = { success: false, message: String(pushError) };
    }

    return new Response(
      JSON.stringify({
        success: true,
        inAppNotification: !notifError,
        pushNotification: pushResult,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-booking-notification:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);