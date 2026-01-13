// Admin Bookings API - Booking management for admin dashboard
// Endpoints: GET (list all bookings), PATCH (cancel/refund)

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
      // List bookings with filtering
      const status = url.searchParams.get("status"); // 'confirmed' | 'cancelled' | null
      const venueId = url.searchParams.get("venue_id");
      const userId = url.searchParams.get("user_id");
      const dateFrom = url.searchParams.get("date_from");
      const dateTo = url.searchParams.get("date_to");
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
      const offset = (page - 1) * limit;

      let query = supabase
        .from("bookings")
        .select("*", { count: "exact" });

      // Apply filters
      if (status) {
        query = query.eq("status", status);
      }
      if (venueId) {
        query = query.eq("venue_id", venueId);
      }
      if (userId) {
        query = query.eq("user_id", userId);
      }
      if (dateFrom) {
        query = query.gte("slot_date", dateFrom);
      }
      if (dateTo) {
        query = query.lte("slot_date", dateTo);
      }

      // Apply pagination and ordering
      query = query
        .range(offset, offset + limit - 1)
        .order("created_at", { ascending: false });

      const { data: bookings, error, count } = await query;

      if (error) {
        console.error("Error fetching bookings:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch bookings" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get user profiles for bookings
      const userIds = [...new Set(bookings?.map(b => b.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const bookingsWithUsers = bookings?.map(booking => ({
        ...booking,
        user_profile: profileMap.get(booking.user_id) || null
      }));

      return new Response(
        JSON.stringify({
          bookings: bookingsWithUsers,
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
      const { bookingId, action, reason } = await req.json();

      if (!bookingId) {
        return new Response(
          JSON.stringify({ error: "bookingId is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "cancel") {
        const { error } = await supabase
          .from("bookings")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            cancellation_reason: reason || "Cancelled by admin"
          })
          .eq("id", bookingId);

        if (error) {
          console.error("Error cancelling booking:", error);
          return new Response(
            JSON.stringify({ error: "Failed to cancel booking" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logAdminAction(auth.userId!, "booking_cancelled", "booking", bookingId, { reason });

        return new Response(
          JSON.stringify({ success: true, message: "Booking cancelled" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "refund") {
        // Get the booking first
        const { data: booking, error: fetchError } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .single();

        if (fetchError || !booking) {
          return new Response(
            JSON.stringify({ error: "Booking not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Update payment to refunded status
        const { error: paymentError } = await supabase
          .from("payments")
          .update({
            refund_status: "refunded",
            refund_amount: booking.price,
            refunded_at: new Date().toISOString()
          })
          .eq("booking_id", bookingId);

        if (paymentError) {
          console.error("Error processing refund:", paymentError);
          return new Response(
            JSON.stringify({ error: "Failed to process refund" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Also cancel the booking
        await supabase
          .from("bookings")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            cancellation_reason: reason || "Refunded by admin"
          })
          .eq("id", bookingId);

        await logAdminAction(auth.userId!, "booking_refunded", "booking", bookingId, { 
          amount: booking.price,
          reason 
        });

        return new Response(
          JSON.stringify({ success: true, message: "Booking refunded" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Admin bookings error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
