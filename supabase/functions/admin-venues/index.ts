// Admin Venues API - Venue management for admin dashboard
// Endpoints: GET (list venues), POST (create), PATCH (update), DELETE (deactivate)

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
      // List venues with filtering
      const category = url.searchParams.get("category");
      const sport = url.searchParams.get("sport");
      const isActive = url.searchParams.get("is_active");
      const search = url.searchParams.get("search");
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
      const offset = (page - 1) * limit;

      let query = supabase
        .from("venues")
        .select("*", { count: "exact" });

      // Apply filters
      if (category) {
        query = query.eq("category", category);
      }
      if (sport) {
        query = query.eq("sport", sport);
      }
      if (isActive !== null && isActive !== undefined) {
        query = query.eq("is_active", isActive === "true");
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%,city.ilike.%${search}%`);
      }

      // Apply pagination and ordering
      query = query
        .range(offset, offset + limit - 1)
        .order("created_at", { ascending: false });

      const { data: venues, error, count } = await query;

      if (error) {
        console.error("Error fetching venues:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch venues" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          venues,
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

    if (req.method === "POST") {
      const venueData = await req.json();

      // Validate required fields
      const requiredFields = ["name", "slug", "sport", "address", "city", "price_per_hour"];
      for (const field of requiredFields) {
        if (!venueData[field]) {
          return new Response(
            JSON.stringify({ error: `${field} is required` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const { data: venue, error } = await supabase
        .from("venues")
        .insert({
          name: venueData.name,
          slug: venueData.slug,
          sport: venueData.sport,
          category: venueData.category || "courts",
          description: venueData.description,
          address: venueData.address,
          city: venueData.city,
          latitude: venueData.latitude,
          longitude: venueData.longitude,
          price_per_hour: venueData.price_per_hour,
          total_courts: venueData.total_courts || 1,
          image_url: venueData.image_url,
          gallery_urls: venueData.gallery_urls,
          amenities: venueData.amenities,
          opening_time: venueData.opening_time || "06:00",
          closing_time: venueData.closing_time || "22:00",
          is_active: venueData.is_active !== false
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating venue:", error);
        return new Response(
          JSON.stringify({ error: "Failed to create venue", details: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await logAdminAction(auth.userId!, "venue_created", "venue", venue.id, { name: venue.name });

      return new Response(
        JSON.stringify({ success: true, venue }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "PATCH") {
      const { venueId, ...updateData } = await req.json();

      if (!venueId) {
        return new Response(
          JSON.stringify({ error: "venueId is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Remove undefined values
      const cleanUpdateData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(updateData)) {
        if (value !== undefined) {
          cleanUpdateData[key] = value;
        }
      }

      cleanUpdateData.updated_at = new Date().toISOString();

      const { data: venue, error } = await supabase
        .from("venues")
        .update(cleanUpdateData)
        .eq("id", venueId)
        .select()
        .single();

      if (error) {
        console.error("Error updating venue:", error);
        return new Response(
          JSON.stringify({ error: "Failed to update venue" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await logAdminAction(auth.userId!, "venue_updated", "venue", venueId, { changes: Object.keys(cleanUpdateData) });

      return new Response(
        JSON.stringify({ success: true, venue }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "DELETE") {
      const { venueId, permanent } = await req.json();

      if (!venueId) {
        return new Response(
          JSON.stringify({ error: "venueId is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (permanent) {
        // Hard delete (use with caution)
        const { error } = await supabase
          .from("venues")
          .delete()
          .eq("id", venueId);

        if (error) {
          console.error("Error deleting venue:", error);
          return new Response(
            JSON.stringify({ error: "Failed to delete venue" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logAdminAction(auth.userId!, "venue_deleted", "venue", venueId, { permanent: true });
      } else {
        // Soft delete (deactivate)
        const { error } = await supabase
          .from("venues")
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq("id", venueId);

        if (error) {
          console.error("Error deactivating venue:", error);
          return new Response(
            JSON.stringify({ error: "Failed to deactivate venue" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logAdminAction(auth.userId!, "venue_deactivated", "venue", venueId, {});
      }

      return new Response(
        JSON.stringify({ success: true, message: permanent ? "Venue deleted" : "Venue deactivated" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Admin venues error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
