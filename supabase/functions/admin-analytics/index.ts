// Admin Analytics API - Dashboard statistics for admin
// Endpoints: GET (dashboard stats, revenue, user growth)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  requireAdmin, 
  createServiceClient,
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
      const type = url.searchParams.get("type") || "overview";
      const period = url.searchParams.get("period") || "30d"; // 7d, 30d, 90d, 365d
      
      // Calculate date range
      const now = new Date();
      let daysBack = 30;
      if (period === "7d") daysBack = 7;
      else if (period === "90d") daysBack = 90;
      else if (period === "365d") daysBack = 365;
      
      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
      const startDateStr = startDate.toISOString().split("T")[0];

      if (type === "overview") {
        // Get total counts
        const [
          { count: totalUsers },
          { count: totalBookings },
          { count: totalVenues },
          { count: totalEvents },
          { count: activeUsers },
          { count: newUsersThisPeriod },
          { count: bookingsThisPeriod },
        ] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
          supabase.from("venues").select("*", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("events").select("*", { count: "exact", head: true }).neq("status", "cancelled"),
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", startDateStr),
          supabase.from("bookings").select("*", { count: "exact", head: true }).gte("created_at", startDateStr).eq("status", "confirmed"),
        ]);

        // Get revenue for the period
        const { data: payments } = await supabase
          .from("payments")
          .select("amount, status")
          .gte("created_at", startDateStr)
          .eq("status", "completed");

        const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

        // Get recent activity
        const { data: recentBookings } = await supabase
          .from("bookings")
          .select("id, venue_name, slot_date, created_at, status")
          .order("created_at", { ascending: false })
          .limit(5);

        const { data: recentUsers } = await supabase
          .from("profiles")
          .select("id, display_name, username, created_at")
          .order("created_at", { ascending: false })
          .limit(5);

        return new Response(
          JSON.stringify({
            overview: {
              totalUsers: totalUsers || 0,
              activeUsers: activeUsers || 0,
              totalBookings: totalBookings || 0,
              totalVenues: totalVenues || 0,
              totalEvents: totalEvents || 0,
              newUsersThisPeriod: newUsersThisPeriod || 0,
              bookingsThisPeriod: bookingsThisPeriod || 0,
              totalRevenue,
              period
            },
            recentActivity: {
              bookings: recentBookings || [],
              users: recentUsers || []
            }
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (type === "revenue") {
        // Get daily revenue breakdown
        const { data: payments } = await supabase
          .from("payments")
          .select("amount, created_at, status")
          .gte("created_at", startDateStr)
          .eq("status", "completed")
          .order("created_at", { ascending: true });

        // Group by date
        const dailyRevenue = new Map<string, number>();
        payments?.forEach(p => {
          const date = p.created_at.split("T")[0];
          dailyRevenue.set(date, (dailyRevenue.get(date) || 0) + Number(p.amount || 0));
        });

        const revenueData = Array.from(dailyRevenue.entries()).map(([date, amount]) => ({
          date,
          amount
        }));

        return new Response(
          JSON.stringify({ revenue: revenueData, period }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (type === "users") {
        // Get user growth data
        const { data: profiles } = await supabase
          .from("profiles")
          .select("created_at")
          .gte("created_at", startDateStr)
          .order("created_at", { ascending: true });

        // Group by date
        const dailySignups = new Map<string, number>();
        profiles?.forEach(p => {
          const date = p.created_at.split("T")[0];
          dailySignups.set(date, (dailySignups.get(date) || 0) + 1);
        });

        const signupData = Array.from(dailySignups.entries()).map(([date, count]) => ({
          date,
          count
        }));

        return new Response(
          JSON.stringify({ signups: signupData, period }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (type === "bookings") {
        // Get booking trends
        const { data: bookings } = await supabase
          .from("bookings")
          .select("created_at, status, sport, venue_name")
          .gte("created_at", startDateStr)
          .order("created_at", { ascending: true });

        // Group by date
        const dailyBookings = new Map<string, number>();
        const sportCounts = new Map<string, number>();
        const venueCounts = new Map<string, number>();

        bookings?.forEach(b => {
          const date = b.created_at.split("T")[0];
          dailyBookings.set(date, (dailyBookings.get(date) || 0) + 1);
          
          if (b.sport) {
            sportCounts.set(b.sport, (sportCounts.get(b.sport) || 0) + 1);
          }
          if (b.venue_name) {
            venueCounts.set(b.venue_name, (venueCounts.get(b.venue_name) || 0) + 1);
          }
        });

        const bookingData = Array.from(dailyBookings.entries()).map(([date, count]) => ({
          date,
          count
        }));

        const topSports = Array.from(sportCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([sport, count]) => ({ sport, count }));

        const topVenues = Array.from(venueCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([venue, count]) => ({ venue, count }));

        return new Response(
          JSON.stringify({ 
            bookings: bookingData, 
            topSports,
            topVenues,
            period 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Invalid analytics type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Admin analytics error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
