// Admin Users API - User management for admin dashboard
// Endpoints: GET (list/search users), PATCH (update user status/role)

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
      // List/search users with pagination
      const search = url.searchParams.get("search") || "";
      const status = url.searchParams.get("status"); // 'active' | 'inactive' | null
      const role = url.searchParams.get("role"); // 'admin' | 'moderator' | 'user' | null
      const page = parseInt(url.searchParams.get("page") || "1");
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
      const offset = (page - 1) * limit;

      // Build query for profiles
      let query = supabase
        .from("profiles")
        .select(`
          *,
          user_roles (role)
        `, { count: "exact" });

      // Apply search filter
      if (search) {
        query = query.or(`display_name.ilike.%${search}%,username.ilike.%${search}%`);
      }

      // Apply status filter
      if (status === "active") {
        query = query.eq("is_active", true);
      } else if (status === "inactive") {
        query = query.eq("is_active", false);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1).order("created_at", { ascending: false });

      const { data: profiles, error: profilesError, count } = await query;

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch users" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Filter by role if specified (post-query filter due to join complexity)
      let filteredProfiles = profiles || [];
      if (role) {
        filteredProfiles = filteredProfiles.filter(p => 
          p.user_roles?.some((r: { role: string }) => r.role === role)
        );
      }

      // Get auth user emails via admin API
      const userIds = filteredProfiles.map(p => p.user_id);
      const usersWithEmail = await Promise.all(
        filteredProfiles.map(async (profile) => {
          const { data: authUser } = await supabase.auth.admin.getUserById(profile.user_id);
          return {
            ...profile,
            email: authUser?.user?.email || null,
            phone: authUser?.user?.phone || null,
            last_sign_in: authUser?.user?.last_sign_in_at || null,
            created_at_auth: authUser?.user?.created_at || null
          };
        })
      );

      return new Response(
        JSON.stringify({
          users: usersWithEmail,
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
      const { userId, action, reason, role: newRole } = await req.json();

      if (!userId) {
        return new Response(
          JSON.stringify({ error: "userId is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Handle different admin actions
      if (action === "deactivate") {
        const { error } = await supabase
          .from("profiles")
          .update({
            is_active: false,
            deactivated_at: new Date().toISOString(),
            deactivation_reason: reason || null
          })
          .eq("user_id", userId);

        if (error) {
          console.error("Error deactivating user:", error);
          return new Response(
            JSON.stringify({ error: "Failed to deactivate user" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logAdminAction(auth.userId!, "user_deactivated", "user", userId, { reason });

        return new Response(
          JSON.stringify({ success: true, message: "User deactivated" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "reactivate") {
        const { error } = await supabase
          .from("profiles")
          .update({
            is_active: true,
            deactivated_at: null,
            deactivation_reason: null
          })
          .eq("user_id", userId);

        if (error) {
          console.error("Error reactivating user:", error);
          return new Response(
            JSON.stringify({ error: "Failed to reactivate user" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logAdminAction(auth.userId!, "user_reactivated", "user", userId, {});

        return new Response(
          JSON.stringify({ success: true, message: "User reactivated" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "set_role" && newRole) {
        // First, remove existing roles for this user
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId);

        // Then add the new role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });

        if (error) {
          console.error("Error setting role:", error);
          return new Response(
            JSON.stringify({ error: "Failed to set user role" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await logAdminAction(auth.userId!, "role_changed", "user", userId, { new_role: newRole });

        return new Response(
          JSON.stringify({ success: true, message: `User role set to ${newRole}` }),
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
    console.error("Admin users error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
