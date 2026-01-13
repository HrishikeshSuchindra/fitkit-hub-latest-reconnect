import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  recipientUserId: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate service role key for internal functions OR validate user JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    
    // Check if this is a service role call (internal) or user call
    const isServiceRoleCall = token === supabaseServiceKey;
    let callerUserId: string | null = null;

    if (!isServiceRoleCall) {
      // Validate user JWT
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: "Invalid authentication" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      callerUserId = user.id;
    }

    const { recipientUserId, type, title, body, data }: NotificationRequest = await req.json();

    // Validate required fields
    if (!recipientUserId || !type || !title) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: recipientUserId, type, title" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For user calls, validate they can create this notification type
    if (!isServiceRoleCall) {
      const allowedTypes = ['friend_request', 'friend_accepted'];
      if (!allowedTypes.includes(type)) {
        return new Response(
          JSON.stringify({ error: "Unauthorized notification type" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // For friend notifications, verify the caller is the friend in the data
      if (type === 'friend_request' || type === 'friend_accepted') {
        if (data?.friend_id !== callerUserId) {
          return new Response(
            JSON.stringify({ error: "Cannot create notification for another user" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Create the notification using service role (bypasses RLS)
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        user_id: recipientUserId,
        type,
        title,
        body,
        data,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      throw error;
    }

    console.log(`Notification created: ${notification.id} for user ${recipientUserId}`);

    return new Response(
      JSON.stringify({ success: true, notification }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in create-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
