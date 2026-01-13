// Admin Events API - Event management for admin dashboard
// Endpoints: GET (list events), PATCH (approve/cancel), DELETE

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  requireAdmin, 
  createServiceClient, 
  logAdminAction,
  corsHeaders 
} from "../_shared/auth-middleware.ts";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require admin role for all operations
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const supabase = createServiceClient();
  const url = new URL(req.url);

  try {
    if (req.method === "GET") {
      // List events with filtering
      const status = url.searchParams.get("status"); // 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
      const sport = url.searchParams.get("sport");
      const eventType = url.searchParams.get("event_type");
      const hostId = url.searchParams.get("host_id");
      const dateFrom = url.searchParams.get("date_from");
      const dateTo = url.searchParams.get("date_to");
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
      const offset = (page - 1) * limit;

      let query = supabase
        .from("events")
        .select("*", { count: "exact" });

      // Apply filters
      if (status) {
        query = query.eq("status", status);
      }
      if (sport) {
        query = query.eq("sport", sport);
      }
      if (eventType) {
        query = query.eq("event_type", eventType);
      }
      if (hostId) {
        query = query.eq("host_id", hostId);
      }
      if (dateFrom) {
        query = query.gte("event_date", dateFrom);
      }
      if (dateTo) {
        query = query.lte("event_date", dateTo);
      }

      // Apply pagination and ordering
      query = query
        .range(offset, offset + limit - 1)
        .order("event_date", { ascending: false });

      const { data: events, error, count } = await query;

      if (error) {
        console.error("Error fetching events:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch events" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get host profiles
      const hostIds = [...new Set(events?.map(e => e.host_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .in("user_id", hostIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Get registration counts
      const eventIds = events?.map(e => e.id) || [];
      const { data: registrations } = await supabase
        .from("event_registrations")
        .select("event_id, status")
        .in("event_id", eventIds);

      const registrationCounts = new Map<string, number>();
      registrations?.forEach(r => {
        if (r.status === "registered") {
          registrationCounts.set(r.event_id, (registrationCounts.get(r.event_id) || 0) + 1);
        }
      });

      const eventsWithDetails = events?.map(event => ({
        ...event,
        host_profile: profileMap.get(event.host_id) || null,
        registered_count: registrationCounts.get(event.id) || 0
      }));

      return new Response(
        JSON.stringify({
          events: eventsWithDetails,
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "PATCH") {
      const { eventId, action, reason, featured } = await req.json();

      if (!eventId) {
        return new Response(
          JSON.stringify({ error: "eventId is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "cancel") {
        const { error } = await supabase
          .from("events")
          .update({ 
            status: "cancelled",
            updated_at: new Date().toISOString()
          })
          .eq("id", eventId);

        if (error) {
          console.error("Error cancelling event:", error);
          return new Response(
            JSON.stringify({ error: "Failed to cancel event" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Cancel all registrations
        await supabase
          .from("event_registrations")
          .update({ status: "cancelled" })
          .eq("event_id", eventId);

        await logAdminAction(auth.userId!, "event_cancelled", "event", eventId, { reason });

        return new Response(
          JSON.stringify({ success: true, message: "Event cancelled" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "feature") {
        const { error } = await supabase
          .from("events")
          .update({ 
            is_featured: featured !== false,
            updated_at: new Date().toISOString()
          })
          .eq("id", eventId);

        if (error) {
          console.error("Error updating featured status:", error);
          return new Response(
            JSON.stringify({ error: "Failed to update featured status" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logAdminAction(auth.userId!, "event_featured", "event", eventId, { featured: featured !== false });

        return new Response(
          JSON.stringify({ success: true, message: featured !== false ? "Event featured" : "Event unfeatured" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "update_status") {
        const { status } = await req.json();
        
        const { error } = await supabase
          .from("events")
          .update({ 
            status,
            updated_at: new Date().toISOString()
          })
          .eq("id", eventId);

        if (error) {
          console.error("Error updating event status:", error);
          return new Response(
            JSON.stringify({ error: "Failed to update event status" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logAdminAction(auth.userId!, "event_status_changed", "event", eventId, { new_status: status });

        return new Response(
          JSON.stringify({ success: true, message: `Event status updated to ${status}` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "DELETE") {
      const { eventId } = await req.json();

      if (!eventId) {
        return new Response(
          JSON.stringify({ error: "eventId is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // First cancel all registrations
      await supabase
        .from("event_registrations")
        .delete()
        .eq("event_id", eventId);

      // Then delete the event
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) {
        console.error("Error deleting event:", error);
        return new Response(
          JSON.stringify({ error: "Failed to delete event" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await logAdminAction(auth.userId!, "event_deleted", "event", eventId, {});

      return new Response(
        JSON.stringify({ success: true, message: "Event deleted" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Admin events error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
