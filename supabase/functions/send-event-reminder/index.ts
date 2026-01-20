import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { createRateLimiter, RATE_LIMITS } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Standard rate limit: 60 per minute
const rateLimiter = createRateLimiter(RATE_LIMITS.standard);

interface EventData {
  id: string;
  title: string;
  sport: string;
  event_date: string;
  start_time: string;
  location: string;
  image_url: string | null;
}

interface EventRegistration {
  id: string;
  user_id: string;
  event_id: string;
  tickets_count: number;
  events: EventData | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting
  const limitResponse = rateLimiter(req);
  if (limitResponse) {
    console.log("Rate limit exceeded for event reminder");
    return new Response(limitResponse.body, {
      status: limitResponse.status,
      headers: { ...corsHeaders, ...Object.fromEntries(limitResponse.headers.entries()) },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Validate this is an internal service call (service role key required)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.includes(supabaseServiceKey)) {
      console.error("Unauthorized call to send-event-reminder");
      return new Response(
        JSON.stringify({ error: "Unauthorized - internal function only" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current time and time 24 hours from now
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    console.log(`Checking for events on ${tomorrowDate}`);

    // Fetch event registrations for events happening tomorrow
    const { data: registrations, error: registrationsError } = await supabase
      .from("event_registrations")
      .select(`
        id,
        user_id,
        event_id,
        tickets_count,
        events (
          id,
          title,
          sport,
          event_date,
          start_time,
          location,
          image_url
        )
      `)
      .eq("status", "registered")
      .eq("events.event_date", tomorrowDate);

    if (registrationsError) {
      console.error("Error fetching registrations:", registrationsError);
      throw registrationsError;
    }

    // Filter out registrations where event is null (date filter didn't match)
    const validRegistrations = ((registrations || []) as unknown as EventRegistration[]).filter(
      (r) => r.events !== null && r.events.event_date === tomorrowDate
    );

    if (validRegistrations.length === 0) {
      console.log("No event registrations found for tomorrow");
      return new Response(
        JSON.stringify({ message: "No events to remind", count: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${validRegistrations.length} event registrations for tomorrow`);

    // Get unique user IDs
    const userIds = [...new Set(validRegistrations.map((r) => r.user_id))];

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

    // Send reminders for each registration
    for (const registration of validRegistrations) {
      const event = registration.events!; // We already filtered out null events
      const userTokens = tokensByUser[registration.user_id] || [];

      // Create notification record
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: registration.user_id,
        type: "event_reminder",
        title: "🎯 Event Tomorrow!",
        body: `${event.title} starts at ${event.start_time} at ${event.location}`,
        data: {
          event_id: event.id,
          event_title: event.title,
          event_date: event.event_date,
          start_time: event.start_time,
          location: event.location,
          tickets_count: registration.tickets_count,
        },
      });

      if (notifError) {
        console.error(`Error creating notification for registration ${registration.id}:`, notifError);
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
              user_id: registration.user_id,
              title: "🎯 Event Tomorrow!",
              body: `${event.title} starts at ${event.start_time} at ${event.location}`,
              data: { event_id: event.id, url: "/social/my-events" },
            }),
          });

          if (response.ok) {
            sentCount++;
            console.log(`Push notification sent for registration ${registration.id}`);
          } else {
            failedCount++;
            const errorText = await response.text();
            console.error(`Failed to send push for registration ${registration.id}:`, errorText);
          }
        } catch (pushError) {
          failedCount++;
          console.error(`Push notification error for registration ${registration.id}:`, pushError);
        }
      } else {
        console.log(`No push tokens for user ${registration.user_id}, notification saved to DB only`);
      }
    }

    console.log(`Event reminders complete: ${sentCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        message: "Event reminders processed",
        total: validRegistrations.length,
        sent: sentCount,
        failed: failedCount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-event-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
