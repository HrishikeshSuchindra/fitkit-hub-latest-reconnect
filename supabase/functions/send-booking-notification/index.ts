import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

  try {
    const data: BookingNotificationData = await req.json();
    console.log("Processing booking notification for:", data.bookingId);

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
    // This function handles VAPID signing and Web Push protocol
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

    const pushResult = await pushResponse.json();
    console.log("Push notification result:", pushResult);

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
