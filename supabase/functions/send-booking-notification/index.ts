import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

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

const VAPID_PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: BookingNotificationData = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create in-app notification (always)
    const notificationTitle = "🎉 Booking Confirmed!";
    const notificationBody = `Get ready to play ${data.sport || "sports"}! 🏸⚽🎾\nYour slot at ${data.venueName} is booked for ${data.slotDate} at ${data.slotTime}. See you there, champion! 🏆`;

    await supabase.from("notifications").insert({
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

    // Get user's push tokens
    const { data: pushTokens, error: tokenError } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("user_id", data.userId)
      .eq("is_active", true)
      .eq("platform", "web");

    if (tokenError) throw tokenError;

    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    // If user never enabled notifications, we can't push to device.
    if (!pushTokens?.length || !vapidPrivateKey) {
      return new Response(JSON.stringify({
        success: true,
        pushed: 0,
        reason: !pushTokens?.length ? "no_tokens" : "missing_vapid_private_key",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    webpush.setVapidDetails(
      "mailto:hrishikeshsuchindra@gmail.com",
      VAPID_PUBLIC_KEY,
      vapidPrivateKey,
    );

    const payload = JSON.stringify({
      title: notificationTitle,
      body: notificationBody,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: {
        url: "/social/profile?scrollToBookings=true",
        bookingId: data.bookingId,
      },
    });

    const results = await Promise.all(
      pushTokens.map(async (t) => {
        try {
          const subscription = JSON.parse(t.token);
          await webpush.sendNotification(subscription, payload);
          return { success: true };
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("Push send failed:", msg);
          return { success: false, error: msg };
        }
      })
    );

    const pushed = results.filter((r) => r.success).length;

    return new Response(JSON.stringify({ success: true, pushed, results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-booking-notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);

