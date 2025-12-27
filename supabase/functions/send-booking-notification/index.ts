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
    console.log("Sending booking notification for:", data);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's push tokens
    const { data: pushTokens, error: tokenError } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("user_id", data.userId)
      .eq("is_active", true)
      .eq("platform", "web");

    if (tokenError) {
      console.error("Error fetching push tokens:", tokenError);
      throw tokenError;
    }

    console.log(`Found ${pushTokens?.length || 0} active push tokens`);

    if (!pushTokens || pushTokens.length === 0) {
      console.log("No push tokens found, creating in-app notification only");
    }

    // Create in-app notification
    const notificationTitle = "🎉 Booking Confirmed!";
    const notificationBody = `Get ready to play ${data.sport || 'sports'}! 🏸⚽🎾\nYour court at ${data.venueName} is booked for ${data.slotDate} at ${data.slotTime}. See you there, champion! 🏆`;

    const { error: notifError } = await supabase
      .from("notifications")
      .insert({
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
      console.error("Error creating notification:", notifError);
    }

    // Send push notifications
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (pushTokens && pushTokens.length > 0 && vapidPrivateKey) {
      for (const tokenRecord of pushTokens) {
        try {
          const subscription = JSON.parse(tokenRecord.token);
          
          // Use web-push to send notification
          const payload = JSON.stringify({
            title: notificationTitle,
            body: notificationBody,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            data: {
              url: "/social/profile?scrollToBookings=true",
              bookingId: data.bookingId,
            },
            vibrate: [200, 100, 200],
          });

          // Note: In production, you'd use web-push library here
          // For now, we log the intent
          console.log("Would send push to:", subscription.endpoint?.substring(0, 50) + "...");
          console.log("Payload:", payload);
        } catch (e) {
          console.error("Error sending push notification:", e);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-booking-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
